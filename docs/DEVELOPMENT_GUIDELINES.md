# GIDEON AI HQ — DEVELOPMENT GUIDELINES & NON-NEGOTIABLES
**Version:** 3.0.0  
**Status:** Specification Lock  

---

## 1. Immutable Rules for Code & Implementation

1. **`yt-automation` is FROZEN**: Never edit, refactor, or migrate files in `C:\Users\DELL\yt-automation`.
2. **Runtime First, UI Second**: Every UI element must reflect real database and runtime state. No fake simulations or disconnected mocked state.
3. **Workspace Isolation**: No tool call may ever touch filesystem paths outside explicitly registered workspace roots.
4. **Secrets Separation**: Plain API keys and secrets reside in environment variables or credential brokers. Agents receive temporary scoped authorization hashes only.
5. **No Direct OS Shells in Next.js**: The Next.js API routes never call `child_process.exec()`. All machine commands route through the Local Runner daemon.
6. **No Uncontrolled Prompt Mutation**: Agent learning happens through verified lessons, skills, and playbooks, never uncontrolled self-rewriting of system prompts.
7. **Every Mutation is Observable & Auditable**: Every write action produces a diff preview, an execution log, and an entry in `hq_activity_logs`.
