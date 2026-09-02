# MASTER VISION & NOTICES: PERSONAL AI WORKFORCE OS
**Project Codename:** Gideon AI HQ / The Basement  
**Architecture:** Autonomous Multi-Agent Workforce OS & AI Studio  
**Date:** September 2026  
**Reference ID:** `HQ-CORE-BACKBONE-001`

---

## 1. Executive Summary & Core Philosophy

The goal is to build an autonomous, persistent, permission-aware **Personal AI Workforce OS**—transforming AI from a single stateless chatbot into a structured, highly specialized team of digital employees that collaborate, execute real workflows, maintain persistent memory, and operate with human-in-the-loop governance.

Rather than relying on closed third-party agent silos, this platform provides:
1. **Unified Agent Headquarters (Command Center)**: A single glasspane to manage, monitor, instruct, and review digital employees across departments.
2. **Specialized Digital Employees**: Role-specific agents with scoped permissions, unique skills, and clear operational boundaries.
3. **Playbooks & Routine Learning**: Operational workflows codified as executable steps that agents learn, repeat, and refine.
4. **Integration Gateway (MCP & OAuth)**: Secure, authenticated connections to external tools (GitHub, Vercel, Google Drive, YouTube, Email, LinkedIn, X/Twitter, PixVerse, ElevenLabs).
5. **Human-in-the-Loop Approval Gates**: Autonomous drafting and preparation, with mandatory approval triggers before destructive actions, financial spend, external communications, or production deployments.
6. **Self-Improvement via Post-Task Reviews**: Agents review completed work and failures to propose playbook refinements without unauthorized privilege escalation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           GIDEON AI HQ                                  │
│                      (Personal Workforce OS)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                  │                                      │
│                         🧠 ATLAS (Chief of Staff)                       │
│                                  │                                      │
│         ┌────────────────────────┼────────────────────────┐             │
│         ▼                        ▼                        ▼             │
│   🎬 AI STUDIO            💻 DEV HQ                💼 CAREER HQ         │
│  (Content Dept)        (Software Dept)          (Opportunity Dept)      │
│  ├── Researcher        ├── Forge (Dev)          ├── Scout (Career)      │
│  ├── Scriptwriter      ├── Sentinel (QA)        ├── Postmaster (Comms)  │
│  ├── Visual Director   └── Release Agent        └── Outreach Agent      │
│  ├── Image Agent                                                        │
│  ├── Video Agent                                                        │
│  └── Publishing Agent                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ 📊 ORACLE (BI & Telemetry)  │  🧠 ARCHIVE (Shared & Scoped Memory)       │
│ 🔐 MCP & INTEGRATION GATEWAY (GitHub, Drive, YouTube, PixVerse, Supabase)│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Departmental Blueprint & Agent Roster

### Department 1: Content Production (AI Studio)
*Current working baseline evolved from `yt-automation`.*
- **🎬 Producer Agent**: Oversees video projects from concept to final export. Delegates tasks to specialized sub-agents and tracks progress against deadlines.
- **🔍 Research Agent**: Conducts topic deep-dives, validates factual accuracy, extracts engaging angles, and produces research briefs.
- **✍️ Script Agent**: Converts research briefs into structured, timed multi-scene scripts with hooks, voiceover dialogue, visual pacing, and calls-to-action.
- **🎨 Visual Director Agent**: Interprets script scenes into precise visual scene plans, cinematic camera movements, lighting, environment style, and character consistency guidelines.
- **🖼️ Image Agent**: Translates visual directions into optimized image generation prompts (Midjourney `--ar 16:9`, Flux, Imagen), manages image assets, and handles revisions.
- **🎥 Video Agent**: Manages generative video render engines (PixVerse v2/v3.5/v6, Vertex Veo 3, Runway Gen-3, Kling), handling aspect ratios, motion prompts, and lip-sync audio alignment.
- **🧪 Studio QA Agent**: Audits generated scenes, checks for missing assets, verifies video durations, validates audio synchronization, flags rendering artifacts, and triggers automated retries.
- **📺 Publishing Agent**: Integrates with YouTube and Google Drive to assemble metadata (titles, descriptions, tags, chapters), upload final master files, generate thumbnails, and schedule releases upon approval.

### Department 2: Software Engineering (Dev HQ)
- **💻 Forge (Senior Developer Agent)**: Understands codebases, project architecture, and coding standards (React, Next.js, TypeScript, Tailwind, Supabase). Plans and writes code, refactors modules, writes unit tests, and prepares Git commits.
- **🧪 Sentinel (QA & Reliability Agent)**: Attacks builds and deployments—runs automated test suites, tests mobile responsiveness, inspects network requests, audits console logs, checks for broken links, and validates API contracts before approving PRs.

### Department 3: Career & Communications (Career HQ)
- **💼 Scout (Career Agent)**: Maintains dynamic CVs, portfolios, and project histories. Scrapes and filters developer jobs and freelance gigs, scores match percentages, and drafts tailored applications.
- **📧 Postmaster (Communications Agent)**: Monitors connected inboxes, categorizes incoming messages (interview invites, client inquiries, spam), drafts professional responses, and alerts Atlas for review.

### Department 4: Operations & Intelligence
- **📊 Oracle (Business Intelligence & Analytics Agent)**: Aggregates real-time telemetry across all departments—tracks active projects, API spend, video views, application response rates, and system uptime.
- **🧠 Archive (Knowledge & Memory Agent)**: Manages vector embeddings, relational facts, project documentation, personal preferences, and cross-agent context. Enforces strict read/write permission scopes across agents.

