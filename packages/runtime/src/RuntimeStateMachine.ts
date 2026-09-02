import { TaskStatus } from '@gideon/shared';

export class RuntimeStateMachine {
  private static VALID_TRANSITIONS: Map<TaskStatus, TaskStatus[]> = new Map([
    ['CREATED', ['QUEUED', 'BLOCKED', 'CANCELLED']],
    ['QUEUED', ['RUNNER_ASSIGNED', 'BLOCKED_OFFLINE', 'CANCELLED']],
    ['RUNNER_ASSIGNED', ['CONTEXT_LOADING', 'BLOCKED', 'CANCELLED']],
    ['CONTEXT_LOADING', ['INSPECTING', 'BLOCKED', 'CANCELLED']],
    ['INSPECTING', ['PLANNING', 'BLOCKED', 'CANCELLED']],
    ['PLANNING', ['WAITING_APPROVAL', 'EXECUTING', 'BLOCKED', 'CANCELLED']],
    ['WAITING_APPROVAL', ['EXECUTING', 'PLANNING', 'CANCELLED', 'EMERGENCY_STOPPED']],
    ['EXECUTING', ['OBSERVING', 'SELF_REVIEW', 'FAILED', 'BLOCKED', 'EMERGENCY_STOPPED']],
    ['OBSERVING', ['SELF_REVIEW', 'EXECUTING', 'FAILED', 'EMERGENCY_STOPPED']],
    ['SELF_REVIEW', ['QA_PENDING', 'PLANNING', 'COMPLETED', 'FAILED']],
    ['QA_PENDING', ['QA_EXECUTING', 'FAILED']],
    ['QA_EXECUTING', ['COMPLETED', 'PLANNING', 'FAILED']],
    ['COMPLETED', []],
    ['FAILED', ['QUEUED', 'CANCELLED']],
    ['BLOCKED', ['QUEUED', 'CANCELLED']],
    ['BLOCKED_OFFLINE', ['RUNNER_ASSIGNED', 'CANCELLED']],
    ['EMERGENCY_STOPPED', ['QUEUED', 'CANCELLED']]
  ]);

  public static canTransition(current: TaskStatus, target: TaskStatus): boolean {
    const allowed = this.VALID_TRANSITIONS.get(current);
    return allowed ? allowed.includes(target) : false;
  }

  public static validateTransition(current: TaskStatus, target: TaskStatus): void {
    if (!this.canTransition(current, target)) {
      throw new Error(`Invalid Task State Transition: cannot transition from '${current}' to '${target}'.`);
    }
  }
}
