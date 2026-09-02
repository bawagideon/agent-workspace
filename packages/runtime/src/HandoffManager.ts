import { AgentRegistry } from '@gideon/agents';
import { ReviewScorecard } from './SelfReviewer';

export interface HandoffPayload {
  taskId: string;
  fromAgentId: string;
  toAgentId: string;
  scorecard: ReviewScorecard;
  artifactsSummary: string;
  status: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REWORK';
}

export class HandoffManager {
  public static triggerQA(
    taskId: string,
    forgeScorecard: ReviewScorecard,
    artifactsSummary: string
  ): HandoffPayload {
    // Sentinel independently audits Forge's work
    const sentinelEntry = AgentRegistry.get('sentinel');
    if (!sentinelEntry) {
      throw new Error('Sentinel QA agent not found in registry.');
    }

    const isAccepted = forgeScorecard.passed && forgeScorecard.testsPassed;

    return {
      taskId,
      fromAgentId: 'forge',
      toAgentId: 'sentinel',
      scorecard: forgeScorecard,
      artifactsSummary,
      status: isAccepted ? 'ACCEPTED' : 'NEEDS_REWORK'
    };
  }
}
