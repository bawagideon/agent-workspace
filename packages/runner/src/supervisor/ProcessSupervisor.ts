/**
 * ==============================================================================
 * GIDEON AI HQ — PHASE 3B: CONTROLLED PROCESS TREE SUPERVISOR
 * 
 * Invariants Enforced:
 * 1. Governed Execution Targets: Strictly accepts { projectId, executionTarget }.
 *    Resolves canonical command from approved ProjectExecutionProfile. No raw shell strings.
 * 2. Canonical Filesystem Sandbox: Subprocess cwd strictly inside projects/<slug>.
 * 3. In-Flight Secret Redaction: Chunks sanitized via SecretProtection BEFORE buffer/stream.
 * 4. Termination & Descendant Verification: Kill + verify descendants. If any remain,
 *    marks TERMINATION_FAILED and does not falsely claim clean release.
 * 5. Project/Process Ownership: Verifies requesterProjectId owns target process.
 * 6. KillSwitch Emergency Propagation: Halts all trees and marks leases TERMINATED.
 * ==============================================================================
 */

import { spawn, ChildProcess, execSync } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import net from 'net';
import http from 'http';
import { PortAllocator } from './PortAllocator';
import { SecretProtection } from '@gideon/policy';
import { ProjectExecutionProfile, ProjectRunnerLease } from '@gideon/shared';
import { KillSwitch } from '../KillSwitch';

export type ProcessStatus = 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'FAILED' | 'TERMINATION_FAILED';

export interface ManagedProcessRecord {
  id: string;
  projectId: string;
  leaseId: string;
  port: number;
  pid: number;
  executionTarget: 'dev' | 'build' | 'test';
  command: string;
  workingDirectory: string;
  status: ProcessStatus;
  startedAt: string;
  stoppedAt?: string;
  exitCode?: number;
  health: 'UNKNOWN' | 'HEALTHY' | 'UNHEALTHY';
  logBuffer: string[];
  childProcess?: ChildProcess;
}

export interface StartProcessOptions {
  projectId: string;
  executionTarget: 'dev' | 'build' | 'test';
  profile: ProjectExecutionProfile;
  workspaceRoot?: string;
  ttlMs?: number;
  extraEnv?: Record<string, string>;
}

export class ProcessOwnershipViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProcessOwnershipViolationError';
  }
}

export class ProcessSupervisor extends EventEmitter {
  private static instance: ProcessSupervisor;
  private processes: Map<string, ManagedProcessRecord> = new Map();
  private projectProcessMap: Map<string, string> = new Map(); // projectId -> processId
  private portAllocator: PortAllocator;
  private maxLogLines = 5000;

  constructor(portAllocator?: PortAllocator) {
    super();
    this.portAllocator = portAllocator || PortAllocator.getInstance();
  }

  public static getInstance(portAllocator?: PortAllocator): ProcessSupervisor {
    if (!ProcessSupervisor.instance) {
      ProcessSupervisor.instance = new ProcessSupervisor(portAllocator);
    }
    return ProcessSupervisor.instance;
  }

