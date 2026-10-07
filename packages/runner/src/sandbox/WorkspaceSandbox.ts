import fs from 'fs';
import path from 'path';
import { SecretProtection } from '@gideon/policy';
import { WorkspaceType } from '@gideon/shared';

export interface WorkspaceConfig {
  id: string;
  rootPath: string;
  workspaceType?: WorkspaceType;
}

export class WorkspaceSandbox {
  private allowedWorkspaces: Map<string, { rootPath: string; workspaceType: WorkspaceType }> = new Map();

  constructor(workspaces: WorkspaceConfig[]) {
    for (const ws of workspaces) {
      this.registerWorkspace(ws.id, ws.rootPath, ws.workspaceType || 'ACTIVE');
    }
  }

  public registerWorkspace(workspaceId: string, rootPath: string, workspaceType: WorkspaceType = 'ACTIVE'): void {
    if (fs.existsSync(rootPath)) {
      const canonicalRoot = fs.realpathSync(rootPath);
      this.allowedWorkspaces.set(workspaceId, { rootPath: canonicalRoot, workspaceType });
    } else {
      this.allowedWorkspaces.set(workspaceId, { rootPath: path.resolve(rootPath), workspaceType });
    }
  }

  public validatePath(workspaceId: string, requestedPath: string, isWrite: boolean = false): string {
    const ws = this.allowedWorkspaces.get(workspaceId);
    if (!ws) {
      throw new Error(`Unauthorized or Unregistered Workspace: ${workspaceId}`);
    }

    // 1. Immutable REFERENCE Workspace Check
    if (ws.workspaceType === 'REFERENCE' && isWrite) {
      throw new Error(`Security Violation: Workspace '${workspaceId}' is an immutable REFERENCE workspace. All writes are permanently forbidden.`);
    }

    // 2. Secret file check
    if (SecretProtection.isSecretFile(requestedPath)) {
      throw new Error(`Security Violation: Access to secret/config file denied: ${requestedPath}`);
    }

    const canonicalRoot = ws.rootPath;

    // 3. Resolve absolute target path
    const absoluteTarget = path.isAbsolute(requestedPath)
      ? path.normalize(requestedPath)
      : path.normalize(path.join(canonicalRoot, requestedPath));

    // 4. Prevent cross-drive traversal on Windows
    if (path.parse(canonicalRoot).root.toLowerCase() !== path.parse(absoluteTarget).root.toLowerCase()) {
      throw new Error(`Security Violation: Cross-drive access blocked: ${requestedPath}`);
    }

    // 5. Check relative path boundary (Separator-aware)
    const relative = path.relative(canonicalRoot, absoluteTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Security Violation: Path traversal outside workspace boundary: ${requestedPath}`);
    }

    // 6. Check canonical realpath for symlinks / Windows junctions
    if (fs.existsSync(absoluteTarget)) {
      const canonicalTarget = fs.realpathSync(absoluteTarget);
      const targetRelative = path.relative(canonicalRoot, canonicalTarget);
      if (targetRelative.startsWith('..') || path.isAbsolute(targetRelative)) {
        throw new Error(`Security Violation: Symlink/Junction points outside workspace root: ${requestedPath}`);
      }
      return canonicalTarget;
    }

    // For new files to be written, validate parent directory
    if (isWrite) {
      let parent = path.dirname(absoluteTarget);
      while (!fs.existsSync(parent) && parent !== canonicalRoot && parent.length >= canonicalRoot.length) {
        parent = path.dirname(parent);
      }
      if (fs.existsSync(parent)) {
        const canonicalParent = fs.realpathSync(parent);
        const parentRelative = path.relative(canonicalRoot, canonicalParent);
        if (parentRelative.startsWith('..') || path.isAbsolute(parentRelative)) {
          throw new Error(`Security Violation: Parent directory symlink escapes workspace: ${requestedPath}`);
        }
      }
    }

    return absoluteTarget;
  }

  public getWorkspaceRoot(workspaceId: string): string {
    const ws = this.allowedWorkspaces.get(workspaceId);
    if (!ws) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    return ws.rootPath;
  }

  public getWorkspaceType(workspaceId: string): WorkspaceType {
    const ws = this.allowedWorkspaces.get(workspaceId);
    return ws ? ws.workspaceType : 'ACTIVE';
  }
}
