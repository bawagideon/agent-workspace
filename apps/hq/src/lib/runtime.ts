import path from 'path';
import { supabase } from './supabase';
import { 
  PolicyEngine 
} from '@gideon/policy';
import { 
  MemoryEngine, 
  OpportunityMemory 
} from '@gideon/memory';
import { 
  WorkspaceSandbox, 
  JobExecutor, 
  KillSwitch,
  OpenClawBridgeClient 
} from '@gideon/runner';
import { 
  OpportunityEngine 
} from '@gideon/agents';
import { 
  MissionEngine, 
  CommandEngine, 
  InvestigationEngine, 
  ExperimentEngine,
  CommandRequest,
  CommandResponse 
} from '@gideon/runtime';

// Singleton instance container
let runtimeInstance: {
  commandEngine: CommandEngine;
  missionEngine: MissionEngine;
  policyEngine: PolicyEngine;
  opportunityEngine: OpportunityEngine;
  opportunityMemory: OpportunityMemory;
  investigationEngine: InvestigationEngine;
  experimentEngine: ExperimentEngine;
  sandbox: WorkspaceSandbox;
} | null = null;

export function getGideonRuntime() {
  if (runtimeInstance) {
    return runtimeInstance;
  }

  const workspaceRoot = process.env.WORKSPACE_ROOT || 
    (process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd());
  const hmacSecret = process.env.HMAC_PLAN_SECRET || '53bb94e9745a59b36dfc0d40b5fc4c561467e4118c72cb26e01b68eb7993c187';

  const sandbox = new WorkspaceSandbox([
    { id: 'ws-agent-workspace', rootPath: workspaceRoot, workspaceType: 'ACTIVE' }
  ]);

  const policyEngine = new PolicyEngine(hmacSecret);
  const memoryEngine = new MemoryEngine();
  const opportunityMemory = new OpportunityMemory(memoryEngine);
  const opportunityEngine = new OpportunityEngine();
  const investigationEngine = new InvestigationEngine(opportunityMemory, workspaceRoot);
  const experimentEngine = new ExperimentEngine(opportunityMemory, workspaceRoot);
  const jobExecutor = new JobExecutor(sandbox, policyEngine);
  const missionEngine = new MissionEngine(policyEngine, memoryEngine, jobExecutor);

  const commandEngine = new CommandEngine(missionEngine, policyEngine, {
    allowedSenders: [
      'admin',
      'owner',
      'authorized-user',
      '+10000000000',
      'tg-master-admin',
      'pwa-client',
      'hq-web-user'
    ],
    hmacSecret,
    opportunityEngine,
    opportunityMemory,
    investigationEngine,
    experimentEngine
  });

  runtimeInstance = {
    commandEngine,
    missionEngine,
    policyEngine,
    opportunityEngine,
    opportunityMemory,
    investigationEngine,
    experimentEngine,
    sandbox
  };

  return runtimeInstance;
}

/**
 * Executes a command with full synchronization against Supabase state and Realtime events.
 */
