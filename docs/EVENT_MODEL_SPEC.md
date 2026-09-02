# GIDEON AI HQ — EVENT MODEL SPECIFICATION
**Version:** 3.0.0  
**Status:** Specification Lock  
**Classification:** Distributed Tracing & Realtime Telemetry  

---

## 1. Unified Event Schema (`hq_events`)

Every operational event across the HQ Control Plane, Agent Runtime, and Local Runner is persisted in `hq_events` with standard schema:

```json
{
  "id": "uuid-v4",
  "task_id": "uuid-v4",
  "task_run_id": "uuid-v4",
  "agent_id": "forge",
  "machine_id": "GIDMACHINE_WIN",
  "event_type": "TOOL_EXECUTION_COMPLETED",
  "severity": "INFO",
  "payload": {
    "tool_name": "fs_write_file",
    "target_path": "src/components/Example.tsx",
    "duration_ms": 42,
    "tokens_consumed": 1250,
    "estimated_cost": 0.0025
  },
  "created_at": "2026-09-02T16:35:00Z"
}
```

---

## 2. Core Event Vocabulary

### Task & Run Lifecycle
- `TASK_CREATED`, `TASK_QUEUED`, `TASK_CLAIMED`, `TASK_PAUSED`, `TASK_COMPLETED`, `TASK_FAILED`, `TASK_BLOCKED`
- `PLAN_FORMULATED`, `PLAN_APPROVED`, `PLAN_REJECTED`

### Approval & Safety
- `APPROVAL_REQUESTED`, `APPROVAL_GRANTED`, `APPROVAL_DENIED`, `APPROVAL_EXPIRED`
- `SECURITY_VIOLATION_BLOCKED`, `SECRET_ACCESS_DENIED`, `EMERGENCY_KILL_SWITCH_TRIGGERED`

### Tool & Runner Execution
- `TOOL_DISPATCHED`, `TOOL_STARTED`, `TOOL_OUTPUT_STREAMED`, `TOOL_COMPLETED`, `TOOL_FAILED`
- `RUNNER_HEARTBEAT`, `RUNNER_CONNECTED`, `RUNNER_DISCONNECTED`, `RUNNER_RECONCILED`

### Quality Assurance & Learning
- `SELF_REVIEW_COMPLETED`, `QA_HANDOFF_TRIGGERED`, `QA_AUDIT_PASSED`, `QA_BUGS_REPORTED`
- `LESSON_PROPOSED`, `LESSON_VALIDATED`, `PLAYBOOK_UPDATED`
