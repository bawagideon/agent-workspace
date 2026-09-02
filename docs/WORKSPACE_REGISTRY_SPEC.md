# GIDEON AI HQ — WORKSPACE REGISTRY SPECIFICATION
**Version:** 3.0.0  
**Status:** Specification Lock  
**Classification:** Sandboxing & Workspace Isolation  

---

## 1. Explicit Registration Model

Agents NEVER operate on arbitrary filesystem paths or open drive roots (`C:\`). Every execution target must be an explicitly registered workspace record in `hq_workspaces`:

```json
{
  "id": "stemi-core",
  "machine_id": "GIDMACHINE_WIN",
  "name": "Stemi AI Core Repository",
  "root_path": "C:\\Users\\DELL\\projects\\stemi",
  "access_mode": "READ_WRITE",
  "git_enabled": true,
  "default_branch": "main",
  "allowed_agents": ["forge", "sentinel"],
  "created_at": "2026-09-02T16:00:00Z"
}
```

---

## 2. Workspace Access Modes

- **`READ_ONLY`**: Agents can list, read, search, and run safe inspection commands. Write operations are rejected at the policy engine before dispatch.
- **`READ_WRITE`**: Agents can modify files subject to the active approval policy.
- **`DISABLED`**: Completely inaccessible to all agents.

---

## 3. Pre-Flight Health Checks

Before any agent begins executing inside a workspace, the runner runs an automated pre-flight check:
1. Canonical path verification on local machine.
2. Git repository integrity and current branch detection.
3. Clean working tree check (flags uncommitted changes).
4. Package manager detection (`package.json`, `pnpm-lock.yaml`, `package-lock.json`).
5. Node.js runtime and TypeScript compiler check.

If uncommitted user work is detected, the runner offers options:
- Create an isolated Git worktree (`agent/forge/task-XXX`).
- Switch to Read-Only inspection mode.
- Request user confirmation before proceeding.
