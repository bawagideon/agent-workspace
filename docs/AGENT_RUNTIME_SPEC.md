# GIDEON AI HQ — AGENT RUNTIME SPECIFICATION
**Version:** 3.0.0  
**Status:** Specification Lock  
**Classification:** Core Runtime Engine  

---

## 1. The 14-Step Deterministic Execution Loop

The Agent Runtime executes all tasks through a strict, deterministic, and verifiable state machine:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TASK INTAKE & VALIDATION                                 │
│    Validate workspace access, runner status, agent profile  │
├─────────────────────────────────────────────────────────────┤
│ 2. CONTEXT RETRIEVAL                                        │
│    Fetch relevant project memory, lessons, preferences      │
├─────────────────────────────────────────────────────────────┤
│ 3. ENVIRONMENT INSPECTION                                   │
│    Read workspace structure, package.json, git status       │
├─────────────────────────────────────────────────────────────┤
│ 4. MULTI-STEP PLAN GENERATION                               │
│    Decompose goal into atomic tool steps with risk scores   │
├─────────────────────────────────────────────────────────────┤
│ 5. EXECUTION CONTRACT FORMULATION                           │
│    Lock maximum file count, command count, budget limits    │
├─────────────────────────────────────────────────────────────┤
│ 6. RISK & POLICY EVALUATION                                 │
│    Evaluate risk: LOW, MEDIUM, HIGH, CRITICAL               │
├─────────────────────────────────────────────────────────────┤
│ 7. APPROVAL GATE (PAUSE IF REQUIRED)                        │
│    Auto vs Plan Approval vs Session vs Always Ask           │
├─────────────────────────────────────────────────────────────┤
│ 8. ATOMIC STEP EXECUTION                                    │
│    Runner revalidates auth hash -> executes tool -> returns │
├─────────────────────────────────────────────────────────────┤
│ 9. OBSERVATION & RESULT COMPARISON                          │
│    Verify actual output matches expected outcome            │
├─────────────────────────────────────────────────────────────┤
│ 10. RECOVERY LOOP (IF STEP FAILED)                          │
│     Max 3 retry loops before escalating to human            │
├─────────────────────────────────────────────────────────────┤
│ 11. SELF REVIEW SCORECARD                                   │
│     Forge audits diff, typechecks, builds, test coverage    │
├─────────────────────────────────────────────────────────────┤
│ 12. QA PEER REVIEW (SENTINEL HANDOFF)                       │
│     Independent verification by QA agent                    │
├─────────────────────────────────────────────────────────────┤
│ 13. TASK COMPLETION & ARTIFACT PERSISTENCE                  │
│     Store git diffs, test logs, summaries in hq_artifacts   │
├─────────────────────────────────────────────────────────────┤
│ 14. LESSON EXTRACTION & PLAYBOOK UPDATE                     │
│     Extract actionable lessons -> Evaluator validation      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Complete State Machine Definition

```
CREATED
   │
   ▼
QUEUED
   │
   ▼
RUNNER_ASSIGNED
   │
   ▼
CONTEXT_LOADING
   │
   ▼
INSPECTING
   │
   ▼
PLANNING
   │
   ├───────────────┐
   │               │
   ▼               ▼
RISK_EVALUATING   BLOCKED
   │
   ▼
WAITING_APPROVAL
   │
   ├──── REJECTED ────► REPLANNING
   │
   ▼ APPROVED
EXECUTING
   │
   ├──── ERROR ───────► RECOVERY (Max 3 retries)
   │
   ▼
OBSERVING
   │
   ▼
SELF_REVIEW
   │
   ├──── FAILED ──────► REPLANNING
   │
   ▼
QA_PENDING
   │
   ▼
QA_EXECUTING
   │
   ├──── ISSUES ──────► REWORK
   │
   ▼
COMPLETED
   │
   ▼
LEARNING
   │
   ▼
ARCHIVED
```

---

## 3. Self-Review Scorecard Specification

Before marking a task ready for QA, the agent computes an automated scorecard:
1. **Goal Compliance**: Does the code solve the exact user request?
2. **Type Safety**: Did `npm run typecheck` complete with zero errors?
3. **Test Coverage**: Did existing and newly added unit tests pass?
4. **Scope Integrity**: Were only authorized files modified?
5. **Security**: Are all secrets redacted and no private credentials committed?

The resulting scorecard is saved to `hq_task_artifacts` as a `SELF_REVIEW` artifact.
