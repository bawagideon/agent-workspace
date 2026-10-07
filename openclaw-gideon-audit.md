# MISSION BRIEFING: GIDEON AI HQ × OPENCLAW RUNTIME AUDIT

You are the designated Gateway Agent operating within the OpenClaw runtime layer on behalf of Gideon AI HQ (Workforce Operating System & Control Plane).

This is an official systems interrogation and readiness probe. 
Do NOT perform any destructive actions, do NOT modify project files, and do NOT alter external production systems.

Perform a thorough self-inspection of your current operational state and return a structured SYSTEMS REPORT covering the following dimensions:

---

### 1. IDENTITY & COGNITIVE ENGINE
- **Reported Agent ID & Role**: What is your registered agent identifier and designated persona?
- **Active Model & Provider**: Confirm the exact model name, provider (Google / Gemini), token context window capacity, and whether thinking/reasoning parameters are active.
- **Inference Latency & Health**: Status of your connection to the model provider via OpenClaw's model router.

### 2. TOOLING, SKILLS & CAPABILITY MATRIX
- **Available Built-in Tools**: List every tool function currently registered in your execution schema (e.g., shell/exec, file read/write, web search, scraping, browser automation).
- **Tool Invocation Test**: Confirm whether you have active live permission to execute tools on this host, or if you are in a constrained/dry-run mode.
- **Skills & Plugins**: List all loaded plugins, custodial skills, and specialized extensions active on this gateway.
- **MCP (Model Context Protocol)**: Report if any MCP client/server bridges are connected or available.

### 3. WORKSPACE CONTEXT & HOST ENVIRONMENT
- **Operating Environment**: Host operating system, architecture, and current execution privileges.
- **Working Directory & Boundaries**: What is your current root working directory? What are your filesystem boundaries or sandbox constraints?
- **Sandbox Status**: Are you executing natively on the Windows host or within a container/sandbox?

### 4. MEMORY, SESSIONS & STATE PERSISTENCE
- **Session ID & Key**: Provide the current session identifier and key.
- **Memory Store**: Where is your session history and long-term memory persisted (e.g., SQLite, vector store, markdown)?
- **Cross-Session Recall**: Is cross-conversation memory enabled or disabled for this agent?

### 5. GATEWAY, CHANNELS & CONTROL PLANE INTEGRATION
- **Gateway Binding**: Confirm your connection to the local OpenClaw WebSocket Gateway (127.0.0.1:18789).
- **Channel Readiness**: What messaging channels (e.g., Telegram, Discord, WhatsApp, Slack) are supported or configured?
- **Control Plane Interface**: How do you expect high-level missions, approval policies, and task dispatches to be handed down from Gideon AI HQ (Atlas / Forge / Sentinel)?

### 6. SAFETY, APPROVALS & OPERATIONAL CONSTRAINTS
- **Approval Policy**: What exec-approval or permission levels are enforced before you can run shell commands or dangerous scripts?
- **Current Limitations**: Any known blockers, missing credentials, unconfigured routes, or architectural restrictions.

---
Format your response with clear markdown headers and bullet points. Be precise, technical, and complete.
