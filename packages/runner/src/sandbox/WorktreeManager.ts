import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface WorktreeSession {
  taskId: string;
  workspaceRoot: string;
  worktreePath: string;
  branchName: string;
}

export class WorktreeManager {
  public static createWorktree(workspaceRoot: string, taskId: string): WorktreeSession {
    const branchName = `gideon/task-${taskId}`;
    const worktreeDir = path.join(workspaceRoot, '.gideon', 'worktrees', taskId);

    // Ensure .gideon directory exists
    const gideonDir = path.join(workspaceRoot, '.gideon', 'worktrees');
    if (!fs.existsSync(gideonDir)) {
      fs.mkdirSync(gideonDir, { recursive: true });
    }

    // Check if git is initialized in workspace
    if (!fs.existsSync(path.join(workspaceRoot, '.git'))) {
      throw new Error(`Git repository not initialized in workspace: ${workspaceRoot}`);
    }

    // Add git worktree on new branch
    const addResult = spawnSync('git', ['worktree', 'add', '-b', branchName, worktreeDir], {
      cwd: workspaceRoot,
      encoding: 'utf8'
    });

    if (addResult.status !== 0) {
      // Fallback: check if worktree already exists or add without -b
      const fallbackResult = spawnSync('git', ['worktree', 'add', worktreeDir], {
        cwd: workspaceRoot,
        encoding: 'utf8'
      });
      if (fallbackResult.status !== 0) {
        throw new Error(`Failed to create git worktree: ${addResult.stderr || fallbackResult.stderr}`);
      }
    }

    return {
      taskId,
      workspaceRoot,
      worktreePath: fs.realpathSync(worktreeDir),
      branchName
    };
  }

  public static removeWorktree(session: WorktreeSession, deleteBranch: boolean = false): void {
    if (fs.existsSync(session.worktreePath)) {
      spawnSync('git', ['worktree', 'remove', '--force', session.worktreePath], {
        cwd: session.workspaceRoot,
        encoding: 'utf8'
      });
    }

    if (deleteBranch) {
      spawnSync('git', ['branch', '-D', session.branchName], {
        cwd: session.workspaceRoot,
        encoding: 'utf8'
      });
    }
  }
}
