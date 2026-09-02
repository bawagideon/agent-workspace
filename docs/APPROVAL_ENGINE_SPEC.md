# GIDEON AI HQ — APPROVAL & TRUST ENGINE SPECIFICATION
**Version:** 3.0.0  
**Status:** Specification Lock  
**Classification:** Core Safety & Governance System  

---

## 1. Approval Matrix & Risk Tiers

The Approval Engine governs all agent actions based on contextual risk and user-configured policies:

| Risk Tier | Examples | Default Approval Mode | Trigger Criteria |
|---|---|---|---|
| 🟢 **LOW** | `fs_read_file`, `fs_list_dir`, `git_status`, `memory_search` | **AUTO** | Read-only operations on non-sensitive files. |
| 🟡 **MEDIUM** | `fs_write_file` (within workspace), `npm test`, `git checkout` | **PLAN APPROVAL** | Code edits in non-config files; full plan approved once. |
| 🟠 **HIGH** | `git_commit`, `terminal_run_build`, `npm install`, new branch | **SESSION APPROVAL** | Permanent local repository mutations. |
| 🔴 **CRITICAL** | `git_push`, production deploy, deleting files, sending emails | **ALWAYS ASK** | External impact, remote mutations, irreversible actions. |

---

## 2. Plan Approval with Scope Locking

When the user approves a plan:
1. The engine generates an **Execution Scope Lock**:
   - `allowed_files`: Explicit list of target paths.
   - `allowed_commands`: Explicit list of terminal command strings.
   - `max_modifications`: Strict ceiling on file count.
   - `expires_at`: 30-minute expiry timestamp.
2. If the agent attempts to modify a file outside `allowed_files`, execution immediately halts and creates a new approval request.

---

## 3. Cryptographic Authorization Hash

Every approval record contains an HMAC SHA-256 signature calculated over:
$$\text{AuthHash} = \text{HMAC}(\text{AgentID} \parallel \text{WorkspaceID} \parallel \text{ToolName} \parallel \text{ParamsHash} \parallel \text{ExpiresAt})$$

When the local runner receives a step to execute, it recomputes the hash. If the payload was tampered with or parameters shifted, execution is aborted immediately.
