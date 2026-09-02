# GIDEON AI HQ — MASTER ARCHITECTURE SPECIFICATION
**Version:** 3.0.0  
**Status:** Specification Lock  
**Classification:** Core System Architecture  

---

## 1. System Topology & Decoupling

Gideon AI HQ decouples human interaction from intelligence and local machine execution into four distinct tiers:

```
┌─────────────────────────────────────────────────────────────┐
│                 TIER 1: HQ CONTROL PLANE                    │
│  • Next.js 15 App Router (Cloud / Vercel / Local)           │
│  • Command Center, Task Mission View, Approval Center       │
│  • Workspace Registry, Memory Vault, Playbooks, Activity    │
│  • Supabase PostgreSQL State & Realtime Event Stream        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                Persisted Tasks & Realtime Events
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 TIER 2: AGENT RUNTIME                       │
│  • Task State Machine (Context -> Plan -> Risk -> Review)   │
│  • LLM Adapter (Gemini, Vertex, OpenAI, multi-model router) │
│  • Forge (Developer Agent), Sentinel (QA), Atlas (Router)   │
│  • Scoped Memory Retriever & Evaluator Lesson Extractor     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                  Proposed Tool Action Requests
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             TIER 3: POLICY & TRUST ENGINE                   │
│  • Workspace Boundary Check & Secret File Protection        │
│  • 4-Tier Risk Engine (Low, Medium, High, Critical)         │
│  • Approval Modes (Auto, Plan Approval, Session, Always Ask)│
│  • Budget Governor & Loop Protection Limits                 │
│  • Cryptographic Authorization Hash Binding                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                Authorized & Signed Execution Jobs
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             TIER 4: GIDEON LOCAL RUNNER DAEMON              │
│  • Standalone Node.js/TypeScript Service on Windows PC      │
│  • Machine Registration & Heartbeat Daemon                  │
│  • Hardened Path Sandbox (Canonicalization & Junction check)│
│  • Native Tool Executors (Filesystem, Git, Command Runner)  │
│  • Subprocess Process Manager & Instant Kill Switch         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 REGISTERED WORKSPACES                       │
│  • Explicitly Authorized Local Directories                  │
│  • Git Repositories (Stemi AI, Portfolio, agent-workspace)  │
│  • Optional Isolated Git Worktrees for Agent Feature Work   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems

### Subsystem A: The HQ Control Plane (`apps/hq`)
- Provides real-time visibility into workforce operations.
- Renders the Command Center, Task Timeline, Approval Center with code diffs, Memory Vault with provenance tags, and Workspace Directory.
- Consumes the `hq_events` stream via Supabase Realtime for live updates without aggressive polling loops.

### Subsystem B: The Agent Runtime (`packages/runtime`)
- Implements the 14-step deterministic execution loop.
- Manages agent state transitions (`CREATED` $\rightarrow$ `CONTEXT_LOADING` $\rightarrow$ `PLANNING` $\rightarrow$ `WAITING_APPROVAL` $\rightarrow$ `EXECUTING` $\rightarrow$ `SELF_REVIEW` $\rightarrow$ `QA_PENDING` $\rightarrow$ `COMPLETED`).
- Contains no UI logic; runs as an autonomous engine.

### Subsystem C: Policy & Risk Engine (`packages/policy`)
- Intercepts all proposed actions before dispatch.
- Computes contextual risk:
  $$\text{Risk} = f(\text{Tool}, \text{Target File}, \text{Git Branch}, \text{Workspace Sensitivity}, \text{Budget}, \text{External Impact})$$
- Generates Execution Contracts with locked scopes (e.g. maximum 3 files, allowed commands only).

### Subsystem D: Gideon Local Runner (`packages/runner`)
- Runs locally as a persistent background service on `GIDMACHINE`.
- Verifies authorization hashes on execution jobs before touching disk or spawning processes.
- Enforces strict canonical path checks to prevent any traversal outside authorized workspace roots.
- Emits real-time execution events and maintains process handles for instant kill-switch termination.

---

## 3. Monorepo Organization

```
agent-workspace/
├── apps/
│   └── hq/                 # Next.js 15 Web Dashboard
├── packages/
│   ├── shared/             # Common types, enums, schemas
│   ├── policy/             # Policy, Risk, Budget, Approval logic
│   ├── tools/              # Tool definitions & schemas
│   ├── runner/             # Local Runner daemon service
│   ├── runtime/            # Agent execution loop & state machine
│   ├── agents/             # Forge, Sentinel, Atlas personas
│   └── memory/             # Memory engine & lesson extraction
├── supabase/
│   └── migrations/         # PostgreSQL database schema
└── docs/                   # Engineering specifications
```
