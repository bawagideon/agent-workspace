# VISION_PROJECT.md: GIDEON AI HQ (THE BASEMENT)
**Master Blueprint & Architectural Manifesto for the Personal AI Workforce OS**  
**Classification:** Core System Architecture & IP Specification  
**Version:** 2.0.0  
**Date:** September 2026  

---

## 1. Executive Vision: A True Digital Workforce Operating System

Gideon AI HQ is an autonomous, persistent, permission-governed **Personal AI Workforce OS**. It moves beyond chatbots and simulation dashboards into a real **Agent Runtime + Execution Infrastructure + Local Runner Daemon + Scoped Memory & Skills + Trust & Autonomy Matrix + Observable Control Room**.

### The Three Isolated Pillars of the Ecosystem

```
YOUR DIGITAL ECOSYSTEM
│
├── 🟣 yt-automation
│     └── Existing video generation platform
│         ├── Gemini → scripts
│         ├── Midjourney → images
│         ├── PixVerse → video rendering
│         ├── ElevenLabs → voice
│         ├── Supabase → storage/database
│         └── Google Drive → organization
│
│     STATUS: 100% READ-ONLY REFERENCE / DO NOT TOUCH
│
│
├── 🔵 Gideon AI HQ (agent-workspace)
│     └── Personal AI Workforce OS
│         ├── Agent Control Room (Web Dashboard)
│         ├── Gideon Runner (Local Execution Daemon)
│         ├── Agent Runtime & Execution Loop
│         ├── Scoped Memory Vault (Personal, Project, Agent, Lessons)
│         ├── Skills & Playbook Routine Engine
│         ├── Tool Gateway (Native Tools + MCP + APIs)
│         ├── Approval Center (Risk Engine, Plan Approvals, Kill Switch)
│         └── Multi-Agent Collaboration (Atlas, Forge, Sentinel, Scout)
│
│
└── 🟢 External Workspaces & APIs
      ├── Local Coding Repositories (Registered Workspaces)
      ├── GitHub / Vercel
      ├── Gmail / Google Drive
      ├── YouTube / X (Twitter) / LinkedIn
      └── Supabase Cloud Database
```

---

## 2. Core Architectural Philosophy: Runtime-First, Not Dashboard-First

A dashboard is only the control room. The core engine is built in this strict dependency order:

```
AGENT RUNTIME & EXECUTION LOOP
            │
            ▼
LOCAL RUNNER DAEMON & WORKSPACE SANDBOX
            │
            ▼
TOOL GATEWAY & MCP ABSTRACTION
            │
            ▼
SCOPED MEMORY, SKILLS & PLAYBOOKS
            │
            ▼
APPROVAL CENTER & RISK ENGINE
            │
            ▼
MULTI-AGENT COLLABORATION & HANDOFFS
            │
            ▼
HQ CONTROL ROOM / DASHBOARD
```

---

## 3. The Real Agent Execution Loop

Every agent follows an observable, deterministic, and self-evaluating execution cycle:

