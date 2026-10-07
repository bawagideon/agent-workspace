import fs from 'fs';
import path from 'path';
import { WorkspaceSandbox } from '../sandbox/WorkspaceSandbox';
import { SecretProtection } from '@gideon/policy';

export class FsExecutor {
  constructor(private sandbox: WorkspaceSandbox) {}

  public async readFile(workspaceId: string, filePath: string): Promise<string> {
    const safePath = this.sandbox.validatePath(workspaceId, filePath);
    if (!fs.existsSync(safePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const content = await fs.promises.readFile(safePath, 'utf8');
    return SecretProtection.redactSecrets(content);
  }

  public async writeFile(workspaceId: string, filePath: string, content: string): Promise<{ bytesWritten: number }> {
    const safePath = this.sandbox.validatePath(workspaceId, filePath);
    const parentDir = path.dirname(safePath);

    if (!fs.existsSync(parentDir)) {
      await fs.promises.mkdir(parentDir, { recursive: true });
    }

    await fs.promises.writeFile(safePath, content, 'utf8');
    return { bytesWritten: Buffer.byteLength(content, 'utf8') };
  }

  public async listDir(
    workspaceId: string,
    directoryPath: string = '',
    recursive: boolean = false
  ): Promise<Array<{ name: string; isDirectory: boolean; path: string; size: number }>> {
    const safePath = this.sandbox.validatePath(workspaceId, directoryPath);
    const root = this.sandbox.getWorkspaceRoot(workspaceId);

    if (!fs.existsSync(safePath)) {
      throw new Error(`Directory not found: ${directoryPath}`);
    }

    const results: Array<{ name: string; isDirectory: boolean; path: string; size: number }> = [];

    const walk = async (currentDir: string) => {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.name === 'node_modules' || 
          entry.name === '.git' || 
          entry.name === '.next' || 
          entry.name === 'dist' ||
          entry.name === '.gideon'
        ) continue;

        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          results.push({ name: entry.name, isDirectory: true, path: relativePath, size: 0 });
          if (recursive) {
            await walk(fullPath);
          }
        } else {
          const stat = await fs.promises.stat(fullPath);
          results.push({ name: entry.name, isDirectory: false, path: relativePath, size: stat.size });
        }
      }
    };

    await walk(safePath);
    return results;
  }

  public async search(
    workspaceId: string,
    query: string,
    filePattern?: string
  ): Promise<Array<{ filePath: string; line: number; content: string }>> {
    const root = this.sandbox.getWorkspaceRoot(workspaceId);
    const allFiles = await this.listDir(workspaceId, '', true);
    const textFiles = allFiles.filter((f) => !f.isDirectory);

    const matches: Array<{ filePath: string; line: number; content: string }> = [];
    const regex = new RegExp(query, 'i');

    for (const file of textFiles) {
      // Never attempt to scan secret files (.env, keys, credentials)
      if (SecretProtection.isSecretFile(file.path)) continue;
      if (filePattern && !new RegExp(filePattern).test(file.path)) continue;

      try {
        const safePath = this.sandbox.validatePath(workspaceId, file.path);
        const content = await fs.promises.readFile(safePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((lineText, index) => {
          if (regex.test(lineText)) {
            matches.push({
              filePath: file.path,
              line: index + 1,
              content: SecretProtection.redactSecrets(lineText.trim())
            });
          }
        });
      } catch {
        // Skip inaccessible, binary or unreadable files
      }
    }

    return matches.slice(0, 100);
  }
}
