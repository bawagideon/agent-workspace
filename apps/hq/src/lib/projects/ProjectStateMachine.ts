import { ProjectStatus, ProjectRecord } from '@gideon/shared';
import { ProjectDatabase } from './ProjectDatabase';

export class IllegalStateTransitionError extends Error {
  constructor(public from: ProjectStatus, public to: ProjectStatus, message?: string) {
    super(message || `Illegal Project State Transition: Cannot transition from '${from}' to '${to}'.`);
    this.name = 'IllegalStateTransitionError';
  }
}

export class ProjectStateMachine {
  private static LEGAL_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
    DISCOVERY: ['SCAFFOLDING', 'ARCHIVED'],
    SCAFFOLDING: ['BUILDING', 'ARCHIVED'],
    BUILDING: ['TESTING', 'ARCHIVED'],
    TESTING: ['QA_VERIFIED', 'BUILDING', 'ARCHIVED'],
    QA_VERIFIED: ['STAGING', 'BUILDING', 'ARCHIVED'],
    STAGING: ['CLIENT_REVIEW', 'BUILDING', 'ARCHIVED'],
    CLIENT_REVIEW: ['CLIENT_ACCEPTED', 'REWORK_REQUESTED', 'STAGING', 'ARCHIVED'],
    REWORK_REQUESTED: ['BUILDING', 'ARCHIVED'],
    CLIENT_ACCEPTED: ['COMMERCIAL_CLEAR', 'REWORK_REQUESTED', 'ARCHIVED'],
    COMMERCIAL_CLEAR: ['DEPLOY_AUTHORIZATION', 'ARCHIVED'],
    DEPLOY_AUTHORIZATION: ['DEPLOYING', 'ARCHIVED'],
    DEPLOYING: ['DEPLOYED', 'DEPLOYMENT_FAILED'],
    DEPLOYMENT_FAILED: ['DEPLOY_AUTHORIZATION', 'ARCHIVED'],
    DEPLOYED: ['ARCHIVED', 'DECOMMISSIONED'],
    ARCHIVED: ['DISCOVERY', 'DECOMMISSIONED'],
    DECOMMISSIONED: [] // Terminal state
  };

  /**
   * Evaluates whether a transition is legally permitted.
   */
  public static isLegalTransition(currentStatus: ProjectStatus, nextStatus: ProjectStatus): boolean {
    if (currentStatus === nextStatus) return true;
    const allowed = this.LEGAL_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Atomically executes a governed state transition, logging the event and enforcing invariants.
   */
  public static async transition(
    projectId: string,
    targetStatus: ProjectStatus,
    actor: string,
    reason?: string
  ): Promise<ProjectRecord> {
    const db = ProjectDatabase.getInstance();
    const project = await db.getProjectById(projectId);

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (!this.isLegalTransition(project.status, targetStatus)) {
      throw new IllegalStateTransitionError(project.status, targetStatus);
    }

    if (project.status === targetStatus) {
      return project;
    }

    // Critical Transition Guard: Moving to DEPLOY_AUTHORIZATION, DEPLOYING, or DEPLOYED requires approval confirmation
    if ((targetStatus === 'DEPLOYED' || targetStatus === 'DEPLOY_AUTHORIZATION' || targetStatus === 'DEPLOYING') && actor !== 'human' && actor !== 'release') {
      throw new Error(`Security Violation: Transition to '${targetStatus}' requires human approval or Release Captain authorization.`);
    }

    const previousStatus = project.status;
    project.status = targetStatus;

    // Persist with optimistic revision
    const saved = await db.saveProject(project, project.revision);

    // Append to immutable event stream
    await db.logEvent({
      projectId: saved.id,
      eventType: 'STATUS_TRANSITIONED',
      actor,
      payload: {
        from: previousStatus,
        to: targetStatus,
        reason: reason || 'Governed lifecycle advancement',
        revision: saved.revision
      }
    });

    return saved;
  }
}
