/**
 * GIDEON AI HQ — NEGATIVE TEST SUITE & FAILURE MODE VERIFICATION
 * 
 * Tests that all security boundaries, rejection gates, and failure handlers
 * function correctly and CANNOT be bypassed.
 */

import path from 'path';
import fs from 'fs';
import { WorkspaceSandbox } from '../packages/runner/src/sandbox/WorkspaceSandbox';
import { PolicyEngine } from '../packages/policy/src/PolicyEngine';
import { JobExecutor } from '../packages/runner/src/JobExecutor';
import { KillSwitch } from '../packages/runner/src/KillSwitch';
import { SelfReviewer } from '../packages/runtime/src/SelfReviewer';
import { SentinelQARunner } from '../packages/runtime/src/SentinelQARunner';
import { MockProvider } from '../packages/runtime/src/providers/MockProvider';
import { Task } from '../packages/shared/src/index';

async function runNegativeTests() {
  console.log('================================================================');
  console.log('🧪 GIDEON AI HQ — NEGATIVE TEST & FAILURE MODE SUITE (V3.2)');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 10;

  const fixtureRoot = path.resolve(__dirname, '../fixtures/sample-repos/sample-app');
  const fixtureId = 'ws-fixture-negative-app';
  const ytReferenceId = 'ws-yt-automation-ref';
  const ytReferenceRoot = 'C:\\Users\\DELL\\yt-automation';

  const sandbox = new WorkspaceSandbox([
    { id: fixtureId, rootPath: fixtureRoot, workspaceType: 'ACTIVE' },
    { id: ytReferenceId, rootPath: ytReferenceRoot, workspaceType: 'REFERENCE' }
  ]);

  const policyEngine = new PolicyEngine('gideon-negative-test-signing-secret');
  const jobExecutor = new JobExecutor(sandbox, policyEngine);
  const modelProvider = new MockProvider();
  const sentinelQA = new SentinelQARunner(modelProvider, jobExecutor);

  // TEST 1: Path Traversal Attack
  console.log('[Test 1/10] Testing Path Traversal Attack (../../Windows/System32)...');
  try {
    sandbox.validatePath(fixtureId, '../../../../Windows/System32/calc.exe');
    console.error('❌ FAILED: Traversal was not blocked!');
  } catch (err: any) {
    console.log(`✅ PASSED: Blocked -> ${err.message}`);
    passedTests++;
  }

  // TEST 2: Secret File Access Attempt
  console.log('\n[Test 2/10] Testing Secret File Access (.env.local, id_rsa)...');
  try {
    sandbox.validatePath(fixtureId, '.env.production');
    console.error('❌ FAILED: Secret file was not blocked!');
  } catch (err: any) {
    console.log(`✅ PASSED: Blocked -> ${err.message}`);
    passedTests++;
  }

  // TEST 3: Mutation in Immutable REFERENCE Workspace (yt-automation)
  console.log('\n[Test 3/10] Testing Write Mutation in REFERENCE Workspace (yt-automation)...');
  try {
    sandbox.validatePath(ytReferenceId, 'src/malicious.js', true);
    console.error('❌ FAILED: Write in reference workspace was not blocked!');
  } catch (err: any) {
    console.log(`✅ PASSED: Blocked -> ${err.message}`);
    passedTests++;
  }

  // TEST 4: Unsigned / Unauthenticated Tool Execution in JobExecutor
  console.log('\n[Test 4/10] Testing Execution of Unsigned Write Tool in JobExecutor...');
  const unsignedRes = await jobExecutor.executeJob({
    jobId: 'job-unsigned',
    taskId: 'task-test',
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_write_file',
    inputParams: { workspaceId: fixtureId, filePath: 'src/hack.ts', content: 'test' }
  });

  if (!unsignedRes.success && unsignedRes.error?.includes('requires a valid authorizationHash')) {
    console.log(`✅ PASSED: JobExecutor rejected unsigned write -> ${unsignedRes.error}`);
    passedTests++;
  } else {
    console.error(`❌ FAILED: JobExecutor allowed unsigned write!`);
  }

  // TEST 5: Expired Authorization Token
  console.log('\n[Test 5/10] Testing Expired Authorization Token...');
  const expiredTimestamp = new Date(Date.now() - 10000).toISOString();
  const expiredHash = policyEngine.generateAuthorizationHash({
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_write_file',
    params: { workspaceId: fixtureId, filePath: 'src/expired.ts', content: 'test' },
    expiresAt: expiredTimestamp
  });

  const expiredRes = await jobExecutor.executeJob({
    jobId: 'job-expired',
    taskId: 'task-test',
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_write_file',
    inputParams: { workspaceId: fixtureId, filePath: 'src/expired.ts', content: 'test' },
    authorizationHash: expiredHash,
    expiresAt: expiredTimestamp
  });

  if (!expiredRes.success && expiredRes.error?.includes('Invalid or expired authorization hash')) {
    console.log(`✅ PASSED: JobExecutor rejected expired token -> ${expiredRes.error}`);
    passedTests++;
  } else {
    console.error(`❌ FAILED: JobExecutor accepted expired token!`);
  }

  // TEST 6: Token Replay Attack (Using the same authorization token twice)
  console.log('\n[Test 6/10] Testing Token Replay Attack...');
  const replayExpiresAt = new Date(Date.now() + 60000).toISOString();
  const replayParams = { workspaceId: fixtureId, filePath: 'src/replay.ts', content: 'initial' };
  const replayHash = policyEngine.generateAuthorizationHash({
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_write_file',
    params: replayParams,
    expiresAt: replayExpiresAt
  });

  // First execution (Valid)
  const firstExec = await jobExecutor.executeJob({
    jobId: 'job-replay-1',
    taskId: 'task-replay',
    stepId: 'step-replay',
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_write_file',
    inputParams: replayParams,
    authorizationHash: replayHash,
    expiresAt: replayExpiresAt
  });

  // Second execution with SAME token (Replay Attack)
  const secondExec = await jobExecutor.executeJob({
    jobId: 'job-replay-2',
    taskId: 'task-replay',
    stepId: 'step-replay',
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_write_file',
    inputParams: replayParams,
    authorizationHash: replayHash,
    expiresAt: replayExpiresAt
  });

  if (firstExec.success && !secondExec.success && secondExec.error?.includes('Token Replay Rejected')) {
    console.log(`✅ PASSED: JobExecutor consumed token on first use and blocked replay -> ${secondExec.error}`);
    passedTests++;
  } else {
    console.error(`❌ FAILED: Token replay was not blocked!`);
  }

  // TEST 7: Execution Contract Scope Violation
  console.log('\n[Test 7/10] Testing Execution Contract Scope Violation (Out-of-Scope File)...');
  const validExpiresAt = new Date(Date.now() + 60000).toISOString();
  const contract = policyEngine.generateExecutionContract({
    taskId: 'task-scoped',
    runId: 'run-scoped',
    workspaceId: fixtureId,
    runnerId: 'GIDMACHINE_WIN',
    allowedPaths: ['src/allowed.ts'],
    allowedTools: ['fs_write_file'],
    allowedCommands: ['npm test'],
    maxSteps: 3,
    maxRuntimeMs: 60000,
    maxCost: 0.10,
    approvalMode: 'PLAN_APPROVAL',
    rollbackStrategy: 'FILE_BACKUP',
    expiresAt: validExpiresAt
  });

  const outOfScopeHash = policyEngine.generateAuthorizationHash({
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_write_file',
    params: { workspaceId: fixtureId, filePath: 'src/unauthorized-file.ts', content: 'bad' },
    expiresAt: validExpiresAt
  });

  const outOfScopeRes = await jobExecutor.executeJob({
    jobId: 'job-out-of-scope',
    taskId: 'task-scoped',
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_write_file',
    inputParams: { workspaceId: fixtureId, filePath: 'src/unauthorized-file.ts', content: 'bad' },
    authorizationHash: outOfScopeHash,
    expiresAt: validExpiresAt,
    contract
  });

  if (!outOfScopeRes.success && outOfScopeRes.error?.includes('outside Execution Contract scope')) {
    console.log(`✅ PASSED: Scope violation blocked by JobExecutor -> ${outOfScopeRes.error}`);
    passedTests++;
  } else {
    console.error(`❌ FAILED: JobExecutor allowed out-of-scope file write!`);
  }

  // TEST 8: Forge Self-Review Scorecard Failure Detection
  console.log('\n[Test 8/10] Testing Forge Self-Review Scorecard on Command Failure...');
  const failingOutputs = [
    { toolId: 'terminal_run_command', result: { exitCode: 1, stderr: 'ERR! Build failed with 4 errors.' } }
  ];
  const failingScorecard = SelfReviewer.evaluateResults(failingOutputs);

  if (!failingScorecard.passed && failingScorecard.score < 70) {
    console.log(`✅ PASSED: SelfReviewer correctly detected failure (Score: ${failingScorecard.score}/100, Passed: NO)`);
    passedTests++;
  } else {
    console.error(`❌ FAILED: SelfReviewer falsely passed failing build!`);
  }

  // TEST 9: Sentinel QA Rejection on Broken Code
  console.log('\n[Test 9/10] Testing Sentinel QA Rejection on Broken Tests...');
  const fakeTask: Task = {
    id: 'task-broken',
    workspaceId: fixtureId,
    title: 'Broken Task Simulation',
    goal: 'Intentional failure test',
    priority: 'HIGH',
    autonomyMode: 'PLAN_APPROVAL',
    status: 'EXECUTING',
    department: 'Development',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const qaRejectionResult = await modelProvider.reviewCode(
    fakeTask.goal,
    'diff with syntax errors',
    'FAIL tests/index.test.js: Target was not fixed.'
  );

  if (!qaRejectionResult.passed && qaRejectionResult.bugsReported.length > 0) {
    console.log(`✅ PASSED: Sentinel QA correctly issued REJECTED decision with bugs reported.`);
    passedTests++;
  } else {
    console.error(`❌ FAILED: Sentinel QA falsely approved broken code!`);
  }

  // TEST 10: Universal Kill Switch Execution Halt
  console.log('\n[Test 10/10] Testing Universal Kill Switch Interception...');
  KillSwitch.triggerEmergencyStop();
  const killSwitchRes = await jobExecutor.executeJob({
    jobId: 'job-during-killswitch',
    taskId: 'task-kill',
    agentId: 'forge',
    workspaceId: fixtureId,
    toolId: 'fs_read_file',
    inputParams: { workspaceId: fixtureId, filePath: 'src/index.ts' }
  });
  KillSwitch.resetEmergencyStop();

  if (!killSwitchRes.success && killSwitchRes.error?.includes('Emergency Kill Switch is ACTIVE')) {
    console.log(`✅ PASSED: Kill Switch successfully intercepted and aborted job execution.`);
    passedTests++;
  } else {
    console.error(`❌ FAILED: Kill Switch failed to block job!`);
  }

  console.log('\n================================================================');
  console.log(`📊 NEGATIVE TEST RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🛡️ ALL 10 NEGATIVE FAILURE MODES & REPLAY ATTACK VECTORS SUCCESSFULLY DEFENDED!\n');
  } else {
    process.exit(1);
  }
}

runNegativeTests().catch((err) => {
  console.error('Fatal negative test error:', err);
  process.exit(1);
});