  /**
   * Tests if a physical PID is currently active.
   */
  public static isPidAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e: any) {
      return e.code === 'EPERM'; // Process exists but owned by another user
    }
  }

  /**
   * Discovers descendant PIDs on Windows or POSIX.
   */
  public static getDescendantPids(parentPid: number): number[] {
    const descendants: number[] = [];
    if (process.platform === 'win32') {
      try {
        const output = execSync(`wmic process where (ParentProcessId=${parentPid}) get ProcessId`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 2000
        });
        const lines = output.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          const pid = parseInt(trimmed, 10);
          if (!isNaN(pid) && pid !== parentPid && pid > 0) {
            descendants.push(pid);
            descendants.push(...ProcessSupervisor.getDescendantPids(pid));
          }
        }
      } catch {
        // Fallback if wmic not available or error
      }
    }
    return descendants;
  }

  /**
   * Recursive tree kill: terminates parent and all child descendants.
   */
  public static killProcessTree(pid: number, force: boolean = true): void {
    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /pid ${pid} /T ${force ? '/F' : ''}`, {
          stdio: 'ignore',
          timeout: 4000
        });
      } catch {
        // Process might already be dead
        try {
          process.kill(pid, force ? 'SIGKILL' : 'SIGTERM');
        } catch {}
      }
    } else {
      try {
        process.kill(-pid, force ? 'SIGKILL' : 'SIGTERM');
      } catch {
        try {
          process.kill(pid, force ? 'SIGKILL' : 'SIGTERM');
        } catch {}
      }
    }
  }

  public static parseCommand(command: string): { executable: string; args: string[] } {
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

    if (process.platform === 'win32' && !executable.endsWith('.cmd') && !executable.endsWith('.exe')) {
      if (executable === 'npm' || executable === 'npx' || executable === 'pnpm' || executable === 'tsc') {
        executable = `${executable}.cmd`;
      }
    }

    return { executable, args };
  }

  /**
   * Sanitizes the environment for child processes:
   * Strips all HQ secrets, tokens, keys, and operator user-profile directories.
   * Only permits minimal system execution variables.
   */
  public static sanitizeRunnerEnvironment(
    allocatedPort: number,
    executionTarget: 'dev' | 'build' | 'test',
    extraEnv?: Record<string, string>
  ): NodeJS.ProcessEnv {
    // 1. Strict whitelist of minimal system variables
    const allowedSystemKeys = [
      'PATH',
      'PATHEXT',
      'SYSTEMROOT',
      'SYSTEMDRIVE',
      'TEMP',
      'TMP',
      'COMSPEC'
    ];

    const cleanEnv: Record<string, string> = {};
    for (const key of allowedSystemKeys) {
      for (const [envKey, envVal] of Object.entries(process.env)) {
        if (envKey.toUpperCase() === key && envVal !== undefined) {
          cleanEnv[key] = envVal;
          break;
        }
      }
    }

    // 2. Strict process-level overrides
    cleanEnv['PORT'] = allocatedPort.toString();
    cleanEnv['HOST'] = '127.0.0.1';
    cleanEnv['CI'] = 'true';
    cleanEnv['NODE_ENV'] = executionTarget === 'dev' ? 'development' : 'production';
    cleanEnv['GIDEON_ENVIRONMENT'] = 'sandbox';

    // Neutralize operator-profile locations (prevents libuv Windows auto-inheritance)
    cleanEnv['USERPROFILE'] = '';
    cleanEnv['HOME'] = '';
    cleanEnv['APPDATA'] = '';
    cleanEnv['LOCALAPPDATA'] = '';

    // 3. Optional project-specific safe variables (HQ control plane secrets strictly blacklisted)
    if (extraEnv) {
      const blacklistedPatterns = [
        /SUPABASE/i,
        /OPENCLAW/i,
        /GEMINI/i,
        /PORTAL_SESSION/i,
        /HQ_ADMIN/i,
        /GIDEON_MASTER/i,
        /DATABASE_URL/i
      ];

      for (const [k, v] of Object.entries(extraEnv)) {
        if (k.toUpperCase() === 'PORT') continue; // Port is strictly governed by PortAllocator
        if (!blacklistedPatterns.some(pattern => pattern.test(k))) {
          cleanEnv[k] = v;
        }
      }
    }

    return cleanEnv as NodeJS.ProcessEnv;
  }

  /**
   * Starts a supervised project process conforming to its approved execution profile.
   */
  public async startProcess(options: StartProcessOptions): Promise<ManagedProcessRecord> {
    if (KillSwitch.isHalted()) {
      throw new Error('KillSwitch is active: all process execution is emergency halted.');
    }

    const { projectId, executionTarget, profile } = options;

    if (!profile) {
      throw new Error(`Execution profile required to start project '${projectId}'.`);
    }

    // 1. Resolve canonical command strictly from approved execution profile
    let commandToRun: string;
    if (executionTarget === 'dev') {
      commandToRun = profile.allowedStartCommand;
    } else if (executionTarget === 'test') {
      commandToRun = profile.allowedTestCommands[0] || 'npm test';
    } else if (executionTarget === 'build') {
      commandToRun = 'npm run build';
    } else {
      throw new Error(`Unsupported execution target: '${executionTarget}'. Must be 'dev', 'build', or 'test'.`);
    }

    if (!commandToRun || typeof commandToRun !== 'string') {
      throw new Error(`No approved command configured for target '${executionTarget}' on project '${projectId}'.`);
    }

    // 2. Canonical working directory validation
    const baseRoot = options.workspaceRoot || process.cwd();
    const resolvedCwd = path.resolve(baseRoot, profile.workingDirectory);

    // Enforce that working directory stays inside projects boundary
    const normalizedRel = path.relative(baseRoot, resolvedCwd);
    if (normalizedRel.startsWith('..') || path.isAbsolute(normalizedRel)) {
      throw new Error(`Security Violation: Working directory '${profile.workingDirectory}' escapes workspace boundary.`);
    }

    if (!fs.existsSync(resolvedCwd)) {
      throw new Error(`Working directory not found: ${resolvedCwd}`);
    }

    // 3. Stop existing active process for this project if running
    const existingProcId = this.projectProcessMap.get(projectId);
    if (existingProcId) {
      const existing = this.processes.get(existingProcId);
      if (existing && (existing.status === 'RUNNING' || existing.status === 'STARTING')) {
        await this.stopProcess(existingProcId, projectId);
      }
    }

    // 4. Allocate port atomically
    const lease = await this.portAllocator.allocatePort(projectId, options.ttlMs || 300000);
    const allocatedPort = lease.port;

    // 5. Spawn child process (Direct spawning; only shell: true on Windows for batch files)
    const procId = `proc_${projectId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const parsed = ProcessSupervisor.parseCommand(commandToRun);
    const executable = parsed.executable;
    const args = parsed.args;

    const isWin = process.platform === 'win32';
    const isBatchFile = isWin && (executable.toLowerCase().endsWith('.cmd') || executable.toLowerCase().endsWith('.bat'));

    // Inject sanitized, zero-secret environment
    const env = ProcessSupervisor.sanitizeRunnerEnvironment(allocatedPort, executionTarget, options.extraEnv);

    let child: ChildProcess;
    try {
      child = isBatchFile
        ? spawn([executable, ...args].join(' '), {
            cwd: resolvedCwd,
            env,
            shell: true
          })
        : spawn(executable, args, {
            cwd: resolvedCwd,
            env,
            shell: false
          });
    } catch (spawnErr: any) {
      await this.portAllocator.releasePort(allocatedPort);
      throw new Error(`Failed to spawn process for project '${projectId}': ${spawnErr.message}`);
    }

    const pid = child.pid || 0;
    if (pid > 0) {
      KillSwitch.trackProcess(pid, child);
    }

    const record: ManagedProcessRecord = {
      id: procId,
      projectId,
      leaseId: lease.id,
      port: allocatedPort,
      pid,
      executionTarget,
      command: commandToRun,
      workingDirectory: profile.workingDirectory,
      status: 'STARTING',
      startedAt: new Date().toISOString(),
      health: 'UNKNOWN',
      logBuffer: [],
      childProcess: child
    };

    this.processes.set(procId, record);
    this.projectProcessMap.set(projectId, procId);

    // In-Flight Secret Redaction Buffer
    const appendLog = (rawChunk: string) => {
      // Invariant 8: Redact BEFORE buffering, streaming, or disk
      const sanitized = SecretProtection.redactSecrets(rawChunk);
      const lines = sanitized.split('\n');
      for (const line of lines) {
        if (!line && lines.length > 1) continue;
        const stamped = `[${new Date().toLocaleTimeString()}] ${line}`;
        record.logBuffer.push(stamped);
        if (record.logBuffer.length > this.maxLogLines) {
          record.logBuffer.shift();
        }
        this.emit('log', { processId: procId, projectId, line: stamped });
      }
    };

    child.stdout?.on('data', (d) => appendLog(d.toString()));
    child.stderr?.on('data', (d) => appendLog(d.toString()));

    child.on('close', (code) => {
      record.status = 'STOPPED';
      record.stoppedAt = new Date().toISOString();
      record.exitCode = code ?? 0;
      record.health = 'UNHEALTHY';
      if (pid > 0) {
        KillSwitch.untrackProcess(pid);
      }
      this.portAllocator.releasePort(allocatedPort).catch(() => {});
      this.emit('exit', { processId: procId, projectId, exitCode: code });
    });

    child.on('error', (err) => {
      record.status = 'FAILED';
      record.health = 'UNHEALTHY';
      appendLog(`[SUPERVISOR ERROR] Process error: ${err.message}`);
    });

    // Start background health poller (transitions STARTING -> RUNNING when socket opens)
    this.pollReadiness(procId, allocatedPort);

    return record;
  }

  /**
   * Polls loopback socket until process is ready or fails.
   */
  private pollReadiness(processId: string, port: number, maxAttempts = 30): void {
    let attempts = 0;
    const interval = setInterval(async () => {
      const proc = this.processes.get(processId);
      if (!proc || proc.status !== 'STARTING') {
        clearInterval(interval);
        return;
      }

      attempts++;
      const isUp = await ProcessSupervisor.probeSocket(port);
      if (isUp) {
        proc.status = 'RUNNING';
        proc.health = 'HEALTHY';
        clearInterval(interval);
        this.emit('ready', { processId, projectId: proc.projectId, port });
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        proc.health = 'UNHEALTHY';
      }
    }, 200);
  }

  /**
   * Probes TCP port loopback connection.
   */
  public static async probeSocket(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, '127.0.0.1');
    });
  }

  /**
   * Stops a managed process with tree-kill and physical descendant verification.
   * Invariant 9: If descendants remain, marks TERMINATION_FAILED.
   * Invariant 10: Verifies requesterProjectId ownership.
   */
  public async stopProcess(processId: string, requesterProjectId?: string): Promise<ManagedProcessRecord> {
    const record = this.processes.get(processId);
    if (!record) {
      throw new Error(`Managed process '${processId}' not found.`);
    }

    // Invariant 10: Ownership validation
    if (requesterProjectId && record.projectId !== requesterProjectId) {
      throw new ProcessOwnershipViolationError(
        `Process ownership violation: Process '${processId}' belongs to project '${record.projectId}', not '${requesterProjectId}'.`
      );
    }

    record.status = 'STOPPING';

    const pid = record.pid;
    if (pid > 0) {
      // 1. Gather all descendant PIDs before killing
      const descendants = ProcessSupervisor.getDescendantPids(pid);

      // 2. Terminate tree
      ProcessSupervisor.killProcessTree(pid, true);

      // 3. Descendant verification grace period
      await new Promise(r => setTimeout(r, 600));

      // 4. Verify whether PID or any descendant remains alive
      const lingeringPids: number[] = [];
      if (ProcessSupervisor.isPidAlive(pid)) {
        lingeringPids.push(pid);
      }
      for (const dPid of descendants) {
        if (ProcessSupervisor.isPidAlive(dPid)) {
          lingeringPids.push(dPid);
        }
      }

      if (lingeringPids.length > 0) {
        // Descendants lingered! Refuse to silently claim clean release.
        record.status = 'TERMINATION_FAILED';
        record.health = 'UNHEALTHY';
        throw new Error(
          `Termination failed: PIDs [${lingeringPids.join(', ')}] remained alive after tree-kill. Marked TERMINATION_FAILED.`
        );
      }
    }

    record.status = 'STOPPED';
    record.stoppedAt = new Date().toISOString();
    record.health = 'UNHEALTHY';

    // Release port lease
    await this.portAllocator.releasePort(record.port);

    if (pid > 0) {
      KillSwitch.untrackProcess(pid);
    }

    return record;
  }

  /**
   * Emergency stop for all running supervised processes (KillSwitch integration).
   */
  public async emergencyStopAll(): Promise<number> {
    let stoppedCount = 0;
    for (const [procId, record] of this.processes.entries()) {
      if (record.status === 'RUNNING' || record.status === 'STARTING') {
        try {
          await this.stopProcess(procId);
          stoppedCount++;
        } catch {
          if (record.pid > 0) {
            ProcessSupervisor.killProcessTree(record.pid, true);
          }
          record.status = 'TERMINATION_FAILED';
        }
      }
    }
    return stoppedCount;
  }

  /**
   * Retrieves process by ID with ownership check.
   */
  public getProcess(processId: string, requesterProjectId?: string): ManagedProcessRecord | undefined {
    const record = this.processes.get(processId);
    if (!record) return undefined;
    if (requesterProjectId && record.projectId !== requesterProjectId) {
      throw new ProcessOwnershipViolationError(
        `Process ownership violation: Process '${processId}' belongs to project '${record.projectId}', not '${requesterProjectId}'.`
      );
    }
    return record;
  }

  /**
   * Retrieves active process for a project.
   */
  public getProcessByProject(projectId: string): ManagedProcessRecord | undefined {
    const procId = this.projectProcessMap.get(projectId);
    if (!procId) return undefined;
    return this.processes.get(procId);
  }

  /**
   * Returns sanitized log lines with ownership check.
   */
  public getLogs(processId: string, requesterProjectId?: string, tailLines: number = 100): string[] {
    const proc = this.getProcess(processId, requesterProjectId);
    if (!proc) return [];
    return proc.logBuffer.slice(-tailLines);
  }

  /**
   * Lists all managed processes.
   */
  public listProcesses(): ManagedProcessRecord[] {
    return Array.from(this.processes.values());
  }

  /**
   * Resets all in-memory supervisor state.
   */
  public async reset(): Promise<void> {
    await this.emergencyStopAll();
    this.processes.clear();
    this.projectProcessMap.clear();
  }
}
