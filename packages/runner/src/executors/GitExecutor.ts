import { ProcessExecutor } from './ProcessExecutor';

export class GitExecutor {
  constructor(private processExecutor: ProcessExecutor) {}

  public async getStatus(workspaceId: string): Promise<{ stdout: string; branch: string; isClean: boolean }> {
    const statusRes = await this.processExecutor.executeCommand(workspaceId, 'git status --short');
    const branchRes = await this.processExecutor.executeCommand(workspaceId, 'git branch --show-current');

    return {
      stdout: statusRes.stdout.trim(),
      branch: branchRes.stdout.trim(),
      isClean: statusRes.stdout.trim().length === 0
    };
  }

  public async getDiff(workspaceId: string, targetBranch?: string): Promise<string> {
    const cmd = targetBranch ? `git diff ${targetBranch}` : 'git diff HEAD';
    const res = await this.processExecutor.executeCommand(workspaceId, cmd);
    return res.stdout;
  }

  public async commit(workspaceId: string, message: string, files?: string[]): Promise<{ commitHash: string }> {
    if (files && files.length > 0) {
      await this.processExecutor.executeCommand(workspaceId, `git add ${files.join(' ')}`);
    } else {
      await this.processExecutor.executeCommand(workspaceId, 'git add -A');
    }

    const commitRes = await this.processExecutor.executeCommand(
      workspaceId,
      `git commit -m "${message.replace(/"/g, '\\"')}"`
    );
    const hashRes = await this.processExecutor.executeCommand(workspaceId, 'git rev-parse HEAD');

    return { commitHash: hashRes.stdout.trim() };
  }
}
