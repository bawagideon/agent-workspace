# COMPLETE CODEBASE AUDIT: AI STUDIO (`yt-automation`)
**Audit Date:** September 2026  
**Auditor:** Antigravity Lead Software Architect  
**Target Repository:** `C:\Users\DELL\yt-automation`  
**Working Workspace:** `C:\Users\DELL\agent-workspace`  
**Status:** Audit Complete & Verified with Direct File Evidence

---

## 1. Executive Summary

The `yt-automation` repository is a specialized, production-oriented **AI-Powered YouTube Video Generation Platform (AI Studio)**. It integrates automated script generation, image/prompt generation, digital asset management (DAM), generative video rendering, voice synthesis, automated background queue workers, and an early-stage AI Operator runtime.

The application is built on Next.js 15 (App Router with React 19) and Supabase (PostgreSQL + Storage), with video generation backed by PixVerse and voice synthesis by ElevenLabs.

| Metric / Dimension | Status / Finding |
|---|---|
| **Framework & Engine** | Next.js `15.5.22` (Turbopack, App Router), React `19.1.0` |
| **Language & Styling** | TypeScript 5, Tailwind CSS v4, Lucide Icons, Base UI |
| **Database & ORM** | PostgreSQL on Supabase (`@supabase/supabase-js` 2.110.8, raw SQL migrations) |
| **Storage Architecture** | Supabase Storage (`studio-assets` bucket) + Google Drive v3 (OAuth2) |
| **AI LLM Engine** | Gemini via `@google/genai` (v2.13.0) & Vercel AI SDK (`ai` v7.0.42) |
| **Video Render Engine** | PixVerse OpenAPI v2 (v6 model), Vertex Veo 3 / Runway / Kling stubs |
| **Audio & TTS Engine** | ElevenLabs API (Kehinde voice, Turbo v2.5 model) |
| **Queue & Workers** | 3-tier worker pipeline (Dispatcher, Poller, Downloader) via `/api/cron/workers` |
| **Agent / Operator Engine**| `OperatorRuntime` with `ToolRegistry`, execution plan token signing & idempotency |

---

## 2. Dependency & Stack Analysis

From `package.json` (`yt-automation/package.json`):

```json
{
  "dependencies": {
    "@base-ui/react": "^1.6.0",
    "@google/genai": "^2.13.0",
    "@supabase/supabase-js": "^2.110.8",
    "@tailwindcss/typography": "^0.5.20",
    "ai": "^7.0.42",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "googleapis": "^173.0.0",
    "lucide-react": "^1.27.0",
    "next": "15.5.22",
    "pg": "^8.23.0",
    "postgres": "^3.4.9",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",
    "tailwind-merge": "^3.6.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^4.4.3"
  }
}
```

### Key Observations:
1. **Modern Next.js 15 & React 19**: Uses the latest App Router structure with server actions and route handlers (`src/app/api/...`).
2. **Dual GenAI & AI SDK**: Incorporates the official `@google/genai` v2 SDK alongside `ai` (Vercel AI SDK 7).
3. **Database Drivers**: Both `@supabase/supabase-js` and direct `postgres`/`pg` packages are installed. Most runtime operations utilize the Supabase JavaScript client, while migration scripts utilize `postgres`/`pg`.
4. **Zod 4**: Schema validation for Gemini script output and PixVerse payloads.

---

## 3. Directory Structure Breakdown

