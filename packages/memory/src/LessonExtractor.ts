import { MemoryEngine } from './MemoryEngine';
import { MemoryRecord } from '@gideon/shared';

export interface PostTaskContext {
  taskId: string;
  taskTitle: string;
  workspaceId: string;
  agentId: string;
  executionSuccess: boolean;
  toolOutputs: Array<{ toolId: string; output: any }>;
  selfReviewNotes?: string;
}

export class LessonExtractor {
  constructor(private memoryEngine: MemoryEngine) {}

  public async extractAndProposeLesson(context: PostTaskContext): Promise<MemoryRecord | null> {
    // Deterministic lesson heuristic: if a build or test failed initially then passed, record a lesson
    if (context.selfReviewNotes && context.executionSuccess) {
      const lessonKey = `lesson_${context.workspaceId}_${Date.now()}`;
      
      const record = await this.memoryEngine.storeMemory({
        category: 'LESSON',
        workspaceId: context.workspaceId,
        agentId: context.agentId,
        key: lessonKey,
        value: {
          task: context.taskTitle,
          lesson: context.selfReviewNotes,
          learnedAt: new Date().toISOString()
        },
        confidence: 0.95,
        status: 'ACTIVE',
        sourceType: 'TASK_LESSON',
        sourceReference: `Task: ${context.taskId}`
      });

      return record;
    }

    return null;
  }
}
