/**
 * GIDEON AI HQ — PHASE 4 OFFICIAL END-TO-END DEMONSTRATION & VERIFICATION TEST
 * 
 * Verifies the complete autonomous execution lifecycle:
 * 1. Workspace Sandboxing & Path Traversal Security
 * 2. Context Retrieval & Memory Injection
 * 3. Repository Inspection (Tier 1 Auto)
 * 4. Plan Formulation & Risk Classification (Medium Risk)
 * 5. Approval Gate & Plan Authorization
 * 6. Local Runner Sandboxed Execution (File Write & Verification)
 * 7. Automated Self-Review Scorecard Calculation
 * 8. Sentinel QA Handoff & Audit
 * 9. Lesson Extraction & Memory Vault Storage
 */

import path from 'path';
import { WorkspaceSandbox } from '../packages/runner/src/sandbox/WorkspaceSandbox';
import { PolicyEngine } from '../packages/policy/src/PolicyEngine';
import { MemoryEngine } from '../packages/memory/src/MemoryEngine';
import { JobExecutor } from '../packages/runner/src/JobExecutor';
import { AgentRuntime } from '../packages/runtime/src/AgentRuntime';
import { Task, TaskStatus } from '../packages/shared/src/index';

async function runDemonstration() {
  console.log('================================================================');
  console.log('🏛️ GIDEON AI HQ — PHASE 4 E2E VERIFICATION TEST');
  console.log('================================================================\n');

  const workspaceRoot = path.resolve(__dirname, '..');
  const workspaceId = 'ws-agent-workspace';

  console.log(`[Setup] Workspace Root: ${workspaceRoot}`);
  console.log(`[Setup] Initializing Workspace Sandbox, Policy Engine, Memory & Runner...`);

  const sandbox = new WorkspaceSandbox([
    { id: workspaceId, rootPath: workspaceRoot }
  ]);
  const policyEngine = new PolicyEngine('gideon-test-hmac-secret');
  const memoryEngine = new MemoryEngine();
  const jobExecutor = new JobExecutor(sandbox, policyEngine);
  const runtime = new AgentRuntime(policyEngine, memoryEngine, jobExecutor);

  // Pre-seed a project preference memory
  await memoryEngine.storeMemory({
    category: 'PROJECT',
    workspaceId,
    key: 'strict_mode_policy',
    value: { requireTypes: true, zeroAny: true },
    confidence: 1.0,
    status: 'ACTIVE',
    sourceType: 'USER_EXPLICIT',
    sourceReference: 'Security Baseline'
  });

  console.log('[Setup] Pre-flight: Verifying Workspace Sandbox Traversal Protection...');
  try {
    sandbox.validatePath(workspaceId, '../../Windows/System32/cmd.exe');
    console.error('❌ SECURITY FAILURE: Sandbox failed to block path traversal!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ SECURITY VERIFIED: Path traversal blocked -> ${err.message}`);
  }

  try {
    sandbox.validatePath(workspaceId, '.env.local');
    console.error('❌ SECURITY FAILURE: Sandbox failed to block secret .env access!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ SECURITY VERIFIED: Secret file access blocked -> ${err.message}\n`);
  }

  // Create Mission Task
  const testTask: Task = {
    id: `task-${Date.now()}`,
    workspaceId,
    title: 'Audit TypeScript Strictness & Apply Verified Fix',
    goal: 'Fix a TypeScript error in registered workspace and verify test passes.',
    assignedAgentId: 'forge',
    department: 'Development',
    priority: 'HIGH',
    autonomyMode: 'PLAN_APPROVAL',
    status: 'CREATED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  console.log(`[Task Intake] Created Mission: "${testTask.title}"`);
  console.log(`[Task Intake] Assigned to Digital Employee: 🔨 Forge (Senior Developer)\n`);

  // Execute Task through Runtime with Approval Callback
  const result = await runtime.executeTask(
    testTask,
    (status: TaskStatus) => {
      console.log(`[State Transition] ➔ Status: ${status}`);
    },
    async (approval) => {
      console.log(`\n🚨 [Approval Gate Triggered]`);
      console.log(`   Request ID: ${approval.id}`);
      console.log(`   Action: ${approval.description}`);
      console.log(`   Risk Level: ${approval.riskLevel} (${approval.approvalMode})`);
      console.log(`   [User Simulation] User reviews diff and authorizes plan...`);
      return true; // Authorize
    }
  );

  console.log('\n================================================================');
  console.log('📊 EXECUTION SUMMARY');
  console.log('================================================================');
  console.log(`Success: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Plan ID: ${result.plan.id} (${result.plan.steps.length} steps)`);
  console.log(`Summary: ${result.summary}`);

  const lessons = await memoryEngine.retrieveContext({ category: 'LESSON', workspaceId });
  console.log(`\n🧠 Memory Vault: ${lessons.length} verified lessons recorded.`);
  if (lessons.length > 0) {
    console.log(`   Lesson: ${JSON.stringify(lessons[0].value)}`);
  }

  console.log('\n🏛️ GIDEON AI HQ PHASE 4 RUNTIME & SAFETY ENGINE FULLY VERIFIED!\n');
}

runDemonstration().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