```
C:\Users\DELL\yt-automation
├── .env.local                    # Environment configuration (Supabase, Google, PixVerse, ElevenLabs, Gemini)
├── package.json                  # Dependencies and build scripts
├── next.config.ts                # Next.js configuration
├── vercel.json                   # Vercel deployment & daily cron trigger
├── EVENTS.md                     # System event vocabulary definitions
├── supabase/
│   └── migrations/               # 10 SQL migration files establishing the schema
│       ├── 20240101000000_init.sql
│       ├── 20240320000000_add_providers.sql
│       ├── 20240401000000_assets_and_metadata.sql
│       ├── 20240410000000_studio_platform_foundation.sql
│       ├── 20240501000000_state_machines.sql
│       ├── 20240510000000_phase_2g_enterprise.sql
│       ├── 20240601000000_asset_library_refactor.sql
│       ├── 20240602000000_update_assets_schema.sql
│       ├── 20240603000000_add_job_metadata.sql
│       └── 20240604000000_system_logs_and_operations.sql
├── scripts/
│   ├── bundle-migrations.mjs     # Migration packager
│   ├── check-scenes.mjs          # Scene status check CLI
│   ├── e2e-test.mjs              # End-to-end rendering test runner
│   ├── patch-db.mjs              # Database patching utility
│   ├── run-migration.mjs         # Migration executor
│   ├── setup-storage.mjs         # Supabase bucket initializer
│   └── worker-daemon.mjs         # Local background worker loop (hits /api/cron/workers every 5s)
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Dashboard grouped routes
│   │   │   ├── assets/           # Digital Asset Management view
│   │   │   ├── developer/        # Database explorer, events ledger, system logs
│   │   │   ├── generator/        # Episode creation Kanban board
│   │   │   ├── notifications/    # Notification alerts hub
│   │   │   ├── operations/       # Render queue, workers, jobs, providers
│   │   │   ├── projects/         # Project portfolio management
│   │   │   ├── scenes/           # Core scene workspace, asset linking & rendering
│   │   │   └── settings/         # Billing, health, platform configuration
│   │   ├── api/                  # 29 REST API Route Handlers
│   │   ├── episode/[id]/         # Dedicated episode scenes view
│   │   ├── generate-script/      # Legacy script generation view
│   │   ├── layout.tsx            # Global layout with Sidebar & BackgroundPoller
│   │   └── page.tsx              # Command Center (Global overview dashboard)
│   ├── components/
│   │   ├── AssetLinkModal.tsx    # Modal to link library assets to scenes
│   │   ├── AssetUploadModal.tsx  # Drag & drop upload modal for scene assets
│   │   ├── BackgroundPoller.tsx  # Client-side 10s poller for /api/cron/workers
│   │   ├── GenerationConfirmModal.tsx # Pre-render confirmation modal
│   │   ├── SceneAudioConfig.tsx  # Audio mode selector (narration vs lip-sync)
│   │   ├── SceneEditModal.tsx    # Prompt and scene metadata editor
│   │   ├── ScenePreview.tsx      # Video and audio preview component
│   │   ├── Sidebar.tsx           # Collapsible navigation drawer
│   │   └── ui/                   # Base buttons and Markdown renderers
│   └── lib/
│       ├── config/config.ts      # Global environment configuration loader
│       ├── constants/voices.ts   # ElevenLabs voice constants
│       ├── data/                 # Data source repositories (Assets, Episodes, Events, Jobs, Projects, Providers, Scenes)
│       ├── errors.ts             # AppError custom error hierarchy
│       ├── events/EventBus.ts    # Centralized event publishing
│       ├── logger.ts             # Structured logger with context metadata
│       ├── operator/             # AI Studio Operator runtime & tool declarations
│       ├── providers/            # Gemini, PixVerse, ElevenLabs, Google Drive, Veo
│       ├── services/             # Domain business logic services
│       ├── state/machines/       # Deterministic state machine definitions
│       ├── storage/              # Unified StorageManager (Supabase + Google Drive)
│       ├── supabase-client.ts    # Browser Supabase client
│       ├── supabase-server.ts    # Server Supabase client
│       └── workers/index.ts      # 3-phase worker execution logic
```

---

## 4. Database Schema & Migration Mapping

The database schema is defined across 10 progressive migrations in `supabase/migrations/`:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    projects     │◄──────│    episodes     │◄──────│     scenes      │
│  (id, name, ..) │  1:N  │  (id, title, ..)│  1:N  │ (id, prompts,..)│
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         │                         │                         │ 1:N
         │                         │                         ▼
         │                         │                ┌─────────────────┐
         │                         │                │  scene_assets   │
         │                         │                │  (join table)   │
         │                         │                └────────┬────────┘
         │                         │                         │ N:1
         ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                               assets                                │
