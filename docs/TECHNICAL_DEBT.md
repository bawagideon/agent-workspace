# TECHNICAL DEBT & REMEDIATION PLAN
**Project Codename:** Gideon AI HQ / The Basement  
**Subsystem:** Code Quality, Security & Architecture Remediation  
**Date:** September 2026  
**Reference ID:** `TECH-DEBT-005`

---

## 1. Prioritized Technical Debt Matrix

| Priority | Issue Description | Impact | Location(s) | Remediation Strategy |
|---|---|---|---|---|
| 🔴 **P0 (Critical)** | **Hardcoded Supabase Storage URLs** | Breaks multi-environment deployment, migrations to custom domains, or self-hosted Supabase instances. | `src/lib/workers/index.ts:266`<br>`src/app/(dashboard)/scenes/page.tsx:411, 608`<br>`src/app/(dashboard)/operations/jobs/page.tsx:190`<br>`src/app/(dashboard)/assets/page.tsx:231, 237, 252, 257` | Replace with dynamic helper: `supabase.storage.from(config.STUDIO_ASSETS_BUCKET).getPublicUrl(path).data.publicUrl` or construct from `config.SUPABASE_URL`. |
| 🔴 **P0 (Critical)** | **Gemini Model Identifier Fallback** | `gemini-3.5-flash` is not a standard Google GenAI API model string, causing initial request failures and unnecessary fallback loops. | `src/lib/config/config.ts:26`<br>`src/lib/providers/script/gemini.ts:62-65`<br>`src/lib/operator/adapters/LLMAdapter.ts:37` | Update default model to `gemini-2.0-flash` (or `gemini-1.5-flash`) and load directly from `process.env.GEMINI_MODEL`. |
| 🟡 **P1 (High)** | **Serverless Worker Dependency on Client Tab** | Background render queue processing on Vercel relies on `BackgroundPoller.tsx` keeping a browser tab open, or running a local daemon process. | `src/components/BackgroundPoller.tsx`<br>`src/app/api/cron/workers/route.ts`<br>`vercel.json:5` | Introduce durable workflow queues (e.g., Inngest, Upstash QStash, or a detached Node background worker) for automated 24/7 autonomous processing. |
| 🟡 **P1 (High)** | **Google Drive `downloadFile` Stub** | `GoogleDriveProvider.downloadFile` returns an empty buffer (`Buffer.from('')`), preventing asset sync down from Google Drive into studio storage. | `src/lib/providers/storage/gdrive.ts:79` | Implement full binary stream download using `this.drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })`. |
| 🟡 **P1 (High)** | **Duplicate State Machine Implementations** | Legacy state machine in `src/lib/statemachine/` exists alongside modern version in `src/lib/state/machines/`. | `src/lib/statemachine/EpisodeStateMachine.ts`<br>`src/lib/state/machines/EpisodeStateMachine.ts` | Deprecate and delete the legacy `src/lib/statemachine/` folder; consolidate all state logic in `src/lib/state/machines/`. |
| 🟢 **P2 (Medium)** | **Root Directory Scratch Scripts Cleanup** | Over 20 scratch and debug scripts (`scratch_*.ts`, `test_*.ts`) clutter the repository root. | Root directory (`yt-automation/*.js`, `yt-automation/*.ts`) | Organize all test and maintenance scripts into `scripts/` or `tests/`. |
| 🟢 **P2 (Medium)** | **Formal Automated Test Suite** | No test runner (Vitest or Jest) is configured in `package.json` scripts. | `package.json` | Install `vitest`, `@testing-library/react`, and configure CI unit tests for state machines, prompt validators, and API serializers. |

---

## 2. Detailed Remediation Actions

### 1. Dynamic Supabase Storage URL Helper
Create a standardized utility `src/lib/utils/storage.ts`:
```typescript
import { config } from '../config/config';

export function getStoragePublicUrl(storagePath: string, bucket: string = config.STUDIO_ASSETS_BUCKET): string {
  if (!storagePath) return '';
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) return storagePath;
  
  const baseUrl = config.SUPABASE_URL.replace(/\/$/, '');
  return `${baseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}
```

### 2. Google Drive Stream Download Implementation
In `src/lib/providers/storage/gdrive.ts`:
```typescript
async downloadFile(fileId: string): Promise<Buffer> {
  try {
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error: any) {
    logger.error(`Failed to download file ${fileId} from Drive`, { provider: 'google_drive' }, error);
    throw new AppError('google_drive', 'FILE_DOWNLOAD_FAILED', error.message);
  }
}
```

### 3. Model Configuration Standardization
In `src/lib/config/config.ts`:
```typescript
GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
```
In `src/lib/providers/script/gemini.ts`:
```typescript
const model = config.GEMINI_MODEL || 'gemini-2.0-flash';
```

---

## 3. Stabilization Roadmap (Phase 1 Checklist)

- [ ] **Step 1:** Fix all hardcoded Supabase project URLs across workers and pages.
- [ ] **Step 2:** Standardize Gemini model configuration to `gemini-2.0-flash`.
- [ ] **Step 3:** Implement complete `downloadFile` method in `GoogleDriveProvider`.
- [ ] **Step 4:** Remove legacy `src/lib/statemachine/` in favor of `src/lib/state/machines/`.
- [ ] **Step 5:** Add Vitest test suite for `SceneStateMachine`, `JobStateMachine`, and `ScriptSchema`.
- [ ] **Step 6:** Establish unified worker execution (local daemon script + Vercel cron alignment).
