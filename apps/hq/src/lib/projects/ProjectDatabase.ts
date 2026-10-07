import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabase } from '../supabase';
import { 
  ProjectRecord, 
  ProjectEvent, 
  ProjectTestRun, 
  ProjectMissionLink,
  ProjectRunnerLease,
  ProjectStatus,
  PortalAccessRecord,
  PortalSessionRecord,
  PortalFeedbackIdempotencyRecord
} from '@gideon/shared';

const LOCAL_STORE_DIR = path.resolve(process.cwd(), process.cwd().includes('apps') ? '../../.gideon' : '.gideon');
const CACHE_FILE = path.join(LOCAL_STORE_DIR, 'projects_cache.json');
const OUTBOX_FILE = path.join(LOCAL_STORE_DIR, 'sync_outbox.json');
const EVENTS_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'events_cache.json');
const TEST_RUNS_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'test_runs_cache.json');
const MISSIONS_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'project_missions_cache.json');
const LEASES_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'leases_cache.json');
const LEDGER_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'ledger_cache.json');
const RESERVATIONS_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'reservations_cache.json');
const PROCESSED_EVENTS_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'processed_provider_events_cache.json');
const PORTAL_ACCESS_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'portal_access_cache.json');
const PORTAL_SESSIONS_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'portal_sessions_cache.json');
const PORTAL_IDEMPOTENCY_CACHE_FILE = path.join(LOCAL_STORE_DIR, 'portal_idempotency_cache.json');
const ARTIFACTS_TESTS_DIR = path.join(LOCAL_STORE_DIR, 'artifacts', 'tests');

export interface ProjectLedgerRecord {
  id: string;
  projectId: string;
  transactionType: string;
  currency: string;
  amountCents: number;
  tokenCount?: number;
  unitCostCents?: number;
  agentId?: string;
  taskId?: string;
  taskRunId?: string;
  missionId?: string;
  status: 'COMMITTED' | 'PENDING' | 'VOIDED';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SpendReservationRecord {
  id: string;
  projectId: string;
  amountCents: number;
  status: 'ACTIVE' | 'SETTLED' | 'RELEASED' | 'EXPIRED';
  taskId?: string;
  agentId?: string;
  reason: string;
  createdAt: string;
  expiresAt: string;
  settledAt?: string;
  settledAmountCents?: number;
}

export interface ProcessedProviderEventRecord {
  providerEventId: string;
  provider: string;
  eventType: string;
  projectId?: string;
  payload?: any;
  processedAt: string;
}

export interface OutboxItem {
  eventId: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  sequence: number;
  status: 'PENDING' | 'RECONCILED' | 'FAILED';
  createdAt: string;
  attemptCount: number;
}

export class ProjectDatabase {
  private static instance: ProjectDatabase;
  private inFlightProviderEvents = new Set<string>();

  private constructor() {
    this.ensureDirs();
  }

  public static getInstance(): ProjectDatabase {
    if (!ProjectDatabase.instance) {
      ProjectDatabase.instance = new ProjectDatabase();
    }
    return ProjectDatabase.instance;
  }

  private ensureDirs(): void {
    if (!fs.existsSync(LOCAL_STORE_DIR)) {
      fs.mkdirSync(LOCAL_STORE_DIR, { recursive: true });
    }
    if (!fs.existsSync(ARTIFACTS_TESTS_DIR)) {
      fs.mkdirSync(ARTIFACTS_TESTS_DIR, { recursive: true });
    }
  }