│        (id, storage_provider, storage_path, type, version, ..)      │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      jobs       │       │     events      │       │   system_logs   │
│ (id, provider,  │       │(operation_id,   │       │(operation_id,   │
│  status, ..)    │       │ event_type, ..) │       │ level, msg, ..) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Table Breakdown:
1. **`projects`**: Top-level containers (id, name, description, status `project_status`, blocked_reason).
2. **`episodes`**: Content releases within a project (id, project_id, title, topic, status `episode_status`, total_scenes, completed_scenes, drive_folder_id).
3. **`scenes`**: Individual 8–15 second visual blocks (id, episode_id, scene_number, title, voiceover, image_prompt, motion_prompt, negative_prompt, duration, required_assets, status `scene_status`, video_url, error_message).
4. **`assets`**: Digital Asset Management records (id, project_id, episode_id, scene_id, storage_provider, storage_path, type, mime_type, size_bytes, version, status).
5. **`scene_assets`**: Join table binding assets to scenes with specific roles (`scene_image`, `character_reference`, `voiceover`, `render_output`).
6. **`jobs`**: Background worker render/task queue (id, scene_id, provider, status `job_status`, attempts, max_attempts, operation_id, job_type, metadata, source_asset_id).
7. **`providers`**: Dynamic rendering engine registry (id, name, enabled, priority, health, model_default, supports_image, supports_text, supports_upscale).
8. **`events`**: Distributed tracing and system event log (id, operation_id, event_type, category, severity, actor, source, payload, job_id, scene_id).
9. **`system_logs`**: Application log stream (id, timestamp, level, message, source, operation_id, job_id, scene_id, metadata).
10. **`incidents` & `operator_memory`**: Operator incident recovery ledger and persistent knowledge base.

---

## 5. Summary of Key Subsystems

### A. Script Generation Pipeline
- Entry point: `src/lib/services/GenerateScriptService.ts`
- Invokes `GeminiScriptProvider` with strict JSON schema instructions (`prompts.ts`)
- Automatically validates return payload with Zod (`ScriptSchema`)
- Scaffolds Google Drive folders (Episode folder $\rightarrow$ `Scenes/` $\rightarrow$ `Scene_XX/` $\rightarrow$ `assets/`, `renders/`)
- Persists scenes to Supabase database in `Draft` status

### B. Video Rendering Pipeline (PixVerse)
- Configured in `src/lib/providers/render/pixverse.ts`
- Supports Text-to-Video and Image-to-Video
- For image-guided animation:
  1. Downloads image asset from Supabase public storage URL
  2. Uploads image to PixVerse `/openapi/v2/image/upload` to acquire `img_id`
  3. Dispatches generation to `/openapi/v2/video/img/generate` (model `v6`, duration 8-15s)
  4. Returns `taskId` (`video_id`)
- Supports Phase 2 Audio Lip-Sync:
  1. Downloads voiceover MP3 asset
  2. Uploads audio to `/openapi/v2/media/upload`
  3. Submits lip-sync job to `/openapi/v2/video/lip_sync/generate`

### C. Background Worker Queue
- Defined in `src/lib/workers/index.ts`
- **1. Dispatcher**: Picks `Queued` scenes $\rightarrow$ locks to `Rendering` $\rightarrow$ submits to `RenderManager` $\rightarrow$ creates `jobs` row in `Running` status
- **2. Poller**: Scans `Running` jobs $\rightarrow$ queries provider API for completion $\rightarrow$ if completed, sets scene to `Downloading`
- **3. Downloader**: Claims `Downloading` scene $\rightarrow$ fetches MP4 binary from provider CDN $\rightarrow$ uploads to Supabase Storage (`studio-assets`) $\rightarrow$ inserts `assets` row and links `render_output` in `scene_assets` $\rightarrow$ triggers Phase 2 lip-sync if requested $\rightarrow$ marks scene `Completed`

---

## 6. Audit Verdict

The existing codebase is **well-structured, highly modular, and functional**. The domain services, state machines, and API handlers provide a solid foundation. 

Rather than rewriting or throwing this codebase away, it should be adopted as the **Content Production Department (AI Studio)** of the larger **Personal AI Workforce OS**.
