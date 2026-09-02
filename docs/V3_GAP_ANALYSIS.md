# GIDEON AI HQ — V3 GAP ANALYSIS & MONOREPO AUDIT
**Date:** September 2026  
**Status:** Architecture Lock Baseline  
**Workspace Root:** `C:\Users\DELL\agent-workspace`  
**Reference Specification:** `VISION_PROJECT.md` (V3 Specification Lock)

---

## 1. Executive Summary

This gap analysis reviews all existing files and structures in `c:\Users\DELL\agent-workspace` against the definitive **Gideon AI HQ V3 Master Architecture**.

### The Core V3 Mandate:
1. **`yt-automation` is 100% OFF-LIMITS**: Completely isolated, frozen, read-only architectural reference.
2. **Runtime-First, Not Dashboard-First**: The web dashboard is purely the Human Control Plane; the core product is the autonomous Agent Runtime, Policy Engine, Local Runner Daemon (`gideon-runner`), and Registered Workspace Sandbox.
3. **Monorepo Architecture**: Clean separation between `apps/hq`, `packages/runtime`, `packages/policy`, `packages/agents`, `packages/tools`, `packages/runner`, `packages/memory`, and `packages/shared`.

---

## 2. Inventory & Classification Matrix

| Existing Item | Current Location | Classification | V3 Target & Action Plan |
|---|---|---|---|
| `VISION_PROJECT.md` | Workspace Root & `/docs` | **KEEP** | Anchor document defining the V3 specification lock. |
| `docs/MASTER_VISION_AND_NOTICES.md` | `docs/` | **REFACTOR** | Superseded by `VISION_PROJECT.md` and `docs/MASTER_ARCHITECTURE.md`. |
| `docs/CODEBASE_AUDIT.md` | `docs/` | **KEEP** | Historical audit of `yt-automation` kept for architectural inspiration. |
| `docs/ARCHITECTURE.md` | `docs/` | **REFACTOR** | Replace with comprehensive `docs/MASTER_ARCHITECTURE.md` covering HQ + Local Runner. |
| `docs/ROUTES_AND_FEATURES.md` | `docs/` | **KEEP** | Audit reference for studio routes. |
| `docs/INTEGRATION_AUDIT.md` | `docs/` | **KEEP** | Integration reference for Gemini, PixVerse, ElevenLabs, Drive. |
| `docs/TECHNICAL_DEBT.md` | `docs/` | **KEEP** | Audit reference for yt-automation technical debt. |
| Monorepo Root `package.json` | Root | **NOT YET BUILT** | Build root monorepo config with npm/pnpm workspaces. |
| Supabase V3 Schema | `supabase/migrations/` | **NOT YET BUILT** | Build `20260902000000_gideon_hq_v3_core.sql` (Machines, Workspaces, Agents, Tasks, Runs, Plans, Steps, Approvals, Artifacts, Memories, Skills, Playbooks, Events). |
| `packages/shared` | `packages/shared/` | **NOT YET BUILT** | Build TypeScript interfaces, state enums, schemas, and risk tiers. |
| `packages/policy` | `packages/policy/` | **NOT YET BUILT** | Build `PolicyEngine`, `RiskEngine`, `ApprovalPolicy`, `CommandPolicy` (allowlist + secret protection). |
| `packages/tools` | `packages/tools/` | **NOT YET BUILT** | Build `ToolRegistry`, `ToolDefinition`, and tool schemas. |
| `packages/runner` | `packages/runner/` | **NOT YET BUILT** | Build `Gideon Runner` local daemon (heartbeats, sandbox, job executor, kill switch). |
| `packages/runtime` | `packages/runtime/` | **NOT YET BUILT** | Build `AgentRuntime`, `RuntimeStateMachine`, `Planner`, `RiskEvaluator`, `SelfReviewer`, `HandoffManager`. |
| `packages/agents` | `packages/agents/` | **NOT YET BUILT** | Build `Forge` (Developer), `Sentinel` (QA), `Atlas` (Orchestrator). |
| `packages/memory` | `packages/memory/` | **NOT YET BUILT** | Build `MemoryEngine`, `MemoryRetriever`, `MemoryWriter`, `LessonExtractor`. |
| `apps/hq` (Next.js 15) | `apps/hq/` | **NOT YET BUILT** | Build HQ Control Plane (Command Center, Tasks Mission View, Approval Center, Workspaces, Machines, Memory Vault, Playbooks, Activity). |

---

## 3. Mandatory Security & Safety Upgrades

1. **Workspace Sandbox**:
   - Must use canonical path resolution (`fs.realpathSync`), Windows case normalization, symlink/junction detection, and relative path escape checks rather than naive `startsWith()`.
2. **Secret File Protection**:
   - Deny agent read/write access to `.env`, `.env.local`, `.git/config`, private keys, and credential stores by default.
3. **Command Allowlisting**:
   - Replace generic blacklists with strict allowlists (`npm test`, `npm run build`, `npm run lint`, `git status`, `git diff`, etc.) with explicit approval gates for non-allowlisted commands.
4. **Approval Binding & Idempotency**:
   - Every execution job must carry a cryptographic authorization hash and idempotency key so reconnection cannot cause double-execution.
5. **Universal Kill Switch**:
   - Local runner must maintain process tracking to immediately terminate running subprocesses upon receiving an emergency stop event.

---

## 4. Immediate Execution Roadmap

1. **Step 1**: Lock Phase 0 Engineering Specs in `docs/`.
2. **Step 2**: Initialize Monorepo root and database migration schema (`supabase/migrations/`).
3. **Step 3**: Implement `packages/shared`, `packages/policy`, `packages/tools`, `packages/runner`.
4. **Step 4**: Implement `packages/runtime`, `packages/agents` (Forge & Sentinel), `packages/memory`.
5. **Step 5**: Implement `apps/hq` Next.js 15 Control Plane connected to real Supabase tables and Realtime event stream.
6. **Step 6**: Execute the official Phase 4 End-to-End Verification Demonstration.
