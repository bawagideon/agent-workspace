import { GideonEventBus } from '@gideon/shared';
import { Mission, MissionStep } from '../MissionEngine';

export type FailureClassification =
  | 'BLOCKED_BY_APPROVAL'
  | 'WAITING_FOR_DISPATCH'
  | 'SOURCE_OF_TRUTH_UNCLEAR'
  | 'TOOL_FAILURE'
  | 'BUILD_FAILURE'
  | 'QA_FAILURE'
  | 'SCOPE_ERROR'
  | 'ENVIRONMENT_FAILURE';

export interface SupervisionDiagnosis {
  classification: FailureClassification;
  rootCause: string;
  recommendedAction: string;
  injectedLessons: string[];
  canAutoRecover: boolean;
  targetRetryAgent: string;
  enrichedGoal: string;
}

export class MissionSupervisor {
  private static eventBus: GideonEventBus = GideonEventBus.getInstance();
  private static MAX_STEP_RETRIES = 3;

  /**
   * Diagnoses a mission step failure and devises an authoritative closed-loop recovery plan.
   */
  public static diagnoseFailure(
    step: MissionStep,
    errorMessage: string,
    mission: Mission,
    currentRetryCount: number = 0
  ): SupervisionDiagnosis {
    const err = (errorMessage || '').toLowerCase();
    const title = (step.title || '').toLowerCase();
    const goal = (step.goal || '').toLowerCase();

    // 1. BLOCKED_BY_APPROVAL: Requires human signature or operator authorization
    if (
      err.includes('approval') ||
      err.includes('signature') ||
      err.includes('authorized') ||
      err.includes('human authority') ||
      err.includes('gate') ||
      step.requiresApproval
    ) {
      return {
        classification: 'BLOCKED_BY_APPROVAL',
        rootCause: 'Step requires mandatory human authority approval before execution.',
        recommendedAction: 'Stage approval request in hq_approvals and notify human operator in chat.',
        injectedLessons: [
          'Agent != Signer Rule: Autonomous agents cannot authorize their own high-consequence deployments.'
        ],
        canAutoRecover: false,
        targetRetryAgent: step.assignedAgentId,
        enrichedGoal: step.goal
      };
    }

    // 2. WAITING_FOR_DISPATCH: Staged by Atlas but not dispatched
    if (
      err.includes('not dispatched') ||
      err.includes('staged') ||
      err.includes('waiting for dispatch') ||
      err.includes('idle')
    ) {
      return {
        classification: 'WAITING_FOR_DISPATCH',
        rootCause: 'Mission was staged in planner memory but execution trigger was not dispatched.',
        recommendedAction: 'Auto-dispatch workforce worker for low/medium risk objectives.',
        injectedLessons: [
          'Autonomous Dispatch Invariant: Planner must immediately dispatch executable tasks unless human approval is required.'
        ],
        canAutoRecover: true,
        targetRetryAgent: 'forge',
        enrichedGoal: `[SUPERVISOR AUTO-DISPATCH] Objective: ${step.goal}`
      };
    }

    // 3. QA_FAILURE: Sentinel contract verification, assertion failure, or benchmark failure
    if (
      err.includes('qa_contract') ||
      err.includes('qa rejection') ||
      err.includes('sentinel qa') ||
      err.includes('assertion') ||
      err.includes('test failed') ||
      err.includes('claim_validation') ||
      err.includes('contract failed') ||
      err.includes('qa failure')
    ) {
      return {
        classification: 'QA_FAILURE',
        rootCause: `Sentinel QA rejected implementation: ${errorMessage}`,
        recommendedAction: 'Feed Sentinel rejection diagnostics back to Forge for precision corrective refactor.',
        injectedLessons: [
          'Closed-Loop QA Rule: Failure reports from Sentinel must directly parameterize Forge\'s retry cycle.'
        ],
        canAutoRecover: currentRetryCount < this.MAX_STEP_RETRIES,
        targetRetryAgent: 'forge',
        enrichedGoal: `${step.goal}\n\n[SENTINEL QA REJECTION FEEDBACK]:\n${errorMessage}\nAddress these exact failures before submitting back for QA review.`
      };
    }

    // 4. SOURCE_OF_TRUTH_UNCLEAR: Patching derived artifacts instead of generator
    if (
      err.includes('source_of_truth') ||
      err.includes('derived') ||
      err.includes('projection') ||
      err.includes('prohibited') ||
      err.includes('rule_generated_artifact_preservation') ||
      (err.includes('svg') && !err.includes('test')) ||
      (err.includes('slide') && err.includes('edit'))
    ) {
      const lesson = 'Never patch generated artifacts directly when a generator or source template exists. Identify the authoritative source, modify it, regenerate artifacts, and verify both source and generated output.';
      return {
        classification: 'SOURCE_OF_TRUTH_UNCLEAR',
        rootCause: 'Agent attempted to inspect or patch generated/derived projections instead of modifying authoritative generator source.',
        recommendedAction: 'Direct Forge to modify packages/runtime/src/evidence/StoryPackGenerator.ts and re-run generator.',
        injectedLessons: [lesson],
        canAutoRecover: currentRetryCount < this.MAX_STEP_RETRIES,
        targetRetryAgent: 'forge',
        enrichedGoal: `${step.goal}\n\n[SUPERVISOR MANDATE]: ${lesson}\nDo NOT edit files in public/story or fixtures/story directly. Edit StoryPackGenerator.ts, regenerate, and verify.`
      };
    }

    // 5. BUILD_FAILURE: TypeScript, compilation, or syntax errors
    if (
      err.includes('transformerror') ||
      err.includes('syntaxerror') ||
      err.includes('typeerror') ||
      err.includes('cannot find module') ||
      err.includes('compilation')
    ) {
      return {
        classification: 'BUILD_FAILURE',
        rootCause: `Compilation or syntax failure: ${errorMessage}`,
        recommendedAction: 'Provide exact compilation error to Forge to repair syntax, imports, or types.',
        injectedLessons: [
          'Pre-commit Verification Invariant: All modified code must pass type-check and build prior to QA handoff.'
        ],
        canAutoRecover: currentRetryCount < this.MAX_STEP_RETRIES,
        targetRetryAgent: 'forge',
        enrichedGoal: `${step.goal}\n\n[COMPILATION ERROR DETECTED]:\n${errorMessage}\nFix the syntax/type error and verify build passes.`
      };
    }

    // 6. ENVIRONMENT_FAILURE: Network timeout, gateway crash, or process unreachable
    if (
      err.includes('econnrefused') ||
      err.includes('timeout') ||
      err.includes('socket hang up') ||
      err.includes('503') ||
      err.includes('500')
    ) {
      return {
        classification: 'ENVIRONMENT_FAILURE',
        rootCause: `Underlying service or daemon temporarily unreachable: ${errorMessage}`,
        recommendedAction: 'Apply exponential backoff retry and verify daemon health via ProcessSupervisor.',
        injectedLessons: [
          'Downstream Uncertainty Invariant: Network and port flushes require bounded backoff.'
        ],
        canAutoRecover: currentRetryCount < this.MAX_STEP_RETRIES,
        targetRetryAgent: step.assignedAgentId,
        enrichedGoal: step.goal
      };
    }

    // Default: Generic Tool / Runtime Failure
    return {
      classification: 'TOOL_FAILURE',
      rootCause: errorMessage || 'Unknown runtime step execution error.',
      recommendedAction: 'Retry step with clarified constraints and sanitized context.',
      injectedLessons: [],
      canAutoRecover: currentRetryCount < this.MAX_STEP_RETRIES,
      targetRetryAgent: step.assignedAgentId,
      enrichedGoal: `${step.goal}\n\n[RETRY GUIDANCE]: Previous attempt encountered: ${errorMessage}`
    };
  }

  /**
   * Logs and emits supervisor recovery telemetry.
   */
  public static recordRecoveryAttempt(params: {
    missionId: string;
    stepId: string;
    retryCount: number;
    diagnosis: SupervisionDiagnosis;
  }) {
    this.eventBus.emit(
      'mission.recovery_attempted',
      {
        missionId: params.missionId,
        stepId: params.stepId,
        retryCount: params.retryCount,
        classification: params.diagnosis.classification,
        rootCause: params.diagnosis.rootCause,
        canAutoRecover: params.diagnosis.canAutoRecover
      },
      'mission_supervisor'
    );
  }
}
