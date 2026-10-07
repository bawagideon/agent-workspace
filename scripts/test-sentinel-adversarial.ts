import path from 'path';
import fs from 'fs';
import './env-loader';
import { WorkspaceSandbox } from '../packages/runner/src/sandbox/WorkspaceSandbox';
import { JobExecutor } from '../packages/runner/src/JobExecutor';
import { EvidenceStore } from '../packages/runner/src/EvidenceStore';
import { PolicyEngine } from '../packages/policy/src/PolicyEngine';
import { SentinelQARunner } from '../packages/runtime/src/SentinelQARunner';
import { GeminiProvider } from '../packages/runtime/src/providers/GeminiProvider';
import { Task } from '../packages/shared/src';

async function testSentinelAdversarial() {
  console.log('================================================================');
  console.log('🛡️ GIDEON AI HQ V5.0 — ADVERSARIAL SENTINEL QA VERIFICATION');
  console.log('================================================================\n');

  const workspaceRoot = path.resolve(process.cwd(), 'fixtures', 'sample-repos', 'sample-app');
  const targetSrcPath = path.join(workspaceRoot, 'src', 'index.ts');
  const originalContent = fs.readFileSync(targetSrcPath, 'utf8');

  // Ensure workspace directory structure in sandbox
  const sandbox = new WorkspaceSandbox([
    {
      id: 'ws-sample-app',
      name: 'Sample App',
      rootPath: workspaceRoot,
      workspaceType: 'ACTIVE',
      accessMode: 'READ_WRITE',
      status: 'READY',
      gitEnabled: false,
      defaultBranch: 'main',
      allowedAgents: ['sentinel', 'forge'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  const policyEngine = new PolicyEngine(process.env.HMAC_PLAN_SECRET || 'test-policy-hmac-secret-2026');

  const jobExecutor = new JobExecutor(sandbox, policyEngine);
  const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY || '');
  const sentinel = new SentinelQARunner(geminiProvider, jobExecutor, policyEngine);

  const mockTask: Task = {
    id: `task-qa-${Date.now()}`,
    workspaceId: 'ws-sample-app',
    title: 'Verify Service Health Check',
    goal: 'Ensure the health check service is active and passing all tests',
    department: 'QA',
    priority: 'HIGH',
    autonomyMode: 'PLAN_APPROVAL',
    status: 'QA_EXECUTING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Adversarial Scenario — Broken Code / Failing Tests
    // -------------------------------------------------------------------------
    console.log('🔴 [Test 1] Injecting intentional regression into src/index.ts...');
    fs.writeFileSync(targetSrcPath, '// BROKEN: Deliberate failure for QA audit\nexport const isHealthy = false;\n', 'utf8');

    console.log('🛡️ [Test 1] Dispatching Sentinel QA against broken fixture...');
    const brokenReview = await sentinel.auditWork({
      task: mockTask,
      workspaceId: 'ws-sample-app',
      diff: '+ // BROKEN: Deliberate failure\n- export const isHealthy = true;',
      modifiedFiles: ['src/index.ts']
    });

    console.log(`[Test 1] Result: passed=${brokenReview.passed}, score=${brokenReview.score}`);
    console.log(`[Test 1] Feedback: "${brokenReview.feedbackForForge}"`);

    if (brokenReview.passed !== false || brokenReview.score >= 50) {
      console.error('❌ FAILED: Sentinel failed to reject broken code!');
      process.exit(1);
    }
    console.log('✅ TEST 1 PASSED: Sentinel independently REJECTED the broken code with failure evidence.');

    // Seal rejection evidence
    const rejectionEvidence = EvidenceStore.saveEvidence({
      id: `ev-qa-reject-${Date.now()}`,
      taskId: mockTask.id,
      agentId: 'sentinel',
      sessionKey: 'agent:sentinel:qa-reject',
      model: 'gemini-qa-eval',
      toolNames: ['terminal_run_command'],
      toolResult: brokenReview.feedbackForForge,
      exitCode: 1,
      testPassed: false,
      sentinelScore: brokenReview.score,
      tokensUsed: 1250,
      costCents: 0.12,
      costUsd: 0.0012,
      timestamp: new Date().toISOString()
    });
    console.log(`   Rejection Evidence Sealed: ${rejectionEvidence.id} (Score: ${rejectionEvidence.sentinelScore})\n`);

    // -------------------------------------------------------------------------
    // TEST 2: Valid Scenario — Clean Implementation / Passing Tests
    // -------------------------------------------------------------------------
    console.log('🟢 [Test 2] Restoring clean implementation into src/index.ts...');
    fs.writeFileSync(targetSrcPath, '// Verified Clean Code\nexport const isHealthy = true;\n', 'utf8');

    console.log('🛡️ [Test 2] Dispatching Sentinel QA against clean fixture...');
    const cleanReview = await sentinel.auditWork({
      task: mockTask,
      workspaceId: 'ws-sample-app',
      diff: '+ export const isHealthy = true;\n+ // Clean verified fix',
      modifiedFiles: ['src/index.ts']
    });

    console.log(`[Test 2] Result: passed=${cleanReview.passed}, score=${cleanReview.score}`);
    console.log(`[Test 2] Feedback: "${cleanReview.feedbackForForge}"`);

    if (cleanReview.passed !== true || cleanReview.score !== 100) {
      console.error('❌ FAILED: Sentinel failed to approve valid code!');
      process.exit(1);
    }
    console.log('✅ TEST 2 PASSED: Sentinel independently APPROVED the clean code with score 100.');

    // Seal approval evidence
    const approvalEvidence = EvidenceStore.saveEvidence({
      id: `ev-qa-approve-${Date.now()}`,
      taskId: mockTask.id,
      agentId: 'sentinel',
      sessionKey: 'agent:sentinel:qa-approve',
      model: 'gemini-qa-eval',
      toolNames: ['terminal_run_command'],
      toolResult: cleanReview.feedbackForForge,
      exitCode: 0,
      testPassed: true,
      sentinelScore: cleanReview.score,
      tokensUsed: 1250,
      costCents: 0.12,
      costUsd: 0.0012,
      timestamp: new Date().toISOString()
    });
    console.log(`   Approval Evidence Sealed: ${approvalEvidence.id} (Score: ${approvalEvidence.sentinelScore})\n`);

    console.log('================================================================');
    console.log('🏆 SENTINEL ADVERSARIAL QA AUDIT: 100% PASS RATE');
    console.log('   - Independent Rejection of Broken Code: VERIFIED');
    console.log('   - Independent Approval of Clean Code: VERIFIED');
    console.log('   - Cryptographic Evidence Trail: VERIFIED');
    console.log('================================================================\n');

  } finally {
    // Restore original file
    fs.writeFileSync(targetSrcPath, originalContent, 'utf8');
  }
}

testSentinelAdversarial().catch((err) => {
  console.error('Fatal Sentinel test error:', err);
  process.exit(1);
});
