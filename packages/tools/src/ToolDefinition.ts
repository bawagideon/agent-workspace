import { RiskLevel, ActionType } from '@gideon/shared';

export interface SchemaValidator<T = any> {
  safeParse: (input: any) => { success: true; data: T } | { success: false; error: { message: string } };
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  actionType: ActionType;
  defaultRiskLevel: RiskLevel;
  requiresWorkspace: boolean;
  requiresPathValidation: boolean;
  inputSchema: SchemaValidator<TInput>;
  outputSchema?: SchemaValidator<TOutput>;
}
