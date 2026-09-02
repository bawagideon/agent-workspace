import { ToolDefinition, SchemaValidator } from '../ToolDefinition';

function createValidator<T>(validateFn: (input: any) => { valid: boolean; error?: string }): SchemaValidator<T> {
  return {
    safeParse: (input: any) => {
      const res = validateFn(input);
      if (!res.valid) {
        return { success: false, error: { message: res.error || 'Invalid parameters' } };
      }
      return { success: true, data: input as T };
    }
  };
}

// Filesystem Tools
export const FsReadFileTool: ToolDefinition<{ workspaceId: string; filePath: string }> = {
  id: 'fs_read_file',
  name: 'Read File',
  description: 'Safely reads the text content of a file within a registered workspace.',
  actionType: 'FILE_READ',
  defaultRiskLevel: 'LOW',
  requiresWorkspace: true,
  requiresPathValidation: true,
  inputSchema: createValidator((inp) => ({
    valid: typeof inp?.workspaceId === 'string' && typeof inp?.filePath === 'string',
    error: 'workspaceId and filePath must be strings'
  }))
};

export const FsWriteFileTool: ToolDefinition<{ workspaceId: string; filePath: string; content: string }> = {
  id: 'fs_write_file',
  name: 'Write File',
  description: 'Writes content to a file inside the registered workspace after policy checks.',
  actionType: 'FILE_WRITE',
  defaultRiskLevel: 'MEDIUM',
  requiresWorkspace: true,
  requiresPathValidation: true,
  inputSchema: createValidator((inp) => ({
    valid: typeof inp?.workspaceId === 'string' && typeof inp?.filePath === 'string' && typeof inp?.content === 'string',
    error: 'workspaceId, filePath, and content must be strings'
  }))
};

export const FsListDirTool: ToolDefinition<{ workspaceId: string; directoryPath?: string; recursive?: boolean }> = {
  id: 'fs_list_dir',
  name: 'List Directory',
  description: 'Lists files and subdirectories within a registered workspace folder.',
  actionType: 'FILE_READ',
  defaultRiskLevel: 'LOW',
  requiresWorkspace: true,
  requiresPathValidation: true,
  inputSchema: createValidator((inp) => ({
    valid: typeof inp?.workspaceId === 'string',
    error: 'workspaceId must be a string'
  }))
};

export const FsSearchTool: ToolDefinition<{ workspaceId: string; query: string; filePattern?: string }> = {
  id: 'fs_search',
  name: 'Search Files',
  description: 'Searches for text or regex patterns in workspace files.',
  actionType: 'FILE_READ',
  defaultRiskLevel: 'LOW',
  requiresWorkspace: true,
  requiresPathValidation: true,
  inputSchema: createValidator((inp) => ({
    valid: typeof inp?.workspaceId === 'string' && typeof inp?.query === 'string',
    error: 'workspaceId and query must be strings'
  }))
};

// Git Tools
export const GitStatusTool: ToolDefinition<{ workspaceId: string }> = {
  id: 'git_status',
  name: 'Git Status',
  description: 'Inspects modified, staged, and untracked files in the workspace Git repository.',
  actionType: 'FILE_READ',
  defaultRiskLevel: 'LOW',
  requiresWorkspace: true,
  requiresPathValidation: true,
  inputSchema: createValidator((inp) => ({
    valid: typeof inp?.workspaceId === 'string',
    error: 'workspaceId must be a string'
  }))
};

export const GitDiffTool: ToolDefinition<{ workspaceId: string; targetBranch?: string }> = {
  id: 'git_diff',
  name: 'Git Diff',
  description: 'Inspects uncommitted diffs or compares changes against a target branch.',
  actionType: 'FILE_READ',
  defaultRiskLevel: 'LOW',
  requiresWorkspace: true,
  requiresPathValidation: true,
  inputSchema: createValidator((inp) => ({
    valid: typeof inp?.workspaceId === 'string',
    error: 'workspaceId must be a string'
  }))
};

export const GitCommitTool: ToolDefinition<{ workspaceId: string; message: string; files?: string[] }> = {
  id: 'git_commit',
  name: 'Git Commit',
  description: 'Stages and commits changes locally in the workspace.',
  actionType: 'GIT_COMMIT',
  defaultRiskLevel: 'MEDIUM',
  requiresWorkspace: true,
  requiresPathValidation: true,
  inputSchema: createValidator((inp) => ({
    valid: typeof inp?.workspaceId === 'string' && typeof inp?.message === 'string',
    error: 'workspaceId and message must be strings'
  }))
};

// Terminal Tool
export const TerminalRunCommandTool: ToolDefinition<{ workspaceId: string; command: string; timeoutMs?: number }> = {
  id: 'terminal_run_command',
  name: 'Run Terminal Command',
  description: 'Executes a command inside the workspace via the local runner (allowlist enforced).',
  actionType: 'RUN_COMMAND',
  defaultRiskLevel: 'MEDIUM',
  requiresWorkspace: true,
  requiresPathValidation: true,
  inputSchema: createValidator((inp) => ({
    valid: typeof inp?.workspaceId === 'string' && typeof inp?.command === 'string',
    error: 'workspaceId and command must be strings'
  }))
};
