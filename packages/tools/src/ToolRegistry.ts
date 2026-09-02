import { ToolDefinition } from './ToolDefinition';
import {
  FsReadFileTool,
  FsWriteFileTool,
  FsListDirTool,
  FsSearchTool,
  GitStatusTool,
  GitDiffTool,
  GitCommitTool,
  TerminalRunCommandTool
} from './schemas/tools';

export class ToolRegistry {
  private static tools: Map<string, ToolDefinition> = new Map();

  static {
    this.register(FsReadFileTool);
    this.register(FsWriteFileTool);
    this.register(FsListDirTool);
    this.register(FsSearchTool);
    this.register(GitStatusTool);
    this.register(GitDiffTool);
    this.register(GitCommitTool);
    this.register(TerminalRunCommandTool);
  }

  public static register(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  public static get(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  public static getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public static validateInput(toolId: string, input: any): { success: boolean; data?: any; error?: string } {
    const tool = this.get(toolId);
    if (!tool) {
      return { success: false, error: `Tool not registered: ${toolId}` };
    }

    const result = tool.inputSchema.safeParse(input);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return { success: true, data: result.data };
  }
}

export * from './ToolDefinition';
export * from './schemas/tools';
