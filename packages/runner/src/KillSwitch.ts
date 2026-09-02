import { ChildProcess } from 'child_process';

export class KillSwitch {
  private static activeProcesses: Map<number, ChildProcess> = new Map();
  private static isEmergencyHalted: boolean = false;

  public static trackProcess(pid: number, process: ChildProcess): void {
    if (this.isEmergencyHalted) {
      process.kill();
      throw new Error('Emergency Kill Switch is ACTIVE. Process execution blocked.');
    }
    this.activeProcesses.set(pid, process);
  }

  public static untrackProcess(pid: number): void {
    this.activeProcesses.delete(pid);
  }

  public static killProcess(pid: number): void {
    const process = this.activeProcesses.get(pid);
    if (process) {
      process.kill('SIGKILL');
      this.activeProcesses.delete(pid);
    }
  }

  public static triggerEmergencyStop(): { killedCount: number } {
    this.isEmergencyHalted = true;
    let killedCount = 0;

    for (const [pid, process] of this.activeProcesses.entries()) {
      try {
        process.kill('SIGKILL');
        killedCount++;
      } catch {
        // Process might already be dead
      }
    }

    this.activeProcesses.clear();
    return { killedCount };
  }

  public static resetEmergencyStop(): void {
    this.isEmergencyHalted = false;
  }

  public static isHalted(): boolean {
    return this.isEmergencyHalted;
  }
}