---

## 3. Core Architecture & Design Rules

### Rule 1: Separation of Concerns
Strictly isolate:
1. **Agents**: Persona, prompt templates, reasoning strategy, and tool access declarations.
2. **Workflows & State Machines**: Deterministic state transitions (Draft $\rightarrow$ Writing $\rightarrow$ Approved $\rightarrow$ Rendering $\rightarrow$ Review $\rightarrow$ Published) enforced by code, not LLM whim.
3. **Integrations & MCP Gateway**: Standardized tool interface with credential vaults and OAuth token refreshes.
4. **Memory Layer**: Scoped relational tables + vector stores with access-control policies.

### Rule 2: Least-Privilege & Scoped Permissions
No agent receives universal system access or plain passwords:
- **Career Agent**: Reads resume, public portfolio, job board APIs. *Denied access to git repos, private inboxes, payment gateways.*
- **Developer Agent**: Reads git repositories, local dev terminal, issue trackers. *Denied access to personal emails, social DMs, bank credentials.*
- **Content Agent**: Reads YouTube channel metrics, storage buckets, creative prompts. *Denied access to code repos, resume data.*

### Rule 3: Human-in-the-Loop (HITL) Approval Matrix
Actions are classified by autonomy tier:
- 🟢 **Tier 1 (Fully Autonomous)**: Read queries, research, prompt drafting, local test runs, scene readiness validation.
- 🟡 **Tier 2 (Requires Confirmation / Reversible)**: Asset creation, staging deployments, queueing paid renders within budget limits.
- 🔴 **Tier 3 (Strict Approval Required / Irreversible / Outward-Facing)**: Production Git push, public YouTube publish, sending emails/job applications, social media posts, credit card billing changes.

### Rule 4: Playbooks & Routine Learning
Rather than retraining models, repeatable operations are codified into **Playbooks**:
```json
{
  "playbook_id": "pb_deploy_nextjs_preview",
  "name": "Deploy Next.js Preview Branch",
  "steps": [
    { "step": 1, "action": "git_checkout_branch", "args": { "branch": "preview" } },
    { "step": 2, "action": "run_npm_test", "args": {} },
    { "step": 3, "action": "run_build_check", "args": {} },
    { "step": 4, "action": "trigger_vercel_preview", "args": {} },
    { "step": 5, "action": "request_sentinel_qa", "args": {} }
  ]
}
```

### Rule 5: Post-Task Review & Self-Improvement
After every execution, a structured post-mortem is recorded:
- What was the intended outcome?
- What were the actual steps and tool outputs?
- Did any step fail or require retries?
- What lesson should be stored in memory or updated in the playbook?

---

## 6. Multi-Phase Implementation Roadmap

```
PHASE 0: AUDIT & FOUNDATION (Current)
├── Complete audit of existing `yt-automation` codebase
├── Document architecture, schema, routes, integrations, and technical debt
└── Formulate master blueprint & notices

PHASE 1: STABILIZATION & CLEANUP
├── Replicate & isolate codebase inside dedicated workspace directory
├── Standardize environment configuration & remove hardcoded URLs
├── Fix Gemini model identifiers & SDK configurations
└── Establish reliable background worker runner

PHASE 2: INTEGRATION FRAMEWORK (MCP GATEWAY)
├── Implement unified `/api/integrations` schema
├── Google Drive integration (bidirectional sync & folder management)
└── YouTube Data API v3 integration (channel auth, metadata, upload queue)

PHASE 3: CONTENT AGENT TEAM (AI STUDIO WORKFORCE)
├── Producer Agent (Mission Control orchestrator)
├── Research & Scriptwriter Agents (structured scene decomposition)
├── Visual Director & Prompt Generator Agents
└── Studio QA Agent (automated asset verification & retry logic)

PHASE 4: AGENT HQ RUNTIME & DASHBOARD
├── Full Agent HQ Dashboard UI (cards, real-time activity streams, task delegation)
├── Atlas (Chief of Staff) delegation engine
├── Persistent Scoped Memory (Archive) & Playbook engine
└── Incident & Approval Center

PHASE 5: EXPANSION (DEV HQ & CAREER HQ)
├── Forge (Developer) & Sentinel (QA) integrations with GitHub/Vercel
└── Scout (Career) & Postmaster (Email) integrations with Approval Gates
```

---

## 7. Architectural Questions & Next-Step Clarifications

1. **Target Deployment Scope**: Is this primarily for your personal digital command center, or should multi-tenant organization isolation (teams, billing tiers, API quotas) be baked into the foundational schema from Day 1?
2. **Video & AI Render Strategy**: Do you want PixVerse to remain the primary rendering engine with Veo 3 / Runway / Kling as secondary fallbacks, or do you want an intelligent router that chooses the provider based on scene style (e.g. photorealistic vs animated vs cinematic)?
3. **Midjourney Integration**: Do you prefer automating Midjourney prompt execution via an automated API (e.g., GoAPI, PiAPI, or Midjourney API wrapper), or keeping the current hybrid flow where prompts are generated and copied/pasted while images are uploaded?
4. **Local Daemon vs Cloud Worker**: For background job execution (polling render jobs, generating voiceovers, syncing drive), should we establish a serverless queue worker (Inngest / Upstash / QStash) or a standalone Node daemon?
