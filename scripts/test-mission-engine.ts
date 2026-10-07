import path from 'path';
import { WorkspaceSandbox } from '../packages/runner/src/sandbox/WorkspaceSandbox';
import { PolicyEngine } from '../packages/policy/src/PolicyEngine';
import { MemoryEngine } from '../packages/memory/src/MemoryEngine';
import { JobExecutor } from '../packages/runner/src/JobExecutor';
import { MockProvider } from '../packages/runtime/src/providers/MockProvider';
import { MissionEngine } from '../packages/runtime/src/MissionEngine';

async function testMissionEngine() {
  console.log('================================================================');
  console.log('🏛️ GIDEON AI HQ — MISSION ENGINE & WORKFORCE DAG PIPELINE TEST');
  console.log('================================================================\n');

  const fixtureWorkspaceRoot = path.resolve(__dirname, '../fixtures/sample-repos/sample-app');
  const fixtureWorkspaceId = 'ws-fixture-sample-app';

  const sandbox = new WorkspaceSandbox([
    { id: fixtureWorkspaceId, rootPath: fixtureWorkspaceRoot, workspaceType: 'ACTIVE' }
  ]);

  const policyEngine = new PolicyEngine('gideon-mission-secret-key-v5');
  const memoryEngine = new MemoryEngine();
  const jobExecutor = new JobExecutor(sandbox, policyEngine);
  const modelProvider = new MockProvider();

  const missionEngine = new MissionEngine(policyEngine, memoryEngine, jobExecutor, modelProvider);

  // 1. Create Multi-Agent Mission
  console.log('[Mission Setup] Creating multi-agent revenue & engineering mission...');
  const mission = missionEngine.createMission({
    title: 'Deploy Production Health Fix & Audit Unit Economics',
    objective: 'Fix target health assertion in src/index.ts and verify test passes.',
    budgetLimitCents: 1000.00 // $10 cap
  });

  console.log(`✅ Mission Created: "${mission.title}" (ID: ${mission.id})`);
  console.log(`   Orchestrator: 🧠 Atlas`);
  console.log(`   Budget Limit: $${(mission.budgetLimitCents / 100).toFixed(2)}`);
  console.log(`   DAG Steps: ${mission.steps.length}`);
  mission.steps.forEach((step, idx) => {
    console.log(`     Step ${idx + 1}: [${step.assignedAgentId.toUpperCase()}] ${step.title} (Deps: ${step.dependencies.join(', ') || 'none'})`);
  });

  // 2. Execute Mission DAG
  console.log('\n[Mission Execution] Starting autonomous DAG execution pipeline...');
  const result = await missionEngine.runMission(
    mission.id,
    fixtureWorkspaceId,
    (step, m) => {
      console.log(`   ➔ [${step.assignedAgentId.toUpperCase()}] Step status: ${step.status} | Spend: $${(m.currentSpendCents / 100).toFixed(2)}`);
    }
  );

  console.log('\n================================================================');
  console.log('📊 MISSION EXECUTION SUMMARY');
  console.log('================================================================');
  console.log(`Overall Result: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Final Status: ${result.mission.status}`);
  console.log(`Total Spend: $${(result.mission.currentSpendCents / 100).toFixed(2)} / Budget: $${(result.mission.budgetLimitCents / 100).toFixed(2)}`);

  // 3. Verify Dual-Currency Ledger Transactions
  const txs = missionEngine.getTransactions(mission.id);
  console.log(`\n💰 Ledger CFO Engine: ${txs.length} transaction(s) recorded for mission:`);
  txs.forEach((tx) => {
    console.log(`   - [${tx.transactionType}] $${(tx.amountCents / 100).toFixed(2)} | Tokens: ${tx.tokenCount?.toLocaleString()} | Agent: ${tx.agentId} | Status: ${tx.status}`);
  });

  if (!result.success) {
    throw new Error(`Mission execution failed: ${result.error}`);
  }

  if (txs.length === 0) {
    throw new Error('Ledger failed to record token cost transactions!');
  }

  console.log('\n🏛️ MISSION ENGINE & WORKFORCE DAG PIPELINE VERIFIED WITH 100% PASS RATE!\n');
}

testMissionEngine().catch((err) => {
  console.error('Fatal mission engine test error:', err);
  process.exit(1);
});