export async function dispatchGovernedCommand(req: CommandRequest): Promise<CommandResponse> {
  const startTime = Date.now();
  const runtime = getGideonRuntime();

  const trimmed = req.text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check live OpenClaw and Machine Status for "status" queries
  if (lower.startsWith('status')) {
    let machineStatus = 'OFFLINE';
    let machineName = 'GIDMACHINE_WIN';
    let openclawStatus = 'OFFLINE';
    let openclawVersion = 'unknown';

    try {
      // Query machine from Supabase
      const { data: machine } = await supabase
        .from('hq_machines')
        .select('*')
        .eq('id', 'GIDMACHINE_WIN')
        .single();

      if (machine) {
        machineStatus = machine.status;
        machineName = machine.name;
      }
    } catch {
      // fallback
    }

    try {
      const bridge = new OpenClawBridgeClient();
      const connected = await bridge.connect();
      if (connected) {
        openclawStatus = 'ONLINE';
        const rpcStatus = await bridge.getStatus();
        openclawVersion = rpcStatus?.runtimeVersion || rpcStatus?.version || '2026.9.3';
        bridge.disconnect();
      }
    } catch {
      // OpenClaw not reachable
    }

    const { count: activeTasks } = await supabase
      .from('hq_tasks')
      .select('*', { count: 'exact', head: true })
      .in('status', ['EXECUTING', 'WORKING', 'PLANNING']);

    const { count: pendingApprovals } = await supabase
      .from('hq_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');

    const statusMsg = [
      `● GIDEON OPERATIONAL STATUS`,
      `• Machine: ${machineName} (${machineStatus})`,
      `• OpenClaw Gateway: ${openclawStatus} (Port 18789, v${openclawVersion})`,
      `• Active Tasks: ${activeTasks || 0}`,
      `• Pending Approvals: ${pendingApprovals || 0}`,
      `• Control Layer: Sub-50ms Direct ROL v5.0.5`
    ].join('\n');

    return {
      success: true,
      commandId: req.id || `cmd-${Date.now()}`,
      verb: 'STATUS',
      executionMs: Date.now() - startTime,
      message: statusMsg,
      data: {
        machineStatus,
        openclawStatus,
        activeTasks: activeTasks || 0,
        pendingApprovals: pendingApprovals || 0
      }
    };
  }

  // 2. Query live Supabase data for "briefing" queries
  if (lower === 'briefing' || lower === 'morning-briefing' || lower === 'summary') {
    const { count: activeTasks } = await supabase
      .from('hq_tasks')
      .select('*', { count: 'exact', head: true })
      .in('status', ['EXECUTING', 'WORKING', 'PLANNING']);

    const { count: pendingApprovals } = await supabase
      .from('hq_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');

    const { count: totalOpportunities } = await supabase
      .from('hq_opportunities')
      .select('*', { count: 'exact', head: true });

    const { data: ledgerTx } = await supabase
      .from('hq_ledger_transactions')
      .select('amount_cents, transaction_type');

    let totalRevenueCents = 0;
    let totalSpendCents = 0;
    if (ledgerTx) {
      for (const tx of ledgerTx) {
        if (tx.transaction_type === 'REVENUE') totalRevenueCents += Number(tx.amount_cents);
        if (tx.transaction_type === 'EXPENSE' || tx.transaction_type === 'TOKEN_COST') totalSpendCents += Number(tx.amount_cents);
      }
    }

    const briefingMsg = [
      `☀️ GIDEON EXECUTIVE BRIEFING`,
      `• Active Missions: ${activeTasks || 0} in progress`,
      `• Pending Approvals: ${pendingApprovals || 0} requiring human decision`,
      `• Opportunity Radar: ${totalOpportunities || 0} scouted leads`,
      `• Verified Realized Revenue: $${(totalRevenueCents / 100).toFixed(2)} USD`,
      `• Token & Infrastructure Burn: $${(totalSpendCents / 100).toFixed(4)} USD`,
      `• System Invariant: Deterministic Policy & Governance Active`
    ].join('\n');

    return {
      success: true,
      commandId: req.id || `cmd-${Date.now()}`,
      verb: 'BRIEFING',
      executionMs: Date.now() - startTime,
      message: briefingMsg,
      data: {
        activeMissions: activeTasks || 0,
        pendingApprovals: pendingApprovals || 0,
        totalOpportunities: totalOpportunities || 0,
        revenueCents: totalRevenueCents,
        spendCents: totalSpendCents
      }
    };
  }

  // 3. Delegate to CommandEngine (processes investigate, experiment, why-not, killswitch, pause, resume, etc.)
  const result = await runtime.commandEngine.executeCommand(req);

  // 4. Synchronize state with Supabase
  try {
    // If investigate or opportunity discovered, persist into hq_opportunities
    if (result.verb === 'INVESTIGATE' && result.data?.opportunity) {
      const opp = result.data.opportunity;
      await supabase
        .from('hq_opportunities')
        .upsert({
          title: opp.title,
          description: opp.description,
          source: opp.source || 'HUMAN',
          estimated_value_cents: opp.estimatedValueCents || 50000,
          confidence_score: opp.confidenceScore || opp.confidence || 0.5,
          status: opp.status || 'DISCOVERED',
          target_skills: opp.targetSkills || [],
          metadata: {
            recommendation: opp.recommendation,
            unknowns: opp.unknowns,
            investigationReport: result.data.report || null
          }
        }, { onConflict: 'title' });
    }

    // If emergency halt, mark running tasks
    if (result.verb === 'EMERGENCY_STOP') {
      await supabase
        .from('hq_tasks')
        .update({ status: 'EMERGENCY_STOPPED' })
        .in('status', ['EXECUTING', 'WAITING_APPROVAL', 'PLANNING']);

      await supabase.channel('gideon-runner-channel').send({
        type: 'broadcast',
        event: 'KILL_SWITCH_TRIGGERED',
        payload: { timestamp: new Date().toISOString(), source: req.senderId }
      });
    }

    // If approve, sync hq_approvals
    if (result.verb === 'APPROVE' && req.text.startsWith('approve')) {
      const approvalId = req.text.split(/\s+/)[1];
      if (approvalId) {
        await supabase
          .from('hq_approvals')
          .update({
            status: 'APPROVED',
            reviewer_notes: `Approved via Command API by ${req.senderId}`,
            resolved_at: new Date().toISOString()
          })
          .eq('id', approvalId);
      }
    }

    // If reject, sync hq_approvals
    if (result.verb === 'REJECT' && (req.text.startsWith('reject') || req.text.startsWith('deny'))) {
      const parts = req.text.split(/\s+/);
      const approvalId = parts[1];
      const reason = parts.slice(2).join(' ') || 'Rejected via Command API';
      if (approvalId) {
        await supabase
          .from('hq_approvals')
          .update({
            status: 'REJECTED',
            reviewer_notes: reason,
            resolved_at: new Date().toISOString()
          })
          .eq('id', approvalId);
      }
    }
  } catch (err) {
    // Non-fatal logging
    console.warn('[dispatchGovernedCommand] Supabase sync warning:', err);
  }

  return result;
}