```
┌────────────────────────────────────────┐
│ 1. RECEIVE TASK / GOAL                 │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 2. RETRIEVE SCOPED CONTEXT             │
│    • Personal preferences (with source)│
│    • Project memory & architecture     │
│    • Past similar tasks & lessons      │
│    • Workspace files & git status      │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 3. INSPECT ENVIRONMENT & WORKSPACE     │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 4. FORMULATE MULTI-STEP PLAN           │
│    • Break goal into atomic tool calls │
│    • Calculate token & financial cost  │
│    • Compute Risk Level (Low/Med/High) │
└──────────────────┬─────────────────────┘
                   ▼
┌────────────────────────────────────────┐
│ 5. PERMISSION & APPROVAL GATE          │
│    • Auto (Read / Safe queries)        │
│    • Session Approved (Task writes)    │
│    • Plan Approved (Diff preview)      │
│    • Always Ask (Push / Deploy / Send) │
└──────────────────┬─────────────────────┘
                   │
           ┌───────┴───────┐
           │               │
       [Approved]     [Requires HITL]
           │               │
           ▼               ▼
┌──────────────────────┐ ┌──────────────┐
│ 6. EXECUTE VIA       │ │ 🚨 PAUSE IN  │
│    LOCAL RUNNER      │ │   APPROVAL   │
└──────────┬───────────┘ │   CENTER     │
           │             └──────┬───────┘
           │                    │ (User Approves)
           ├────────────────────┘
           ▼
┌────────────────────────────────────────┐
│ 7. OBSERVE TOOL RESULT                 │
└──────────────────┬─────────────────────┘
                   │
           ┌───────┴───────┐
           │               │
       [Failed]        [Success]
           │               │
           ▼               ▼
┌──────────────────────┐ ┌──────────────────────┐
│ REPLAN / RECOVERY    │ │ 8. SELF REVIEW       │
│ STRATEGY             │ │    • Build check     │
└──────────────────────┘ │    • Test check      │
                         │    • Security check  │
                         └──────────┬───────────┘
                                    ▼
                         ┌──────────────────────┐
                         │ 9. QA PEER REVIEW    │
                         │    (Sentinel Audit)  │
                         └──────────┬───────────┘
                                    ▼
                         ┌──────────────────────┐
                         │ 10. EXTRACT LESSON   │
                         │     (Evaluator Gate) │
                         └──────────┬───────────┘
                                    ▼
                         ┌──────────────────────┐
                         │ 11. UPDATE PLAYBOOK  │
                         │     & SCOPED MEMORY  │
                         └──────────┬───────────┘
                                    ▼
                         ┌──────────────────────┐
                         │ 12. TASK COMPLETE    │
                         │     (Artifacts saved)│
                         └──────────────────────┘
```

---

## 4. Digital Employee Personas (Full Specifications)

Agents are not simple text prompts. Each employee possesses a rich operational definition:

### 🔨 1. Forge (Senior Software Engineer)
- **Role**: Senior Full-Stack Software Engineer.
- **Specialities**: Next.js 15, React 19, TypeScript 5, Tailwind CSS, Supabase PostgreSQL, API architecture, Clean Code principles.
- **Authorized Tools**: `fs_read`, `fs_write`, `git_status`, `git_diff`, `git_branch`, `git_commit`, `terminal_run_test`, `terminal_run_build`, `github_pr_create`.
- **Permission Policy**: Read is automatic; local writes are Plan-Approved; Git push and Vercel production deploys require explicit human approval.
- **Memory Scope**: Project architecture, coding preferences, past bugs, technical lessons.
- **Active Skills**: Next.js Refactoring, Supabase Migration Authoring, Test-Driven Bug Fixing, Dependency Auditing.
- **Evaluation Criteria**: Code compiles with zero TypeScript errors, unit tests pass, no extraneous file changes, Sentinel QA approval.

### 🛡️ 2. Sentinel (QA, Reliability & Code Reviewer)
- **Role**: Staff Quality Assurance & Security Engineer.
- **Specialities**: Test automation, security audits, regression analysis, boundary testing, performance benchmarking.
- **Authorized Tools**: `fs_read`, `terminal_run_test`, `terminal_run_lint`, `git_diff`, `browser_inspect_element` (future).
- **Permission Policy**: Read and Test Execution only. Cannot push code or deploy.
- **Handoff Workflow**: Forge submits work $\rightarrow$ Sentinel reviews diff, executes test suites, checks for leaked credentials, checks edge cases $\rightarrow$ Sentinel passes or returns structured bug report with line numbers.

### 🧠 3. Atlas (Chief of Staff & Strategic Orchestrator)
- **Role**: Executive Orchestrator & Workforce Coordinator.
- **Specialities**: Goal decomposition, task delegation, dependency DAG construction, workforce monitoring, executive summary generation.
- **Authorized Tools**: `agent_delegate_task`, `agent_inspect_status`, `memory_search_global`, `approval_request_create`.
- **Permission Policy**: Management layer. Cannot execute code or push directly. Coordinates Forge, Sentinel, Scout, and media agents.

