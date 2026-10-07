import { AgentRegistry, AgentFactory } from '../packages/agents/src/index';

async function testWorkforceFactory() {
  console.log('================================================================');
  console.log('🏛️ GIDEON AI HQ — WORKFORCE REGISTRY & AGENT FACTORY TEST');
  console.log('================================================================\n');

  // 1. Verify Core Tier-1 & Tier-2 Agents
  console.log('[Registry] Checking core registered agents...');
  const allAgents = AgentRegistry.getAllAgents();
  console.log(`✅ ${allAgents.length} agents registered in AgentRegistry:`);
  allAgents.forEach((a) => {
    console.log(`   - ${a.avatar || '🤖'} ${a.name} (${a.id}) | Role: ${a.role} | Department: ${a.department}`);
  });

  const expectedAgents = ['atlas', 'ledger', 'forge', 'sentinel', 'release', 'scout'];
  for (const expected of expectedAgents) {
    const entry = AgentRegistry.get(expected);
    if (!entry) {
      throw new Error(`Required agent '${expected}' missing from registry!`);
    }
  }
  console.log('✅ All 6 Tier-1 and Tier-2 agents registered successfully.');

  // 2. Test AgentFactory Creating a Tier-2 Specialist
  console.log('\n[Factory] Creating custom specialist via AgentFactory...');
  const customConstitution = AgentFactory.createAgent({
    id: 'researcher',
    name: 'Researcher',
    tier: 2,
    role: 'Deep Research Specialist',
    department: 'Intelligence',
    mission: 'Perform literature reviews and technical research.',
    principles: ['Never modify code.', 'Deliver verified citations.'],
    allowedTools: ['openclaw_tool_invoke', 'fs_read_file', 'fs_search'],
    deniedTools: ['fs_write_file', 'git_commit'],
    budgetLimitCents: 500.00
  });

  console.log(`✅ Specialist '${customConstitution.name}' created with Tier ${customConstitution.tier}.`);
  console.log(`   Budget Limit: $${(customConstitution.budgetLimitCents / 100).toFixed(2)}`);
  console.log(`   Can Spawn Subagents: ${customConstitution.subagentPolicy?.canSpawn}`);
  console.log(`   Allowed Tools: ${customConstitution.allowedTools.join(', ')}`);

  if (customConstitution.subagentPolicy?.canSpawn !== false) {
    throw new Error('Security Violation: Tier-2 specialist must not have subagent spawning privileges!');
  }

  // 3. Test AgentFactory Creating an Ephemeral Tier-3 Worker
  console.log('\n[Factory] Spawning Tier-3 Ephemeral Worker...');
  const workerConstitution = AgentFactory.createEphemeralWorker(
    'forge',
    'Run unit test suite on isolated branch',
    ['terminal_run_command', 'fs_read_file'],
    50.00 // $0.50 budget cap
  );

  console.log(`✅ Ephemeral Worker spawned: ID '${workerConstitution.id}'`);
  console.log(`   Tier: ${workerConstitution.tier}`);
  console.log(`   Budget Cap: $${(workerConstitution.budgetLimitCents / 100).toFixed(2)}`);
  console.log(`   TTL Seconds: ${workerConstitution.ephemeralConfig?.ttlSeconds}`);
  console.log(`   Destroy On Complete: ${workerConstitution.ephemeralConfig?.destroyOnComplete}`);

  if (workerConstitution.tier !== 3) {
    throw new Error('Worker tier must be 3 (Ephemeral)!');
  }
  if (!workerConstitution.ephemeralConfig?.destroyOnComplete) {
    throw new Error('Ephemeral worker must destroyOnComplete!');
  }

  console.log('\n🏛️ WORKFORCE REGISTRY & AGENT FACTORY VERIFIED WITH 100% PASS RATE!\n');
}

testWorkforceFactory().catch((err) => {
  console.error('Fatal workforce test error:', err);
  process.exit(1);
});