  // --- Local Cache Helpers ---
  private readCache(): Map<string, ProjectRecord> {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
        const data = JSON.parse(raw);
        return new Map(Object.entries(data));
      }
    } catch (err) {
      console.warn('[ProjectDB] Cache read error:', err);
    }
    return new Map();
  }

  private writeCache(cache: Map<string, ProjectRecord>): void {
    try {
      this.ensureDirs();
      const obj = Object.fromEntries(cache);
      fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ProjectDB] Cache write error:', err);
    }
  }

  private readEventsCache(): ProjectEvent[] {
    try {
      if (fs.existsSync(EVENTS_CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(EVENTS_CACHE_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[ProjectDB] Events cache read error:', err);
    }
    return [];
  }

  private writeEventsCache(events: ProjectEvent[]): void {
    try {
      this.ensureDirs();
      fs.writeFileSync(EVENTS_CACHE_FILE, JSON.stringify(events, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ProjectDB] Events cache write error:', err);
    }
  }

  private readTestRunsCache(): ProjectTestRun[] {
    try {
      if (fs.existsSync(TEST_RUNS_CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(TEST_RUNS_CACHE_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[ProjectDB] Test runs cache read error:', err);
    }
    return [];
  }

  private writeTestRunsCache(testRuns: ProjectTestRun[]): void {
    try {
      this.ensureDirs();
      fs.writeFileSync(TEST_RUNS_CACHE_FILE, JSON.stringify(testRuns, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ProjectDB] Test runs cache write error:', err);
    }
  }

  private readMissionsCache(): ProjectMissionLink[] {
    try {
      if (fs.existsSync(MISSIONS_CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(MISSIONS_CACHE_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[ProjectDB] Missions cache read error:', err);
    }
    return [];
  }

  private writeMissionsCache(links: ProjectMissionLink[]): void {
    try {
      this.ensureDirs();
      fs.writeFileSync(MISSIONS_CACHE_FILE, JSON.stringify(links, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ProjectDB] Missions cache write error:', err);
    }
  }

  private readLeasesCache(): ProjectRunnerLease[] {
    try {
      if (fs.existsSync(LEASES_CACHE_FILE)) {
        const raw = fs.readFileSync(LEASES_CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.leases) ? parsed.leases : (Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.warn('[ProjectDB] Leases cache read error:', err);
    }
    return [];
  }

  private writeLeasesCache(leases: ProjectRunnerLease[]): void {
    try {
      this.ensureDirs();
      // Invariant 4: Local cache is explicitly non-authoritative
      const cacheEnvelope = {
        isAuthoritative: false,
        source: 'supabase',
        cachedAt: new Date().toISOString(),
        leases
      };
      fs.writeFileSync(LEASES_CACHE_FILE, JSON.stringify(cacheEnvelope, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ProjectDB] Leases cache write error:', err);
    }
  }

  private readLedgerCache(): ProjectLedgerRecord[] {
    try {
      if (fs.existsSync(LEDGER_CACHE_FILE)) {
        const raw = fs.readFileSync(LEDGER_CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.records) ? parsed.records : (Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.warn('[ProjectDB] Ledger cache read error:', err);
    }
    return [];
  }

  private writeLedgerCache(records: ProjectLedgerRecord[]): void {
    try {
      this.ensureDirs();
      const cacheEnvelope = {
        isAuthoritative: false,
        source: 'supabase',
        cachedAt: new Date().toISOString(),
        records
      };
      fs.writeFileSync(LEDGER_CACHE_FILE, JSON.stringify(cacheEnvelope, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ProjectDB] Ledger cache write error:', err);
    }
  }

  private readReservationsCache(): SpendReservationRecord[] {
    try {
      if (fs.existsSync(RESERVATIONS_CACHE_FILE)) {
        const raw = fs.readFileSync(RESERVATIONS_CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.reservations) ? parsed.reservations : (Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.warn('[ProjectDB] Reservations cache read error:', err);
    }
    return [];
  }

  private writeReservationsCache(reservations: SpendReservationRecord[]): void {
    try {
      this.ensureDirs();
      const cacheEnvelope = {
        isAuthoritative: false,
        source: 'supabase',
        cachedAt: new Date().toISOString(),
        reservations
      };
      fs.writeFileSync(RESERVATIONS_CACHE_FILE, JSON.stringify(cacheEnvelope, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ProjectDB] Reservations cache write error:', err);
    }
  }

  private readProcessedEventsCache(): ProcessedProviderEventRecord[] {
    try {
      if (fs.existsSync(PROCESSED_EVENTS_CACHE_FILE)) {
        const raw = fs.readFileSync(PROCESSED_EVENTS_CACHE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.events) ? parsed.events : (Array.isArray(parsed) ? parsed : []);
      }
    } catch (err) {
      console.warn('[ProjectDB] Processed events cache read error:', err);
    }
    return [];
  }

  private writeProcessedEventsCache(events: ProcessedProviderEventRecord[]): void {
    try {
      this.ensureDirs();
      const cacheEnvelope = {
        isAuthoritative: false,
        source: 'supabase',
        cachedAt: new Date().toISOString(),
        events
      };
      fs.writeFileSync(PROCESSED_EVENTS_CACHE_FILE, JSON.stringify(cacheEnvelope, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ProjectDB] Processed events cache write error:', err);
    }
  }

  // --- Outbox Queue Helpers ---
  private readOutbox(): OutboxItem[] {
    try {
      if (fs.existsSync(OUTBOX_FILE)) {
        return JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[ProjectDB] Outbox read error:', err);
    }
    return [];
  }

  private appendOutbox(item: Omit<OutboxItem, 'eventId' | 'createdAt' | 'attemptCount' | 'status'>): OutboxItem {
    this.ensureDirs();
    const outbox = this.readOutbox();
    const fullItem: OutboxItem = {
      ...item,
      eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      status: 'PENDING',
      attemptCount: 0,
      createdAt: new Date().toISOString()
    };
    outbox.push(fullItem);
    fs.writeFileSync(OUTBOX_FILE, JSON.stringify(outbox, null, 2), 'utf8');
    return fullItem;
  }

  public async flushOutbox(): Promise<number> {
    const outbox = this.readOutbox();
    const pending = outbox.filter(item => item.status === 'PENDING');
    if (pending.length === 0) return 0;

    let reconciled = 0;
    for (const item of pending) {
      try {
        if (item.eventType === 'PROJECT_UPSERT') {
          const { error } = await supabase.from('hq_projects').upsert(item.payload);
          if (!error) {
            item.status = 'RECONCILED';
            reconciled++;
          } else {
            item.attemptCount++;
          }
        } else if (item.eventType === 'PROJECT_EVENT') {
          const { error } = await supabase.from('hq_project_events').insert(item.payload);
          if (!error) {
            item.status = 'RECONCILED';
            reconciled++;
          } else {
            item.attemptCount++;
          }
        }
      } catch {
        item.attemptCount++;
      }
    }

    fs.writeFileSync(OUTBOX_FILE, JSON.stringify(outbox, null, 2), 'utf8');
    return reconciled;
  }

  // --- Core CRUD with Optimistic Concurrency ---
  public async getProjects(): Promise<ProjectRecord[]> {
    const cache = this.readCache();

    try {
      const { data, error } = await supabase
        .from('hq_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          const record = this.mapFromDb(row);
          cache.set(record.id, record);
        }
        this.writeCache(cache);
        // Opportunistic outbox sync
        this.flushOutbox().catch(() => {});
      }
    } catch {
      // offline fallback to cache
    }

    return Array.from(cache.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async getProjectById(id: string): Promise<ProjectRecord | null> {
    const cache = this.readCache();
    let record = cache.get(id) || null;

    try {
      const { data, error } = await supabase
        .from('hq_projects')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .single();

      if (!error && data) {
        record = this.mapFromDb(data);
        cache.set(record.id, record);
        this.writeCache(cache);
      }
    } catch {
      // return cached
    }

    return record;
  }

  public async saveProject(project: ProjectRecord, expectedRevision?: number): Promise<ProjectRecord> {
    const cache = this.readCache();
    const existing = cache.get(project.id);

    // Optimistic Concurrency Control Check
    if (existing && expectedRevision !== undefined && existing.revision !== expectedRevision) {
      throw new Error(
        `Concurrency Conflict: Project revision mismatch. Expected ${expectedRevision}, but found ${existing.revision}. Refresh state and retry.`
      );
    }

    const updatedRecord: ProjectRecord = {
      ...project,
      revision: (existing ? existing.revision : 0) + 1,
      updatedAt: new Date().toISOString()
    };

    cache.set(updatedRecord.id, updatedRecord);
    this.writeCache(cache);

    const dbPayload = this.mapToDb(updatedRecord);

    try {
      const { error } = await supabase.from('hq_projects').upsert(dbPayload);
      if (error) {
        // Enqueue to durable outbox
        this.appendOutbox({
          aggregateId: updatedRecord.id,
          eventType: 'PROJECT_UPSERT',
          payload: dbPayload,
          sequence: updatedRecord.revision
        });
      }
    } catch {
      this.appendOutbox({
        aggregateId: updatedRecord.id,
        eventType: 'PROJECT_UPSERT',
        payload: dbPayload,
        sequence: updatedRecord.revision
      });
    }

    return updatedRecord;
  }

  // --- Events Stream (Immutable Audit Trail) ---
  public async saveEvent(params: {
    id?: string;
    eventId?: string;
    projectId: string;
    eventType: ProjectEvent['eventType'];
    actor: string;
    payload?: Record<string, any>;
    createdAt?: string;
  }): Promise<ProjectEvent & { isDuplicate: boolean }> {
    return this.logEvent(params);
  }

  public async logEvent(params: {
    eventId?: string;
    projectId: string;
    eventType: ProjectEvent['eventType'];
    actor: string;
    payload?: Record<string, any>;
  }): Promise<ProjectEvent & { isDuplicate: boolean }> {
    const cachedEvents = this.readEventsCache();

    // Test A Idempotency Invariant: same event_id cannot mutate state twice
    if (params.eventId) {
      const existing = cachedEvents.find(e => e.eventId === params.eventId);
      if (existing) {
        return { ...existing, isDuplicate: true };
      }
    }

    const eventId = params.eventId || `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const event: ProjectEvent = {
      id: crypto.randomUUID(),
      eventId,
      projectId: params.projectId,
      eventType: params.eventType,
      actor: params.actor,
      payload: params.payload || {},
      createdAt: new Date().toISOString()
    };

    // Always persist to local cache
    cachedEvents.unshift(event);
    this.writeEventsCache(cachedEvents.slice(0, 500));

    const dbPayload = {
      id: event.id,
      event_id: event.eventId,
      project_id: event.projectId,
      event_type: event.eventType,
      actor: event.actor,
      payload: event.payload,
      created_at: event.createdAt
    };

    try {
      const { error } = await supabase.from('hq_project_events').insert(dbPayload);
      if (error) {
        this.appendOutbox({
          aggregateId: event.projectId,
          eventType: 'PROJECT_EVENT',
          payload: dbPayload,
          sequence: Date.now()
        });
      }
    } catch {
      this.appendOutbox({
        aggregateId: event.projectId,
        eventType: 'PROJECT_EVENT',
        payload: dbPayload,
        sequence: Date.now()
      });
    }

    return { ...event, isDuplicate: false };
  }

  public async getEvents(projectId: string): Promise<ProjectEvent[]> {
    const local = this.readEventsCache().filter(e => e.projectId === projectId);
    try {
      const { data, error } = await supabase
        .from('hq_project_events')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const fromDb = data.map((d: any) => ({
          id: d.id,
          eventId: d.event_id,
          projectId: d.project_id,
          eventType: d.event_type,
          actor: d.actor,
          payload: d.payload || {},
          createdAt: d.created_at
        }));
        const map = new Map<string, ProjectEvent>();
        for (const e of [...fromDb, ...local]) {
          map.set(e.id, e);
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch {
      // offline fallback
    }
    return local;
  }

  // --- Test Run Evidence Storage ---
  public async saveTestRun(params: {
    projectId: string;
    suiteName: string;
    command: string;
    status: ProjectTestRun['status'];
    passedCount: number;
    failedCount: number;
    skippedCount: number;
    durationMs: number;
    exitCode: number;
    gitCommit?: string;
    rawLogContent?: string;
  }): Promise<ProjectTestRun> {
    const runId = `tr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    let artifactId: string | undefined;

    // Save raw log as separate artifact on disk (never pollute relational table with megabytes of logs)
    if (params.rawLogContent) {
      this.ensureDirs();
      artifactId = `art_log_${runId}`;
      const logFile = path.join(ARTIFACTS_TESTS_DIR, `${artifactId}.log`);
      fs.writeFileSync(logFile, params.rawLogContent, 'utf8');
    }

    const testRun: ProjectTestRun = {
      id: crypto.randomUUID(),
      projectId: params.projectId,
      suiteName: params.suiteName,
      command: params.command,
      status: params.status,
      passedCount: params.passedCount,
      failedCount: params.failedCount,
      skippedCount: params.skippedCount,
      durationMs: params.durationMs,
      exitCode: params.exitCode,
      gitCommit: params.gitCommit,
      artifactId,
      createdAt: new Date().toISOString()
    };

    // Always persist to local cache
    const cachedTestRuns = this.readTestRunsCache();
    cachedTestRuns.unshift(testRun);
    this.writeTestRunsCache(cachedTestRuns.slice(0, 200));

    try {
      await supabase.from('hq_project_test_runs').insert({
        id: testRun.id,
        project_id: testRun.projectId,
        suite_name: testRun.suiteName,
        command: testRun.command,
        status: testRun.status,
        passed_count: testRun.passedCount,
        failed_count: testRun.failedCount,
        skipped_count: testRun.skippedCount,
        duration_ms: testRun.durationMs,
        exit_code: testRun.exitCode,
        git_commit: testRun.gitCommit,
        artifact_id: testRun.artifactId,
        created_at: testRun.createdAt
      });
    } catch {
      // non-fatal
    }

    return testRun;
  }

  public async getTestRuns(projectId: string): Promise<ProjectTestRun[]> {
    const local = this.readTestRunsCache().filter(tr => tr.projectId === projectId);
    try {
      const { data, error } = await supabase
        .from('hq_project_test_runs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const fromDb = data.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          suiteName: d.suite_name,
          command: d.command,
          status: d.status,
          passedCount: d.passed_count,
          failedCount: d.failed_count,
          skippedCount: d.skipped_count,
          durationMs: d.duration_ms,
          exitCode: d.exit_code,
          gitCommit: d.git_commit,
          artifactId: d.artifact_id,
          createdAt: d.created_at
        }));
        const map = new Map<string, ProjectTestRun>();
        for (const tr of [...fromDb, ...local]) {
          map.set(tr.id, tr);
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch {
      // offline fallback
    }
    return local;
  }

  public readTestLogArtifact(artifactId: string): string | null {
    try {
      const safeId = path.basename(artifactId);
      const logFile = path.join(ARTIFACTS_TESTS_DIR, `${safeId}.log`);
      if (fs.existsSync(logFile)) {
        return fs.readFileSync(logFile, 'utf8');
      }
    } catch {
      // ignored
    }
    return null;
  }

  // --- Project Mission Linking & History Reconstruction ---
  public async linkMission(link: {
    id?: string;
    projectId: string;
    missionId: string;
    missionTitle: string;
    objective: string;
    status: ProjectMissionLink['status'];
    assignedRole: string;
    costCents?: number;
    tokensUsed?: number;
    evidenceId?: string;
  }): Promise<ProjectMissionLink> {
    const fullLink: ProjectMissionLink = {
      id: link.id || crypto.randomUUID(),
      projectId: link.projectId,
      missionId: link.missionId,
      missionTitle: link.missionTitle,
      objective: link.objective,
      status: link.status,
      assignedRole: link.assignedRole,
      costCents: link.costCents || 0,
      tokensUsed: link.tokensUsed || 0,
      evidenceId: link.evidenceId,
      createdAt: new Date().toISOString()
    };

    const cached = this.readMissionsCache();
    cached.unshift(fullLink);
    this.writeMissionsCache(cached.slice(0, 500));

    try {
      await supabase.from('hq_project_missions').insert({
        id: fullLink.id,
        project_id: fullLink.projectId,
        mission_id: fullLink.missionId,
        mission_title: fullLink.missionTitle,
        objective: fullLink.objective,
        status: fullLink.status,
        assigned_role: fullLink.assignedRole,
        cost_cents: fullLink.costCents,
        tokens_used: fullLink.tokensUsed,
        evidence_id: fullLink.evidenceId,
        created_at: fullLink.createdAt
      });
    } catch {
      // offline fallback
    }

    return fullLink;
  }

  public async getProjectMissions(projectId: string): Promise<ProjectMissionLink[]> {
    const local = this.readMissionsCache().filter(m => m.projectId === projectId);
    try {
      const { data, error } = await supabase
        .from('hq_project_missions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const fromDb = data.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          missionId: d.mission_id,
          missionTitle: d.mission_title,
          objective: d.objective,
          status: d.status,
          assignedRole: d.assigned_role,
          costCents: Number(d.cost_cents) || 0,
          tokensUsed: Number(d.tokens_used) || 0,
          evidenceId: d.evidence_id,
          createdAt: d.created_at,
          completedAt: d.completed_at
        }));
        const map = new Map<string, ProjectMissionLink>();
        for (const m of [...fromDb, ...local]) {
          map.set(m.id, m);
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch {
      // offline fallback
    }
    return local;
  }

  public async reconstructProjectHistory(projectId: string) {
    const project = await this.getProjectById(projectId);
    if (!project) throw new Error(`Project '${projectId}' not found`);

    const missions = await this.getProjectMissions(projectId);
    const events = await this.getEvents(projectId);
    const testRuns = await this.getTestRuns(projectId);

    const totalCostCents = (project.buildCostCents || 0) + missions.reduce((acc, m) => acc + (m.costCents || 0), 0);
    const totalTokensUsed = (project.totalTokensUsed || 0) + missions.reduce((acc, m) => acc + (m.tokensUsed || 0), 0);

    return {
      project,
      missions,
      events,
      testRuns,
      totalCostCents,
      totalTokensUsed,
      reconstructedAt: new Date().toISOString()
    };
  }

  public async archiveProject(id: string): Promise<ProjectRecord> {
    const project = await this.getProjectById(id);
    if (!project) throw new Error(`Project '${id}' not found`);

    const updated = await this.saveProject({
      ...project,
      status: 'ARCHIVED'
    }, project.revision);

    await this.logEvent({
      projectId: id,
      eventType: 'PROJECT_ARCHIVED',
      actor: 'human',
      payload: { previousStatus: project.status }
    });

    return updated;
  }

  // --- Runner Leases Lifecycle (Phase 3) ---
  public async saveLease(lease: ProjectRunnerLease): Promise<ProjectRunnerLease> {
    const cached = this.readLeasesCache();
    const existingIndex = cached.findIndex(l => l.id === lease.id);
    if (existingIndex >= 0) {
      cached[existingIndex] = lease;
    } else {
      cached.unshift(lease);
    }
    this.writeLeasesCache(cached.slice(0, 500));

    try {
      await supabase.from('hq_project_runner_leases').upsert({
        id: lease.id,
        project_id: lease.projectId,
        runner_id: lease.runnerId,
        pid: lease.pid,
        port: lease.port,
        status: lease.status,
        started_at: lease.startedAt,
        heartbeat_at: lease.heartbeatAt,
        expires_at: lease.expiresAt,
        exit_code: lease.exitCode
      });
    } catch {
      // Offline fallback
    }

    return lease;
  }

  public async getActiveLeases(projectId?: string): Promise<ProjectRunnerLease[]> {
    const local = this.readLeasesCache().filter(l => {
      const isProjMatch = !projectId || l.projectId === projectId;
      return isProjMatch && l.status === 'ACTIVE' && new Date(l.expiresAt).getTime() > Date.now();
    });

    try {
      let query = supabase
        .from('hq_project_runner_leases')
        .select('*')
        .eq('status', 'ACTIVE')
        .gt('expires_at', new Date().toISOString());

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const fromDb: ProjectRunnerLease[] = data.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          runnerId: d.runner_id,
          pid: d.pid,
          port: d.port,
          status: d.status,
          startedAt: d.started_at,
          heartbeatAt: d.heartbeat_at,
          expiresAt: d.expires_at,
          exitCode: d.exit_code
        }));
        this.writeLeasesCache(fromDb);
        return fromDb;
      }
    } catch {
      // Offline fallback
    }

    return local;
  }

  public async updateLeaseHeartbeat(leaseId: string, expiresAt: string): Promise<void> {
    const now = new Date().toISOString();
    const cached = this.readLeasesCache();
    const lease = cached.find(l => l.id === leaseId);
    if (lease) {
      lease.heartbeatAt = now;
      lease.expiresAt = expiresAt;
      this.writeLeasesCache(cached);
    }

    try {
      await supabase
        .from('hq_project_runner_leases')
        .update({ heartbeat_at: now, expires_at: expiresAt })
        .eq('id', leaseId);
    } catch {}
  }

  public async terminateLease(leaseId: string, status: 'RELEASED' | 'EXPIRED' | 'TERMINATED' = 'RELEASED', exitCode?: number): Promise<void> {
    const cached = this.readLeasesCache();
    const lease = cached.find(l => l.id === leaseId);
    if (lease) {
      lease.status = status;
      if (exitCode !== undefined) lease.exitCode = exitCode;
      this.writeLeasesCache(cached);
    }

    try {
      await supabase
        .from('hq_project_runner_leases')
        .update({ status, exit_code: exitCode })
        .eq('id', leaseId);
    } catch {}
  }

  // --- Financial Control Plane & Ledger Methods ---
  public async recordLedgerTransaction(tx: ProjectLedgerRecord): Promise<ProjectLedgerRecord> {
    const cached = this.readLedgerCache();
    cached.unshift(tx);
    this.writeLedgerCache(cached);

    try {
      await supabase.from('hq_ledger_transactions').insert({
        id: tx.id,
        project_id: tx.projectId,
        transaction_type: tx.transactionType,
        currency: tx.currency,
        amount_cents: tx.amountCents,
        token_count: tx.tokenCount || 0,
        unit_cost_cents: tx.unitCostCents || 0,
        agent_id: tx.agentId || null,
        task_id: tx.taskId || null,
        task_run_id: tx.taskRunId || null,
        mission_id: tx.missionId || null,
        status: tx.status,
        description: tx.description || null,
        metadata: tx.metadata || {},
        created_at: tx.createdAt
      });
    } catch {}

    return tx;
  }

  public async getProjectLedger(projectId: string): Promise<ProjectLedgerRecord[]> {
    const local = this.readLedgerCache().filter(t => t.projectId === projectId);

    try {
      const { data, error } = await supabase
        .from('hq_ledger_transactions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const fromDb: ProjectLedgerRecord[] = data.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          transactionType: d.transaction_type,
          currency: d.currency,
          amountCents: Number(d.amount_cents),
          tokenCount: d.token_count,
          unitCostCents: Number(d.unit_cost_cents),
          agentId: d.agent_id,
          taskId: d.task_id,
          taskRunId: d.task_run_id,
          missionId: d.mission_id,
          status: d.status,
          description: d.description,
          metadata: d.metadata || {},
          createdAt: d.created_at
        }));
        this.writeLedgerCache(fromDb);
        return fromDb;
      }
    } catch {}

    return local;
  }

  public async recordSpendReservation(reservation: SpendReservationRecord): Promise<SpendReservationRecord> {
    const cached = this.readReservationsCache();
    cached.unshift(reservation);
    this.writeReservationsCache(cached);

    try {
      await supabase.from('hq_spend_reservations').insert({
        id: reservation.id,
        project_id: reservation.projectId,
        amount_cents: reservation.amountCents,
        status: reservation.status,
        task_id: reservation.taskId || null,
        agent_id: reservation.agentId || null,
        reason: reservation.reason || null,
        created_at: reservation.createdAt,
        expires_at: reservation.expiresAt,
        settled_at: reservation.settledAt || null,
        settled_amount_cents: reservation.settledAmountCents || 0
      });
    } catch {}

    return reservation;
  }

  public async getActiveReservations(projectId?: string): Promise<SpendReservationRecord[]> {
    const now = Date.now();
    const local = this.readReservationsCache().filter(r => {
      const isProjMatch = !projectId || r.projectId === projectId;
      return isProjMatch && r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() > now;
    });

    try {
      let query = supabase
        .from('hq_spend_reservations')
        .select('*')
        .eq('status', 'ACTIVE')
        .gt('expires_at', new Date().toISOString());

      if (projectId) query = query.eq('project_id', projectId);

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const fromDb: SpendReservationRecord[] = data.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          amountCents: Number(d.amount_cents),
          status: d.status,
          taskId: d.task_id,
          agentId: d.agent_id,
          reason: d.reason,
          createdAt: d.created_at,
          expiresAt: d.expires_at,
          settledAt: d.settled_at,
          settledAmountCents: Number(d.settled_amount_cents)
        }));
        return fromDb;
      }
    } catch {}

    return local;
  }

  public async getSpendReservationById(id: string): Promise<SpendReservationRecord | null> {
    const cached = this.readReservationsCache();
    const res = cached.find(r => r.id === id);
    if (res) return res;

    try {
      const { data, error } = await supabase
        .from('hq_spend_reservations')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          projectId: data.project_id,
          amountCents: Number(data.amount_cents),
          status: data.status,
          taskId: data.task_id,
          agentId: data.agent_id,
          reason: data.reason,
          createdAt: data.created_at,
          expiresAt: data.expires_at,
          settledAt: data.settled_at,
          settledAmountCents: Number(data.settled_amount_cents)
        };
      }
    } catch {}
    return null;
  }

  public async updateSpendReservation(id: string, update: Partial<SpendReservationRecord>): Promise<SpendReservationRecord | null> {
    const cached = this.readReservationsCache();
    const idx = cached.findIndex(r => r.id === id);
    if (idx >= 0) {
      cached[idx] = { ...cached[idx], ...update };
      this.writeReservationsCache(cached);
    }

    try {
      const dbUpdate: any = {};
      if (update.status) dbUpdate.status = update.status;
      if (update.settledAt) dbUpdate.settled_at = update.settledAt;
      if (update.settledAmountCents !== undefined) dbUpdate.settled_amount_cents = update.settledAmountCents;

      await supabase
        .from('hq_spend_reservations')
        .update(dbUpdate)
        .eq('id', id);
    } catch {}

    return idx >= 0 ? cached[idx] : null;
  }

  public async recordProcessedProviderEvent(event: ProcessedProviderEventRecord): Promise<{ duplicate: boolean }> {
    if (this.inFlightProviderEvents.has(event.providerEventId)) {
      return { duplicate: true };
    }
    this.inFlightProviderEvents.add(event.providerEventId);

    const cached = this.readProcessedEventsCache();
    const existsLocally = cached.some(e => e.providerEventId === event.providerEventId);
    if (existsLocally) {
      return { duplicate: true };
    }

    try {
      const { data: existing } = await supabase
        .from('hq_processed_provider_events')
        .select('provider_event_id')
        .eq('provider_event_id', event.providerEventId)
        .single();

      if (existing) {
        cached.push(event);
        this.writeProcessedEventsCache(cached);
        return { duplicate: true };
      }

      const { error } = await supabase.from('hq_processed_provider_events').insert({
        provider_event_id: event.providerEventId,
        provider: event.provider,
        event_type: event.eventType,
        project_id: event.projectId || null,
        payload: event.payload || {},
        processed_at: event.processedAt
      });

      if (error && (error.code === '23505' || error.message.includes('unique'))) {
        return { duplicate: true };
      }
    } catch {}

    cached.push(event);
    this.writeProcessedEventsCache(cached);
    return { duplicate: false };
  }

  public async hasProcessedProviderEvent(eventId: string): Promise<boolean> {
    const cached = this.readProcessedEventsCache();
    if (cached.some(e => e.providerEventId === eventId)) return true;

    try {
      const { data } = await supabase
        .from('hq_processed_provider_events')
        .select('provider_event_id')
        .eq('provider_event_id', eventId)
        .single();
      return !!data;
    } catch {
      return false;
    }
  }

  // --- Mappers ---
  private mapFromDb(d: any): ProjectRecord {
    return {
      id: d.id,
      slug: d.slug,
      name: d.name,
      category: d.category,
      status: d.status,
      workspacePath: d.workspace_path,
      repository: d.repository,
      currentVersion: d.current_version || 'v0.1.0',
      revision: Number(d.revision) || 0,
      businessObjective: d.business_objective || '',
      targetCustomer: d.target_customer,
      problemSolved: d.problem_solved,
      pricingCents: Number(d.pricing_cents) || 0,
      currency: d.currency || 'USD',
      buildCostCents: Number(d.build_cost_cents) || 0,
      totalTokensUsed: Number(d.total_tokens_used) || 0,
      healthStatus: d.health_status || 'HEALTHY',
      activePort: d.active_port,
      budgetCapCents: Number(d.budget_cap_cents) || 10000,
      cashReceivedCents: Number(d.cash_received_cents) || 0,
      settledSpendCents: Number(d.settled_spend_cents) || 0,
      reservedSpendCents: Number(d.reserved_spend_cents) || 0,
      paymentState: d.payment_state || 'UNFUNDED',
      minimumDepositCents: Number(d.minimum_deposit_cents) || 0,
      depositPercentage: Number(d.deposit_percentage) || 50.0,
      stripeCustomerId: d.stripe_customer_id,
      metadata: d.metadata || {},
      createdAt: d.created_at || new Date().toISOString(),
      updatedAt: d.updated_at || new Date().toISOString()
    };
  }

  private mapToDb(p: ProjectRecord): Record<string, any> {
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      status: p.status,
      workspace_path: p.workspacePath,
      repository: p.repository || null,
      current_version: p.currentVersion,
      revision: p.revision,
      business_objective: p.businessObjective,
      target_customer: p.targetCustomer || null,
      problem_solved: p.problemSolved || null,
      pricing_cents: p.pricingCents,
      currency: p.currency,
      build_cost_cents: p.buildCostCents,
      total_tokens_used: p.totalTokensUsed,
      health_status: p.healthStatus,
      active_port: p.activePort || null,
      budget_cap_cents: p.budgetCapCents ?? 10000,
      cash_received_cents: p.cashReceivedCents ?? 0,
      settled_spend_cents: p.settledSpendCents ?? 0,
      reserved_spend_cents: p.reservedSpendCents ?? 0,
      payment_state: p.paymentState ?? 'UNFUNDED',
      minimum_deposit_cents: p.minimumDepositCents ?? 0,
      deposit_percentage: p.depositPercentage ?? 50.0,
      stripe_customer_id: p.stripeCustomerId || null,
      metadata: p.metadata || {},
      created_at: p.createdAt,
      updated_at: p.updatedAt
    };
  }
  // ============================================================================
  // PHASE 5: CLIENT PORTAL ACCESS & SESSIONS
  // ============================================================================

  private readPortalAccessCache(): PortalAccessRecord[] {
    try {
      if (fs.existsSync(PORTAL_ACCESS_CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(PORTAL_ACCESS_CACHE_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[ProjectDB] Portal access cache read error:', err);
    }
    return [];
  }

  private writePortalAccessCache(records: PortalAccessRecord[]): void {
    this.ensureDirs();
    fs.writeFileSync(PORTAL_ACCESS_CACHE_FILE, JSON.stringify(records, null, 2), 'utf8');
  }

  public async savePortalAccess(record: PortalAccessRecord): Promise<PortalAccessRecord> {
    const records = this.readPortalAccessCache();
    const idx = records.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    this.writePortalAccessCache(records);

    try {
      await supabase.from('hq_portal_access').upsert({
        id: record.id,
        project_id: record.projectId,
        credential_hash: record.credentialHash,
        permissions: record.permissions,
        expires_at: record.expiresAt,
        used_at: record.usedAt || null,
        revoked_at: record.revokedAt || null,
        created_by: record.createdBy,
        created_at: record.createdAt,
        version: record.version
      });
    } catch (err) {
      console.warn('[ProjectDB] Supabase portal access upsert fallback:', err);
    }

    return record;
  }

  public async getPortalAccess(shareId: string): Promise<PortalAccessRecord | null> {
    const local = this.readPortalAccessCache().find(r => r.id === shareId);
    try {
      const { data, error } = await supabase
        .from('hq_portal_access')
        .select('*')
        .eq('id', shareId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          projectId: data.project_id,
          credentialHash: data.credential_hash,
          permissions: data.permissions || [],
          expiresAt: data.expires_at,
          usedAt: data.used_at || undefined,
          revokedAt: data.revoked_at || undefined,
          createdBy: data.created_by,
          createdAt: data.created_at,
          version: data.version
        };
      }
    } catch {}
    return local || null;
  }

  public async listPortalAccess(projectId: string): Promise<PortalAccessRecord[]> {
    const local = this.readPortalAccessCache().filter(r => r.projectId === projectId);
    try {
      const { data, error } = await supabase
        .from('hq_portal_access')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          projectId: d.project_id,
          credentialHash: d.credential_hash,
          permissions: d.permissions || [],
          expiresAt: d.expires_at,
          usedAt: d.used_at || undefined,
          revokedAt: d.revoked_at || undefined,
          createdBy: d.created_by,
          createdAt: d.created_at,
          version: d.version
        }));
      }
    } catch {}
    return local;
  }

  public async revokePortalAccess(shareId: string, actor: string = 'human'): Promise<void> {
    const access = await this.getPortalAccess(shareId);
    if (!access) return;

    access.revokedAt = new Date().toISOString();
    await this.savePortalAccess(access);

    // Also revoke all active sessions for this share
    await this.revokePortalSessionsByShare(shareId);

    await this.logEvent({
      projectId: access.projectId,
      eventType: 'PORTAL_ACCESS_REVOKED',
      actor,
      payload: { shareId, revokedAt: access.revokedAt }
    });
  }

  private readPortalSessionsCache(): PortalSessionRecord[] {
    try {
      if (fs.existsSync(PORTAL_SESSIONS_CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(PORTAL_SESSIONS_CACHE_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[ProjectDB] Portal sessions cache read error:', err);
    }
    return [];
  }

  private writePortalSessionsCache(records: PortalSessionRecord[]): void {
    this.ensureDirs();
    fs.writeFileSync(PORTAL_SESSIONS_CACHE_FILE, JSON.stringify(records, null, 2), 'utf8');
  }

  public async savePortalSession(session: PortalSessionRecord): Promise<PortalSessionRecord> {
    const sessions = this.readPortalSessionsCache();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.push(session);
    }
    this.writePortalSessionsCache(sessions);

    try {
      await supabase.from('hq_portal_sessions').upsert({
        id: session.id,
        session_hash: session.sessionHash,
        share_id: session.shareId,
        project_id: session.projectId,
        permissions: session.permissions,
        csrf_token: session.csrfToken,
        expires_at: session.expiresAt,
        revoked_at: session.revokedAt || null,
        created_at: session.createdAt
      });
    } catch (err) {
      console.warn('[ProjectDB] Supabase portal session upsert fallback:', err);
    }

    return session;
  }

  public async getPortalSessionByHash(sessionHash: string): Promise<PortalSessionRecord | null> {
    const local = this.readPortalSessionsCache().find(s => s.sessionHash === sessionHash);
    try {
      const { data, error } = await supabase
        .from('hq_portal_sessions')
        .select('*')
        .eq('session_hash', sessionHash)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          sessionHash: data.session_hash,
          shareId: data.share_id,
          projectId: data.project_id,
          permissions: data.permissions || [],
          csrfToken: data.csrf_token,
          expiresAt: data.expires_at,
          revokedAt: data.revoked_at || undefined,
          createdAt: data.created_at
        };
      }
    } catch {}
    return local || null;
  }

  public async revokePortalSession(sessionId: string): Promise<void> {
    const sessions = this.readPortalSessionsCache();
    const sess = sessions.find(s => s.id === sessionId);
    if (sess) {
      sess.revokedAt = new Date().toISOString();
      this.writePortalSessionsCache(sessions);
    }

    try {
      await supabase
        .from('hq_portal_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch {}
  }

  public async revokePortalSessionsByShare(shareId: string): Promise<void> {
    const sessions = this.readPortalSessionsCache();
    const now = new Date().toISOString();
    for (const s of sessions) {
      if (s.shareId === shareId) {
        s.revokedAt = now;
      }
    }
    this.writePortalSessionsCache(sessions);

    try {
      await supabase
        .from('hq_portal_sessions')
        .update({ revoked_at: now })
        .eq('share_id', shareId);
    } catch {}
  }

  private readPortalIdempotencyCache(): PortalFeedbackIdempotencyRecord[] {
    try {
      if (fs.existsSync(PORTAL_IDEMPOTENCY_CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(PORTAL_IDEMPOTENCY_CACHE_FILE, 'utf8'));
      }
    } catch (err) {
      console.warn('[ProjectDB] Portal idempotency cache read error:', err);
    }
    return [];
  }

  private writePortalIdempotencyCache(records: PortalFeedbackIdempotencyRecord[]): void {
    this.ensureDirs();
    fs.writeFileSync(PORTAL_IDEMPOTENCY_CACHE_FILE, JSON.stringify(records, null, 2), 'utf8');
  }

  public async getFeedbackIdempotency(projectId: string, idempotencyKey: string): Promise<PortalFeedbackIdempotencyRecord | null> {
    const local = this.readPortalIdempotencyCache().find(r => r.projectId === projectId && r.idempotencyKey === idempotencyKey);
    try {
      const { data, error } = await supabase
        .from('hq_portal_feedback_idempotency')
        .select('*')
        .eq('project_id', projectId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (!error && data) {
        return {
          projectId: data.project_id,
          idempotencyKey: data.idempotency_key,
          shareId: data.share_id,
          requestHash: data.request_hash,
          createdAt: data.created_at,
          responsePayload: data.response_payload
        };
      }
    } catch {}
    return local || null;
  }

  public async saveFeedbackIdempotency(record: PortalFeedbackIdempotencyRecord): Promise<void> {
    const records = this.readPortalIdempotencyCache();
    const idx = records.findIndex(r => r.projectId === record.projectId && r.idempotencyKey === record.idempotencyKey);
    if (idx >= 0) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    this.writePortalIdempotencyCache(records);

    try {
      await supabase.from('hq_portal_feedback_idempotency').upsert({
        project_id: record.projectId,
        idempotency_key: record.idempotencyKey,
        share_id: record.shareId,
        request_hash: record.requestHash,
        created_at: record.createdAt,
        response_payload: record.responsePayload
      });
    } catch (err) {
      console.warn('[ProjectDB] Supabase portal idempotency upsert fallback:', err);
    }
  }
}