### 💼 4. Scout & The Career Team
- **Scout (Opportunity Discovery)**: Searches freelance platforms, tech job boards, and partner networks based on strict criteria.
- **Tailor (Positioning Specialist)**: Customizes portfolio highlights, resumes, and proposal drafts to match job requirements.
- **Outreach (Communications Drafter)**: Prepares high-impact cover letters and introductory emails. *Always gated behind human approval.*

### 🎬 5. Media & Content Department (Future Adapter Layer)
- **Researcher**: Topic deep dives, trend analysis, and source validation.
- **Scriptwriter**: Multi-scene YouTube scripts and voiceover pacing.
- **Visual Director**: Image prompts and cinematic scene directions.
- **Publisher**: Metadata, chapters, thumbnail concepts, and scheduled draft staging.

---

## 5. Local Execution Runner (`gideon-runner`) Architecture

A web dashboard deployed to the cloud cannot and should not attempt to execute raw terminal commands on a local machine. The architecture cleanly separates the **HQ Web Control Room** from the **Gideon Runner Daemon**:

```
┌─────────────────────────────────────────────────────────┐
│              GIDEON AI HQ (Web / Cloud)                 │
│  • Next.js App Router                                   │
│  • Supabase PostgreSQL (State, Tasks, Approvals, Memory)│
│  • Web UI (Control Room, Activity Stream, Approvals)    │
└────────────────────────────┬────────────────────────────┘
                             │ Secure WebSocket / SSE /
                             │ Supabase Realtime Channel
                             ▼
┌─────────────────────────────────────────────────────────┐
│            GIDEON RUNNER (Local PC Daemon)              │
│  • Node.js / TypeScript Service on GIDMACHINE           │
│  • Workspace Sandbox Enforcer (Restricted Directories)  │
│  • Native Tools (Filesystem, Git, Terminal Runner)      │
│  • Local Process Isolation & Resource Limits            │
│  • Instant Kill-Switch Listener                         │
└────────────────────────────┬────────────────────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Workspace   │      │  Workspace   │      │  Workspace   │
│  C:\...\app1 │      │  C:\...\app2 │      │ (Read-Only)  │
│  [READ/WRITE]│      │  [READ/WRITE]│      │ yt-automation│
└──────────────┘      └──────────────┘      └──────────────┘
```

### Workspace Registration & Sandboxing
Agents operate **strictly within registered workspaces**:
```json
{
  "id": "ws_stemi_core",
  "name": "Stemi AI",
  "machine_id": "GIDMACHINE_WIN",
  "path": "C:\\Users\\DELL\\projects\\stemi",
  "access_mode": "READ_WRITE",
  "allowed_agents": ["forge", "sentinel"],
  "git_branch": "main",
  "created_at": "2026-09-02T16:00:00Z"
}
```
Any tool call attempting to traverse outside authorized roots (e.g. `../../Windows/System32`) is immediately blocked and logged as a security alert.

---

## 6. Advanced Database Schema Specification

The database is built on Supabase PostgreSQL with the following core domain tables:

