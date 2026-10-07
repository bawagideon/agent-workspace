import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WorkspaceSandbox } from './sandbox/WorkspaceSandbox';
import { JobExecutor } from './JobExecutor';
import { PolicyEngine } from '@gideon/policy';
import { KillSwitch } from './KillSwitch';
import { ChannelGatewayAdapter } from './ChannelGatewayAdapter';
import { CommandEngine, MissionEngine } from '@gideon/runtime';
import { MemoryEngine, PersonalContextEngine } from '@gideon/memory';

import fs from 'fs';
import path from 'path';

const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../.env.local'),
  path.resolve(__dirname, '../../../.env')
];
for (const envFile of envCandidates) {
  if (fs.existsSync(envFile)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('dotenv').config({ path: envFile });
      break;
    } catch {}
  }
}

export class GideonRunnerDaemon {
  private supabase: SupabaseClient | null = null;
  private machineId: string;
  private sandbox: WorkspaceSandbox;
  private jobExecutor: JobExecutor;
  private policyEngine: PolicyEngine;
  private channelGateway: ChannelGatewayAdapter | null = null;
  private isRunning: boolean = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.machineId = process.env.MACHINE_ID || 'GIDMACHINE_WIN';
    const initialWorkspace = process.env.WORKSPACE_ROOT || process.cwd();

    this.sandbox = new WorkspaceSandbox([
      { id: 'ws-agent-workspace', rootPath: initialWorkspace }
    ]);

    this.policyEngine = new PolicyEngine(process.env.HMAC_PLAN_SECRET || 'gideon-default-secret-key');
    this.jobExecutor = new JobExecutor(this.sandbox, this.policyEngine);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log(`[GideonRunner] Starting daemon on machine: ${this.machineId}`);

    await this.registerMachine();
    this.startHeartbeat();
    this.listenForJobs();

    if (process.env.TELEGRAM_BOT_TOKEN) {
      console.log('[GideonRunner] Initializing Telegram Mobile Control Plane...');
      const missionEngine = new MissionEngine();
      const memoryEngine = new MemoryEngine(this.supabase || undefined);
      const personalContext = new PersonalContextEngine();
      const commandEngine = new CommandEngine(missionEngine, this.policyEngine, memoryEngine, personalContext);
      this.channelGateway = new ChannelGatewayAdapter(commandEngine);
      this.channelGateway.startTelegramPolling();
    }
  }

  private async registerMachine(): Promise<void> {
    if (!this.supabase) {
      console.log('[GideonRunner] Supabase not configured. Running in local standalone mode.');
      return;
    }

    try {
      await this.supabase.from('hq_machines').upsert({
        id: this.machineId,
        name: `Local Workstation (${process.platform})`,
        platform: process.platform,
        runner_version: '3.0.0',
        status: 'ONLINE',
        capabilities: ['node', 'git', 'npm', 'pnpm', 'tsc', 'python'],
        last_heartbeat_at: new Date().toISOString()
      });
      console.log(`[GideonRunner] Machine ${this.machineId} registered successfully.`);
    } catch (err: any) {
      console.error('[GideonRunner] Failed to register machine:', err.message);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      if (!this.supabase || !this.isRunning) return;

      try {
        await this.supabase
          .from('hq_machines')
          .update({
            status: KillSwitch.isHalted() ? 'DEGRADED' : 'ONLINE',
            last_heartbeat_at: new Date().toISOString()
          })
          .eq('id', this.machineId);
      } catch (err: any) {
        console.warn('[GideonRunner] Heartbeat failed:', err.message);
      }
    }, 10000);
  }

  private listenForJobs(): void {
    if (!this.supabase) return;

    // Listen on Realtime channel
    const channel = this.supabase.channel('gideon-runner-channel');

    channel
      .on('broadcast', { event: 'KILL_SWITCH_TRIGGERED' }, (payload) => {
        console.log('[GideonRunner] 🚨 EMERGENCY KILL SWITCH RECEIVED!');
        KillSwitch.triggerEmergencyStop();
      })
      .on('broadcast', { event: 'EXECUTE_JOB' }, async ({ payload }) => {
        console.log(`[GideonRunner] Received execution job: ${payload.toolId}`);
        const result = await this.jobExecutor.executeJob(payload);
        
        await this.supabase?.channel('gideon-runner-channel').send({
          type: 'broadcast',
          event: 'JOB_COMPLETED',
          payload: result
        });
      })
      .subscribe();

    console.log('[GideonRunner] Subscribed to realtime job channels.');
  }

  public getSandbox(): WorkspaceSandbox {
    return this.sandbox;
  }

  public getJobExecutor(): JobExecutor {
    return this.jobExecutor;
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.channelGateway) {
      this.channelGateway.stopTelegramPolling();
    }

    if (this.supabase) {
      await this.supabase
        .from('hq_machines')
        .update({ status: 'OFFLINE' })
        .eq('id', this.machineId);
    }
    console.log('[GideonRunner] Daemon stopped gracefully.');
  }
}

// Auto-start if executed directly via CLI
if (require.main === module) {
  const runner = new GideonRunnerDaemon();
  runner.start().catch((err) => {
    console.error('[GideonRunner] Fatal error:', err);
    process.exit(1);
  });
}
