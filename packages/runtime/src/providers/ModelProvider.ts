import { ExecutionPlan, QAReviewResult } from '@gideon/shared';

export interface ModelProvider {
  name: string;
  generatePlan(goal: string, context: Record<string, any>): Promise<ExecutionPlan>;
  reviewCode(taskGoal: string, diff: string, testLogs: string): Promise<QAReviewResult>;
}