```
CORE WORKFORCE
├── hq_agents (Digital employee definitions, models, temperatures, avatars)
├── hq_agent_sessions (Live active sessions per agent)
├── hq_agent_models (Configured LLMs with cost per token & rate limits)
├── hq_agent_capabilities (Tool bindings & permissions)
└── hq_agent_versions (Immutable prompt, skill & playbook version history)

WORK & EXECUTION
├── hq_tasks (High-level goals, priorities, parent-child DAG hierarchy)
├── hq_task_runs (Individual execution attempts with status progression)
├── hq_task_steps (Atomic steps executed by tools with duration & token cost)
├── hq_task_plans (Multi-step plans formulated by planners with risk scores)
└── hq_task_artifacts (Produced diffs, reports, summaries, test logs, code files)

AGENT COLLABORATION & REVIEW
├── hq_agent_messages (Inter-agent communication channels: #dev, #general, #qa)
├── hq_agent_handoffs (Formal task handoff ledger, e.g. Forge -> Sentinel)
└── hq_agent_reviews (Structured code reviews, bug reports, and scorecards)

SCOPED MEMORY & LEARNING
├── hq_memories (Categorized facts: PERSONAL, PROJECT, AGENT, LESSON)
├── hq_memory_sources (Explicit provenance: User input, task result, verified PR)
├── hq_memory_embeddings (Vector embeddings for semantic similarity search)
└── hq_memory_reviews (Evaluator validation records to prevent false memories)

ROUTINES & SKILLS
├── hq_playbooks (Codified deterministic workflows: step-by-step procedures)
└── hq_skills (Modular domain proficiencies: Next.js, Supabase, Git, etc.)

TRUST, APPROVALS & WORKSPACES
├── hq_workspaces (Registered local directories with permission modes)
├── hq_approvals (Human-in-the-loop queue with diffs, commands & risk tiers)
└── hq_activity_logs (Immutable global audit trail with distributed trace IDs)
```

---

## 7. Approval Matrix & Trust Modes

Actions are evaluated by an automated **Risk Engine** before execution:

| Risk Tier | Examples | Approval Mode | Behavior |
|---|---|---|---|
| 🟢 **LOW** | `fs_read_file`, `fs_list_dir`, `git_status`, `memory_search` | **AUTO** | Executes immediately without interruption. |
| 🟡 **MEDIUM** | `fs_write_file` (within workspace), `npm test`, `git checkout` | **PLAN APPROVAL** | User approves the whole execution plan once; agent executes all medium steps in that session. |
| 🟠 **HIGH** | `git_commit`, `terminal_run_build`, `npm install`, new branch | **SESSION APPROVAL** | User can grant a timed session token (e.g. 1 hour) or approve individually. |
| 🔴 **CRITICAL** | `git_push`, production deploy, deleting files, sending external emails/posts | **ALWAYS ASK** | Strict single-action approval. Shows exact diffs and terminal command previews. |

### Emergency Controls
- **🚨 Universal Kill Switch**: Immediately terminates all active runner child processes, marks tasks as `BLOCKED_EMERGENCY`, and freezes all agent loops.
- **🛡️ Read-Only Emergency Mode**: Restricts all agents to research, analysis, and reading without tool execution capability.
- **⏪ Automated Rollback**: Rollback handlers defined on write tools (e.g., git stash, file backup restoration) triggered if task execution fails mid-way.

---

## 8. Skills vs. Playbooks vs. Memory

To maintain clean separation between agent knowledge, execution procedures, and facts:

| Concept | Definition | Example | Storage & Format |
|---|---|---|---|
| **Skills** | *What an agent is capable of doing* (domain expertise, tool usage patterns, architectural rules). | "Next.js 15 App Router Architecture", "Supabase RLS Policy Authoring" | Markdown instruction sets attached to agent profiles. |
| **Playbooks** | *The repeatable, step-by-step process an agent follows* to accomplish a specific outcome. | "Deploy Next.js Application", "Debug & Fix Unit Test Failure" | Structured JSON/YAML workflow graphs (Deterministic or Adaptive). |
| **Memory** | *What the system knows about you, projects, and history* (facts, preferences, past lessons). | "Gideon prefers Tailwind CSS over CSS modules (Source: User, Conf: 0.98)" | Scoped relational records with source provenance & vector embeddings. |

---

## 9. Phased Implementation Roadmap (v2)

