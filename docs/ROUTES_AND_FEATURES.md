# ROUTES & FEATURES AUDIT: AI STUDIO & WORKFORCE
**Project Codename:** Gideon AI HQ / The Basement  
**Subsystem:** Content Production Department (AI Studio)  
**Date:** September 2026  
**Reference ID:** `ROUTES-FEAT-003`

---

## 1. Frontend Pages Inventory (19 Pages)

Below is an exhaustive audit of all user-facing routes, their functional status, data sources, and interactive features.

| Route | Page Component Path | Status | Key Features & Data Flow |
|---|---|---|---|
| `/` | `src/app/page.tsx` | 🟢 **Fully Functional** | **Command Center**: Global telemetry metrics (projects, episodes, scenes, queued, rendering, completed, failed, active workers, connected providers, today's spend). Polls `/api/dashboard` every 5s. Displays recent structured event stream. |
| `/projects` | `src/app/(dashboard)/projects/page.tsx` | 🟢 **Fully Functional** | **Projects Portfolio**: Lists all studio projects, displays progress bars, scene counts, creation dates. Supports creating new projects via `/api/projects`. |
| `/generator` | `src/app/(dashboard)/generator/page.tsx` | 🟢 **Fully Functional** | **Episodes Kanban Board**: Stages episodes across Kanban columns (`Draft`, `Writing`, `Approved`, `Generating Assets`, `Rendering`, `Review`, `Published`). Filterable by project. Modal creates new episodes. |
| `/scenes` | `src/app/(dashboard)/scenes/page.tsx` | 🟢 **Fully Functional** | **Scenes Workspace**: Hierarchical tree (Project $\rightarrow$ Episode $\rightarrow$ Scenes). Displays scene prompts, linked assets (visuals, characters, voiceover), duration dropdown (8–15s), render trigger with confirmation modal, retry buttons, and synchronized audio/video preview player modal. |
| `/assets` | `src/app/(dashboard)/assets/page.tsx` | 🟢 **Fully Functional** | **Digital Asset Library**: Category filters (`All`, `Images`, `Audio`, `Videos`), sub-category filters (`Scene Visuals`, `Character References`, `Voiceovers`, `Renders`). Supports asset deletion, public URL downloads, version display, and preview modals. |
| `/operations/queue` | `src/app/(dashboard)/operations/queue/page.tsx` | 🟢 **Fully Functional** | **Render Queue Operations**: Visual pipeline progression bar (`Queued`, `Rendering`, `Completed`, `Failed`). Real-time table of recent jobs fetched from `/api/jobs` every 5s. |
| `/operations/workers` | `src/app/(dashboard)/operations/workers/page.tsx` | 🟢 **Fully Functional** | **Background Daemon Status**: Displays live daemon heartbeat, completed count, failure count, last API call timestamp, active scene processing, and animated progress bar. |
| `/operations/jobs` | `src/app/(dashboard)/operations/jobs/page.tsx` | 🟢 **Fully Functional** | **Jobs & Operations History**: Comprehensive table of all operations with expandable drawer showing job configuration metadata, output asset preview, distributed event timeline, and system logs. |
| `/operations/providers` | `src/app/(dashboard)/operations/providers/page.tsx` | 🟢 **Fully Functional** | **Provider Matrix**: Displays cards for all configured rendering engines (PixVerse, Mock, Veo 3, Runway, Kling). Allows toggling provider on/off, priority ordering, telemetry stats, and capability tags (T2V, I2V, Upscale). |
| `/operations/providers/[id]` | `src/app/(dashboard)/operations/providers/[id]/page.tsx` | 🟢 **Fully Functional** | **Provider Detail & Config**: Deep inspection of specific provider settings, model defaults, credentials, latency history, and error logs. |
| `/developer/database` | `src/app/(dashboard)/developer/database/page.tsx` | 🟢 **Fully Functional** | **Database Explorer**: Interactive viewer for whitelisted Supabase tables (`projects`, `episodes`, `scenes`, `assets`, `scene_assets`, `jobs`, `events`, `system_logs`, `providers`). Includes pagination and JSON inspector. |
| `/developer/events` | `src/app/(dashboard)/developer/events/page.tsx` | 🟢 **Fully Functional** | **Distributed Event Ledger**: Real-time event browser displaying structured payloads, severity levels (`INFO`, `WARNING`, `ERROR`, `CRITICAL`), actors, sources, and operation IDs. |
| `/developer/logs` | `src/app/(dashboard)/developer/logs/page.tsx` | 🟢 **Fully Functional** | **System Logs Stream**: Terminal-style system log console with search, level filters, operation ID correlation, and auto-refresh. |
| `/settings/billing` | `src/app/(dashboard)/settings/billing/page.tsx` | 🟡 **Partial / Mock UI** | **Billing & Spend**: Displays today's spend, monthly spend, budget progress bar, and provider breakdown. Secondary efficiency metrics (Videos Gen, Cost/Min, Avg Render Time) currently display placeholder `--`. |
| `/settings/health` | `src/app/(dashboard)/settings/health/page.tsx` | 🟡 **Partial / Mock UI** | **Studio Health**: Displays connectivity status for Supabase, Google Drive, Gemini, and video providers. Detailed telemetry figures (Average Latency, Peak Latency, Tokens) currently display placeholder `--`. |
| `/settings/platform` | `src/app/(dashboard)/settings/platform/page.tsx` | 🟡 **Partial / Config** | **Platform Settings**: General (Sandbox Mode switch), Storage (Drive Root ID display), and Experimental sections active; remaining sidebar tabs show "in development". |
| `/notifications` | `src/app/(dashboard)/notifications/page.tsx` | 🟢 **Fully Functional** | **Notifications Hub**: System alerts, error notices, render completions. Allows marking all as read, dismissing alerts, and navigating to failed operations. |
| `/episode/[id]` | `src/app/episode/[id]/page.tsx` | 🟢 **Fully Functional** | **Episode Scene Editor**: Targeted workspace for a single episode's scenes and metadata. |
| `/generate-script` | `src/app/generate-script/page.tsx` | 🟢 **Functional (Legacy)**| **Standalone Script Generator**: Form to input topic, select project, and trigger full Gemini script generation. |

---

## 2. API Route Handlers Inventory (29 Endpoints)

| API Route | HTTP Method | Handler Path | Purpose & Execution Flow |
|---|---|---|---|
| `/api/dashboard` | `GET` | `src/app/api/dashboard/route.ts` | Aggregates all studio metrics (counts, workers, providers, spend, latest events) in a single high-performance payload. |
| `/api/projects` | `GET`, `POST` | `src/app/api/projects/route.ts` | Lists all projects or creates a new project row. |
| `/api/projects/[id]` | `GET`, `PATCH`, `DELETE` | `src/app/api/projects/[id]/route.ts` | Retrieves, updates, or deletes a specific project and cascade-removes child records. |
| `/api/episodes` | `GET`, `POST` | `src/app/api/episodes/route.ts` | Lists episodes (supports `?projectId=...`) or drafts a new episode. |
| `/api/episodes/[id]` | `GET`, `PATCH`, `DELETE` | `src/app/api/episodes/[id]/route.ts` | Retrieves, updates metadata, or deletes a specific episode. |
| `/api/episodes/[id]/scenes` | `GET` | `src/app/api/episodes/[id]/scenes/route.ts` | Returns all scenes for an episode ordered by `scene_number` with joined `scene_assets`. |
| `/api/episodes/[id]/reset` | `POST` | `src/app/api/episodes/[id]/reset/route.ts` | Resets an episode and its scenes back to `Draft` status for clean re-generation. |
| `/api/scenes` | `GET`, `POST` | `src/app/api/scenes/route.ts` | Lists all scenes across projects or creates a single scene. |
| `/api/scenes/[id]` | `GET`, `PATCH`, `DELETE` | `src/app/api/scenes/[id]/route.ts` | Fetches, updates (prompts, duration, status), or deletes a specific scene. |
| `/api/scenes/[id]/queue` | `POST` | `src/app/api/scenes/[id]/queue/route.ts` | Validates scene readiness and sets status to `Queued` for worker pickup. |
| `/api/scenes/[id]/estimate` | `GET` | `src/app/api/scenes/[id]/estimate/route.ts` | Calculates estimated render cost and time based on provider capabilities and scene duration. |
| `/api/scenes/[id]/voiceover` | `POST` | `src/app/api/scenes/[id]/voiceover/route.ts` | Calls ElevenLabs API with scene voiceover text, uploads MP3 to Supabase Storage, creates asset record, and links to scene. |
| `/api/scenes/generate` | `POST` | `src/app/api/scenes/generate/route.ts` | Direct trigger to immediately submit a scene to `RenderManager` without waiting for cron. |
| `/api/script` | `POST` | `src/app/api/script/route.ts` | Triggers `GenerateScriptService` to generate full 15-scene script via Gemini, scaffold Drive folders, and insert scenes. |
| `/api/assets` | `GET` | `src/app/api/assets/route.ts` | Fetches digital assets with optional filtering (`type`, `role`, `mimeTypePrefix`, `projectId`, `episodeId`). |
| `/api/assets/[id]` | `GET`, `DELETE` | `src/app/api/assets/[id]/route.ts` | Fetches asset metadata or deletes asset from Supabase Storage and database. |
| `/api/assets/upload` | `POST` | `src/app/api/assets/upload/route.ts` | Receives multipart form data file upload, stores in Supabase Storage (`studio-assets`), computes version number, and links to scene. |
| `/api/assets/link` | `POST` | `src/app/api/assets/link/route.ts` | Links an existing asset from the library to a scene with a specific role (`scene_image`, `character_reference`, etc.). |
| `/api/assets/unlink` | `POST` | `src/app/api/assets/unlink/route.ts` | Unlinks an asset from a scene (removes row from `scene_assets`). |
| `/api/jobs` | `GET` | `src/app/api/jobs/route.ts` | Fetches all background jobs with joined scenes and metadata. |
| `/api/providers` | `GET` | `src/app/api/providers/route.ts` | Returns all configured providers from the database with active status. |
| `/api/providers/[id]` | `GET`, `PATCH` | `src/app/api/providers/[id]/route.ts` | Fetches provider configuration or toggles active state / priority. |
| `/api/events` | `GET` | `src/app/api/events/route.ts` | Queries the `events` table with optional `operationId` filtering. |
| `/api/logs` | `GET` | `src/app/api/logs/route.ts` | Queries the `system_logs` table with optional `operationId` filtering. |
| `/api/settings` | `GET` | `src/app/api/settings/route.ts` | Returns aggregated platform health, billing metrics, and notifications. |
| `/api/cron/workers` | `GET` | `src/app/api/cron/workers/route.ts` | Executes one asynchronous pass of the Dispatcher, Polling, and Download workers. |
| `/api/developer/database` | `GET` | `src/app/api/developer/database/route.ts` | Whitelisted table data inspector for the Database Explorer page. |
| `/api/operator/chat` | `POST` | `src/app/api/operator/chat/route.ts` | Conversational interface for the AI Operator; builds context, generates tool proposals, and signs execution plans. |
| `/api/operator/execute`| `POST` | `src/app/api/operator/execute/route.ts`| Verifies HMAC plan token signature and executes operator tool with policy checks and idempotency locks. |

---

## 3. UI/UX Interaction Flows

```
CREATIVE FLOW:
1. User clicks "New Episode" (/generator or Command Center)
2. Enter Title & Topic -> POST /api/script
3. Gemini generates 15 scenes with Image/Motion prompts
4. Google Drive scaffolds: Episode folder -> Scenes -> Scene_01..15 -> assets/, renders/
5. Scenes appear in Scenes Workspace (/scenes)

PRODUCTION & RENDER FLOW:
1. User reviews Scene 1 -> Copies Midjourney prompt (--ar 16:9)
2. User generates image in Midjourney -> Drag-and-drops into Scene 1 (AssetUploadModal)
3. Image uploaded to Supabase Storage -> Linked as 'scene_image' in scene_assets
4. (Optional) User selects Voice -> Clicks "Generate Voice" -> ElevenLabs creates MP3
5. Scene readiness check passes (Image Prompt + Visual Asset confirmed)
6. User clicks "Render Scene" -> GenerationConfirmModal -> Scene set to 'Queued'
7. Worker picks up scene -> PixVerse animates image -> Poller waits -> Downloader fetches MP4
8. Video saved to Supabase Storage -> Linked as 'render_output'
9. Completed video available for Preview, Download, or Multi-scene export!
```
