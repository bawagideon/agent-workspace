import fs from 'fs';
import path from 'path';
import { SecretProtection } from '@gideon/policy';

export class WorkspaceSandbox {
  private allowedWorkspaces: Map<string, string> = new Map();

  constructor(workspaces: Array<{ id: string; rootPath: string }>) {
    for (const ws of workspaces) {
      this.registerWorkspace(ws.id, ws.rootPath);
    }
  }

  public registerWorkspace(workspaceId: string, rootPath: string): void {
    if (fs.existsSync(rootPath)) {
      const canonicalRoot = fs.realpathSync(rootPath);
      this.allowedWorkspaces.set(workspaceId, canonicalRoot);
    } else {
      this.allowedWorkspaces.set(workspaceId, path.resolve(rootPath));
    }
  }

  public validatePath(workspaceId: string, requestedPath: string): string {
    const canonicalRoot = this.allowedWorkspaces.get(workspaceId);
    if (!canonicalRoot) {
      throw new Error(`Unauthorized or Unregistered Workspace: ${workspaceId}`);
    }

    // 1. Secret file check
    if (SecretProtection.isSecretFile(requestedPath)) {
      throw new Error(`Security Violation: Access to secret/config file denied: ${requestedPath}`);
    }

    // 2. Resolve absolute target path
    const absoluteTarget = path.isAbsolute(requestedPath)
      ? path.normalize(requestedPath)
      : path.normalize(path.join(canonicalRoot, requestedPath));

    // 3. Prevent cross-drive traversal on Windows
    if (path.parse(canonicalRoot).root.toLowerCase() !== path.parse(absoluteTarget).root.toLowerCase()) {
      throw new Error(`Security Violation: Cross-drive access blocked: ${requestedPath}`);
    }

    // 4. Check relative path boundary
    const relative = path.relative(canonicalRoot, absoluteTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Security Violation: Path traversal outside workspace boundary: ${requestedPath}`);
    }

    // 5. Check symlinks if file exists
    if (fs.existsSync(absoluteTarget)) {
      const canonicalTarget = fs.realpathSync(absoluteTarget);
      const targetRelative = path.relative(canonicalRoot, canonicalTarget);
      if (targetRelative.startsWith('..') || path.isAbsolute(targetRelative)) {
        throw new Error(`Security Violation: Symlink points outside workspace root: ${requestedPath}`);
      }
      return canonicalTarget;
    }

    return absoluteTarget;
  }

  public getWorkspaceRoot(workspaceId: string): string {
    const root = this.allowedWorkspaces.get(workspaceId);
    if (!root) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    return root;
  }
}
