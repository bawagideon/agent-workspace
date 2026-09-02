# GIDEON AI HQ — SECURITY MODEL & SAFETY ARCHITECTURE
**Version:** 3.0.0  
**Status:** Specification Lock  
**Classification:** Core Security Architecture  

---

## 1. Principles of Least Privilege & Defenses in Depth

No agent operating within Gideon AI HQ has direct, unmediated access to operating system shells, arbitrary filesystem paths, or plain credentials. Security is enforced through multiple concentric defensive rings:

```
┌─────────────────────────────────────────────────────────────┐
│  RING 1: INTENT & PROMPT SAFETY                             │
│  • Agent instructions locked; no self-modifying core prompt  │
│  • Task goals parsed into structured, verifiable plans       │
├─────────────────────────────────────────────────────────────┤
│  RING 2: POLICY & CONTEXTUAL RISK ENGINE                    │
│  • Risk scoring: LOW, MEDIUM, HIGH, CRITICAL                │
│  • Approval Modes: AUTO, PLAN APPROVAL, SESSION, ALWAYS ASK │
│  • Scope Locking & Execution Contracts                      │
├─────────────────────────────────────────────────────────────┤
│  RING 3: CRYPTOGRAPHIC AUTHORIZATION HASH                   │
│  • Execution Job signed with HMAC over exact action & params│
│  • Expiring tokens; revalidated by Runner before execution   │
├─────────────────────────────────────────────────────────────┤
│  RING 4: HARDENED WORKSPACE SANDBOX                         │
│  • Canonical real-path resolution (realpathSync)            │
│  • Windows case normalization & drive letter validation     │
│  • Symlink, junction, and UNC path traversal blocking       │
│  • Secret file blocking (.env, .git/config, id_rsa)         │
├─────────────────────────────────────────────────────────────┤
│  RING 5: PROCESS ISOLATION & KILL SWITCH                    │
│  • Command allowlisting (npm test, git status, etc.)         │
│  • Spawns tracked child processes with hard timeouts        │
│  • Instant SIGTERM / SIGKILL via universal kill switch      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Workspace Sandboxing Specification

### Canonical Path Resolution Algorithm
```typescript
import fs from 'fs';
import path from 'path';

export function validateSafeWorkspacePath(workspaceRoot: string, requestedPath: string): string {
  // 1. Resolve canonical realpath for the workspace root
  const canonicalRoot = fs.realpathSync(workspaceRoot);
  
  // 2. Resolve absolute target path
  const absoluteTarget = path.isAbsolute(requestedPath) 
    ? path.normalize(requestedPath)
    : path.normalize(path.join(canonicalRoot, requestedPath));
    
  // 3. Prevent drive letter hopping on Windows
  if (path.parse(canonicalRoot).root.toLowerCase() !== path.parse(absoluteTarget).root.toLowerCase()) {
    throw new Error(`Security Violation: Cross-drive access blocked: ${requestedPath}`);
  }

  // 4. Check relative path boundary
  const relative = path.relative(canonicalRoot, absoluteTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Security Violation: Path traversal outside workspace boundary: ${requestedPath}`);
  }

  // 5. Check for symlinks that resolve outside workspace
  if (fs.existsSync(absoluteTarget)) {
    const canonicalTarget = fs.realpathSync(absoluteTarget);
    const targetRelative = path.relative(canonicalRoot, canonicalTarget);
    if (targetRelative.startsWith('..') || path.isAbsolute(targetRelative)) {
      throw new Error(`Security Violation: Symlink points outside workspace boundary: ${requestedPath}`);
    }
    return canonicalTarget;
  }

  return absoluteTarget;
}
```

### Secret File Access Denial
The following patterns are permanently blocked from agent read/write operations unless an explicit root policy is created:
- `.env*` (`.env`, `.env.local`, `.env.production`)
- `.git/config`, `.git/credentials`
- `*id_rsa*`, `*.pem`, `*.key`
- `node_modules/**` (direct edits blocked; must use package managers)

---

## 3. Command Allowlisting & Policy

Rather than fragile blacklists, the command executor operates on strict **Allowlists**:

### Tier 1: Auto-Allowed Verification Commands
- `npm test`, `pnpm test`, `yarn test`, `npm run test:*`
- `npm run build`, `pnpm build`, `npm run lint`
- `npm run typecheck`, `npx tsc --noEmit`
- `git status`, `git diff`, `git log`, `git branch`

### Tier 2: Plan-Approved Commands
- `git checkout -b <branch>`, `git add <files>`, `git commit -m <msg>`
- `npm run dev` (with timeout monitor)

### Tier 3: Always-Ask High-Risk Commands
- `git push *`
- `npm install *`, `pnpm add *` (Dependency addition requires lockfile preview)
- `vercel deploy`, `vercel --prod`
- Any command not explicitly present in the allowlist

---

## 4. Universal Kill Switch & Emergency Freeze

- **Global Kill Switch**: Emits `EMERGENCY_STOP` event on Supabase channel $\rightarrow$ Runner immediately terminates all tracked process handles via process tree traversal $\rightarrow$ All tasks marked `EMERGENCY_STOPPED`.
- **Emergency Read-Only Mode**: Locks all workspace access modes to `READ_ONLY`, instantly rejecting all write tools.
