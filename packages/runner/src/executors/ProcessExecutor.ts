import { spawn, ChildProcess } from 'child_process';
import { WorkspaceSandbox } from '../sandbox/WorkspaceSandbox';
import { CommandPolicy, SecretProtection } from '@gideon/policy';
import { KillSwitch } from '../KillSwitch';

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface StructuredCommand {
  executable: string;
  args: string[];
}

export class ProcessExecutor {
  constructor(private sandbox: WorkspaceSandbox) {}

  public async executeCommand(
    workspaceId: string,
    command: string,
    timeoutMs: number = 120000
  ): Promise<ProcessResult> {
    const cwd = this.sandbox.getWorkspaceRoot(workspaceId);

    // 1. Verify policy against CommandPolicy allowlist
    const policyResult = CommandPolicy.evaluateCommand(command);
    if (!policyResult.isAllowed) {
      throw new Error(`Command blocked by security policy: ${policyResult.reason}`);
    }

    // 2. Parse command into structured binary + arguments (shell: false)
    const structured = this.parseCommand(command);

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    return new Promise((resolve, reject) => {
      // Execute directly without shell interpretation to eliminate shell injection
      // Note: On Windows, Node.js enforces shell: true for .cmd and .bat batch files (CVE-2024-27980)
      const isBatchFile = process.platform === 'win32' && 
        (structured.executable.toLowerCase().endsWith('.cmd') || structured.executable.toLowerCase().endsWith('.bat'));

      const child: ChildProcess = isBatchFile
        ? spawn([structured.executable, ...structured.args].join(' '), {
            cwd,
            shell: true,
            env: { ...process.env, CI: 'true', NODE_ENV: 'test' }
          })
        : spawn(structured.executable, structured.args, {
            cwd,
            shell: false,
            env: { ...process.env, CI: 'true', NODE_ENV: 'test' }
          });

      if (child.pid) {
        KillSwitch.trackProcess(child.pid, child);
      }

      const timer = setTimeout(() => {
        if (child.pid) {
          KillSwitch.killProcess(child.pid);
        }
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
      }, timeoutMs);

      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
        if (stdout.length > 10 * 1024 * 1024) {
          // 10MB limit
          child.kill();
          reject(new Error('Process output buffer exceeded 10MB limit.'));
        }
      });

      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (child.pid) {
          KillSwitch.untrackProcess(child.pid);
        }

        resolve({
          stdout: SecretProtection.redactSecrets(stdout),
          stderr: SecretProtection.redactSecrets(stderr),
          exitCode: code ?? 0,
          durationMs: Date.now() - startTime
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        if (child.pid) {
          KillSwitch.untrackProcess(child.pid);
        }
        reject(err);
      });
    });
  }

  private parseCommand(command: string): StructuredCommand {
    // Standard command parser splitting on whitespace while respecting quotes
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current.length > 0) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current.length > 0) {
      parts.push(current);
    }

    if (parts.length === 0) {
      throw new Error('Invalid empty command.');
    }

    let executable = parts[0];
    const args = parts.slice(1);

    // On Windows, resolve npm, npx, node executables correctly if extension is missing
    if (process.platform === 'win32' && !executable.endsWith('.cmd') && !executable.endsWith('.exe')) {
      if (executable === 'npm' || executable === 'npx' || executable === 'pnpm' || executable === 'tsc') {
        executable = `${executable}.cmd`;
      }
    }

    return { executable, args };
  }
}
