# GIDEON AI HQ — LOCAL RUNNER SPECIFICATION
**Version:** 3.0.0  
**Status:** Specification Lock  
**Classification:** Local Machine Daemon Architecture  

---

## 1. Daemon Architecture & Responsibilities

The Gideon Runner (`packages/runner`) is an autonomous background service executing on your local machine (`GIDMACHINE`).

```
┌─────────────────────────────────────────────────────────────┐
│                    GIDEON RUNNER DAEMON                     │
├─────────────────────────────────────────────────────────────┤
│ 1. Connection Manager: Connects via Supabase Realtime / WS  │
│ 2. Heartbeat Service: Emits status every 10s (CPU, tasks)   │
│ 3. Machine Capability Registry (Node, Git, npm, Docker)     │
│ 4. Workspace Sandbox & Path Boundary Enforcer               │
│ 5. Job Executor: Validates auth hashes & idempotency keys   │
│ 6. Process Manager: Spawns and tracks local child processes │
│ 7. Realtime Event Reporter: Streams stdout/stderr to HQ     │
│ 8. Universal Kill Switch: Halts tasks & kills processes     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Heartbeat & Dynamic Machine Registration

Every 10 seconds, the runner sends a heartbeat payload to Supabase:
```json
{
  "machine_id": "GIDMACHINE_WIN",
  "status": "ONLINE",
  "platform": "win32",
  "runner_version": "3.0.0",
  "capabilities": ["node", "git", "npm", "pnpm", "tsc", "python"],
  "active_tasks": 1,
  "last_heartbeat_at": "2026-09-02T16:35:00Z"
}
```

If the HQ does not receive a heartbeat for 30 seconds, the machine status transitions to `OFFLINE`, and active running tasks transition safely to `BLOCKED_OFFLINE` to prevent inconsistent state.

---

## 3. Reconnect Reconciliation & Idempotency

When the runner reconnects after network interruption or sleep:
1. It queries `hq_task_runs` for tasks assigned to its `machine_id` in `RUNNING` status.
2. It verifies local process table state to confirm if subprocesses are still alive.
3. If an atomic step has already completed on disk (verified by Git diff / timestamp hash), the runner skips re-execution and marks the step `COMPLETED`.
4. If a step failed mid-way, the runner reports `RECOVERY_REQUIRED` and invokes rollback handlers.

---

## 4. Subprocess Execution & Process Tracking

All local commands are executed through a managed process wrapper:
- **Max Buffer**: 10 MB stdout/stderr limit.
- **Max Timeout**: 5 minutes per step (configurable per task).
- **Process Group Tracking**: Stores PID trees to ensure child processes spawned by npm/node are completely terminated on cancel or kill-switch events.