```
PHASE 0: ARCHITECTURE LOCK & SPECIFICATION (Current)
├── MASTER_ARCHITECTURE.md
├── SECURITY_MODEL.md
├── AGENT_RUNTIME_SPEC.md
├── LOCAL_RUNNER_SPEC.md
├── MEMORY_AND_SKILLS_SPEC.md
└── VISION_PROJECT.md anchored

PHASE 1: HQ FOUNDATION & DATA ENGINE
├── Next.js 15 App Router scaffold in `agent-workspace`
├── Comprehensive Supabase migration (Core, Tasks, Memory, Approvals, Workspaces)
├── Base Control Room layout (Sidebar, Active Agent pills, Header)
└── Workspace Registry & Department grouping

PHASE 2: GIDEON RUNNER (LOCAL EXECUTION DAEMON)
├── Standalone Node/TypeScript runner package
├── Workspace path sandboxing & directory boundary checks
├── Local Native Tools (Filesystem, Git, Sandboxed Terminal)
└── Realtime bi-directional channel with HQ

PHASE 3: FORGE (SENIOR DEVELOPER AGENT)
├── Complete Forge persona with Next.js/TypeScript/Supabase skills
├── Runtime Planning Loop & Execution Token signing
├── Real local task execution (reading repos, drafting code, running tests)
└── Automated self-review checklist

PHASE 4: TRUST, APPROVALS & CONTROL ROOM
├── Interactive Approval Center with visual DiffViewer & CommandPreview
├── 4-Tier Risk Engine & Approval Modes (Auto, Plan, Session, Always Ask)
├── Universal Kill Switch & Emergency Read-Only Mode
└── Replay Protection & Execution Token HMAC validation

PHASE 5: SENTINEL (QA & CODE REVIEW AGENT)
├── Sentinel persona with automated test validation & security scanning
├── Agent-to-Agent Handoff Protocol (Forge -> Sentinel -> Atlas -> User)
└── Structured Bug Reporting & Review Scorecards

PHASE 6: SCOPED MEMORY VAULT & PLAYBOOK ENGINE
├── 4-tier Memory Vault (Personal, Project, Agent, Lessons)
├── Editable memory UI with visible sources, confidence scores & enable/disable toggles
├── Evaluator-governed post-task lesson extraction
└── Playbook Builder (Deterministic step-by-step routines & adaptive playbooks)

PHASE 7: ATLAS (CHIEF OF STAFF ORCHESTRATOR)
├── Goal decomposition into multi-agent task DAGs
├── Automated delegation to Forge & Sentinel
├── Cross-department status synthesis
└── Weekly executive summaries & progress reports

PHASE 8: TOOL GATEWAY & MCP EXPANSION
├── GitHub API integration (PR creation, issue tracking)
├── Google Drive & Gmail MCP/API adapters
├── Vercel deployment preview integration
└── Dynamic multi-model routing (Gemini 2.0/2.5/3, cost & token tracking)

PHASE 9: CAREER HQ (SCOUT, TAILOR, OUTREACH)
├── Job board discovery & match scoring
├── Tailored resume & portfolio generator
└── Gated application draft preparation

PHASE 10: MEDIA HQ & EXTERNAL ADAPTERS
├── Topic research & script structuring
├── Visual prompt generation
└── Integration adapter for yt-automation raw renders
```

---

## 10. Permanent Guardrails & Non-Negotiables

1. **`yt-automation` is FROZEN**: Never edit, refactor, or migrate files in `C:\Users\DELL\yt-automation`.
2. **Runtime-First**: Do not build disconnected mock UIs; every screen connects to real runtime state and real runner agents.
3. **Workspace-Sandboxed**: Agents only touch explicitly registered directory paths on authorized machines.
4. **No Plaintext Passwords**: Credentials reside in secure environment vaults or OAuth brokers; agents receive temporary scoped tokens only.
5. **No Uncontrolled Self-Mutation**: Agents cannot rewrite their own core instructions or permissions; learning occurs through Evaluator-approved Lessons, Skills, and Playbooks.
6. **Total Observability**: Every tool call, prompt, output, error, token count, and cost is logged to an immutable audit trail.
