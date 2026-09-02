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

export class ProcessExecutor {
  constructor(private sandbox: WorkspaceSandbox) {}

  public async executeCommand(
    workspaceId: string,
    command: string,
    timeoutMs: number = 120000
  ): Promise<ProcessResult> {
    const cwd = this.sandbox.getWorkspaceRoot(workspaceId);

    // 1. Verify policy
    const policyResult = CommandPolicy.evaluateCommand(command);
    if (!policyResult.isAllowed) {
      throw new Error(`Command blocked by security policy: ${policyResult.reason}`);
    }

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'powershell.exe' : '/bin/bash';
      const args = isWindows ? ['-NoProfile', '-NonInteractive', '-Command', command] : ['-c', command];

      const child: ChildProcess = spawn(shell, args, {
        cwd,
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
}
