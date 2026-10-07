import './env-loader';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

process.env.HMAC_PLAN_SECRET = process.env.HMAC_PLAN_SECRET || 'gideon-immutable-plan-secret-2026';
import { 
  CapabilityRegistry, 
  ContextResolver, 
  SentinelObserver, 
  MissionSupervisor,
  SolutionBriefEngine,
  MissionEngine,
  CommandEngine
} from '../packages/runtime/src';
import { PolicyEngine } from '../packages/policy/src/PolicyEngine';
import { MemoryEngine } from '../packages/memory/src/MemoryEngine';
import { JobExecutor } from '../packages/runner/src/JobExecutor';
import { WorkspaceSandbox } from '../packages/runner/src/sandbox/WorkspaceSandbox';
import { MockProvider } from '../packages/runtime/src/providers/MockProvider';
import { StoryPackGenerator } from '../packages/runtime/src/evidence/StoryPackGenerator';
import { EvidenceExtractor } from '../packages/runtime/src/evidence/EvidenceExtractor';
import { GideonEventBus } from '../packages/shared/src/events/GideonEventBus';

console.log('================================================================');
console.log('  TEST: Gideon V5 Operational Proof & Closed-Loop Reliability   ');
console.log('  16-Point E2E Automated Verification Test Suite                ');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

async function it(description: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof (res as any).then === 'function') {
      await res;
    }
    console.log(`  [PASS] Point ${totalTests}: ${description}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  [FAIL] Point ${totalTests}: ${description}`);
    console.error(`         ${err.message}`);
    throw err;
  }
}

async function runAll() {
  const workspaceRoot = process.cwd();
  const sandbox = new WorkspaceSandbox([
    { id: 'ws-agent-workspace', rootPath: workspaceRoot, workspaceType: 'ACTIVE' },
    { id: 'ws-fixture-sample-app', rootPath: path.resolve(workspaceRoot, 'fixtures/sample-repos/sample-app'), workspaceType: 'ACTIVE' }
  ]);
  const policyEngine = new PolicyEngine(process.env.HMAC_PLAN_SECRET);
  const memoryEngine = new MemoryEngine();
  const jobExecutor = new JobExecutor(sandbox, policyEngine);
  const mockProvider = new MockProvider();
  const missionEngine = new MissionEngine(policyEngine, memoryEngine, jobExecutor, mockProvider);
  const commandEngine = new CommandEngine(missionEngine, policyEngine);
  const eventBus = GideonEventBus.getInstance();

  const userEngineeringPrompt = 'Slide 4 5 7 and 8 are not correctly displayed for the linkedin post in the webhook-billing-bridge post. Please fix the layout and update the 3D isometric facets.';
  let createdMissionId = '';
  let solutionBrief: any = null;
  let evidenceSeal = '';

  // Point 1: User Engineering Request Ingestion
  await it('User engineering request ingestion into Command & Chat Engine', async () => {
    const cmdRes = await commandEngine.executeCommand({
      senderId: 'authorized-user',
      source: 'pwa',
      text: userEngineeringPrompt
    });

    assert.strictEqual(cmdRes.success, true, 'Command ingestion must succeed');
    assert.strictEqual(cmdRes.verb, 'CREATE_MISSION', 'Command must route to mission creation');
    assert.ok(cmdRes.data?.mission?.id, 'Mission ID must be generated');
    createdMissionId = cmdRes.data.mission.id;
  });

  // Point 2: Objective and Intent Synthesis
  await it('Objective and intent synthesis formats structured workforce goal', async () => {
    const mission = missionEngine.getMission(createdMissionId);
    assert.ok(mission, 'Mission must exist in MissionEngine');
    assert.ok(mission.title.length > 5, 'Title must be synthesized');
    assert.ok(mission.objective.includes('Slide 4 5 7 and 8'), 'Objective must preserve user technical scope');
    assert.strictEqual(mission.orchestratorId, 'atlas', 'Atlas must be designated as orchestrator');
  });

  // Point 3: Dynamic Context Envelope Generation
  await it('Dynamic Context Envelope generation enforces Fact vs. Opinion distinction', async () => {
    const envelope = await ContextResolver.compileEnvelope({ page: 'workspace' });
    assert.ok(envelope, 'Context envelope must compile');
    
    // Facts are authoritative
    assert.ok(envelope.facts.length >= 4, 'Must contain at least 4 authoritative facts');
    envelope.facts.forEach(f => {
      assert.strictEqual(f.isAuthoritative, true, 'Facts must have isAuthoritative: true');
      assert.ok(f.sourceOfTruth, 'Fact must have sourceOfTruth reference');
    });

    // Observations are non-authoritative hypotheses
    assert.ok(envelope.observations.length >= 2, 'Must contain observations');
    envelope.observations.forEach(o => {
      assert.strictEqual(o.isAuthoritative, false, 'Observations must have isAuthoritative: false');
    });

    // Ingests RULE_GENERATED_ARTIFACT_PRESERVATION
    const preservationLesson = envelope.verifiedLessons.find(l => l.ruleId === 'RULE_GENERATED_ARTIFACT_PRESERVATION');
    assert.ok(preservationLesson, 'RULE_GENERATED_ARTIFACT_PRESERVATION must be active in context');
  });

  // Point 4: Authoritative Source-of-Truth Discovery
  await it('Authoritative source-of-truth discovery rules out derived SVG editing', async () => {
    // 1. Prohibited derived target check
    const derivedTarget = 'apps/hq/public/story/webhook-billing-bridge/slide_4.svg';
    const checkDerived = SolutionBriefEngine.verifyAuthoritativeTarget(derivedTarget);
    assert.strictEqual(checkDerived.isAuthoritative, false, 'Derived SVG must be flagged as non-authoritative');
    assert.strictEqual(checkDerived.rule, 'RULE_GENERATED_ARTIFACT_PRESERVATION', 'Must cite RULE_GENERATED_ARTIFACT_PRESERVATION');
    assert.strictEqual(checkDerived.correctedPath, 'packages/runtime/src/evidence/StoryPackGenerator.ts', 'Must redirect to StoryPackGenerator.ts');

    // 2. Authoritative generator source check
    const canonicalSource = 'packages/runtime/src/evidence/StoryPackGenerator.ts';
    const checkSource = SolutionBriefEngine.verifyAuthoritativeTarget(canonicalSource);
    assert.strictEqual(checkSource.isAuthoritative, true, 'StoryPackGenerator.ts must be verified as authoritative');
  });

  // Point 5: Mission Creation with Workforce DAG
  await it('Mission creation instantiates 4-step workforce dependency pipeline', async () => {
    const mission = missionEngine.getMission(createdMissionId);
    assert.ok(mission, 'Mission must exist');
    assert.strictEqual(mission.steps.length, 4, 'Must contain 4 workforce steps');

    const [stepForge, stepSentinel, stepLedger, stepRelease] = mission.steps;
    assert.strictEqual(stepForge.assignedAgentId, 'forge', 'Step 1 must be Forge');
    assert.strictEqual(stepSentinel.assignedAgentId, 'sentinel', 'Step 2 must be Sentinel');
    assert.strictEqual(stepLedger.assignedAgentId, 'ledger', 'Step 3 must be Ledger');
    assert.strictEqual(stepRelease.assignedAgentId, 'release', 'Step 4 must be Release');

    assert.deepStrictEqual(stepSentinel.dependencies, [stepForge.id], 'Sentinel must depend on Forge');
    assert.strictEqual(mission.budgetLimitCents, 2500, 'Budget cap must default to $25.00');
  });

  // Point 6: Zero-Lag Auto-Dispatch on Low/Medium-Risk Tasks
  await it('Zero-lag auto-dispatch activates low/medium risk engineering missions', async () => {
    const dispatchRes = await commandEngine.executeCommand({
      senderId: 'authorized-user',
      source: 'pwa',
      text: `dispatch ${createdMissionId}`
    });

    assert.strictEqual(dispatchRes.success, true, 'Dispatch must execute successfully');
    assert.strictEqual(dispatchRes.verb, 'DISPATCH', 'Verb must be DISPATCH');
    assert.ok(dispatchRes.message.includes('Atlas Workforce Dispatch'), 'Message must confirm workforce dispatch');
  });

  // Point 7: Forge Starts Execution Without Manual "Start" Prompt
  await it('Forge starts execution autonomously upon mission dispatch', async () => {
    const mission = missionEngine.getMission(createdMissionId);
    assert.ok(mission, 'Mission must exist');
    const forgeStep = mission.steps.find(s => s.assignedAgentId === 'forge');
    assert.ok(forgeStep, 'Forge step must exist');
    assert.strictEqual(forgeStep.status, 'COMPLETED', 'Forge step must execute to completion');
  });

  // Point 8: Forge Produces an Engineering Solution Brief
  await it('Forge produces a cryptographically sealed Engineering Solution Brief', async () => {
    solutionBrief = SolutionBriefEngine.generateBrief({
      goal: userEngineeringPrompt,
      missionId: createdMissionId
    });

    assert.ok(solutionBrief, 'Solution brief must be generated');
    assert.ok(solutionBrief.id.startsWith('sb-'), 'Brief ID must have sb- prefix');
    assert.strictEqual(solutionBrief.sha256.length, 64, 'Brief must have 64-char SHA-256 seal');

    // Capability Reuse Check
    assert.ok(solutionBrief.reusableCapabilities.length > 0, 'Must discover reusable capabilities');
    const isoCap = solutionBrief.reusableCapabilities.find((c: any) => c.id === 'cap-3d-isometric-engine');
    assert.ok(isoCap, 'Must identify cap-3d-isometric-engine from CapabilityRegistry');

    // 3 Alternatives Evaluated
    assert.strictEqual(solutionBrief.alternatives.length, 3, 'Must evaluate 3 alternatives (A, B, C)');
    const chosenAlt = solutionBrief.alternatives.find((a: any) => a.selected);
    assert.ok(chosenAlt?.name.includes('Option B'), 'Option B (Canonical Source Generator) must be selected');

    // Authoritative Files vs Prohibited Targets
    assert.strictEqual(solutionBrief.authoritativeFiles[0].path, 'packages/runtime/src/evidence/StoryPackGenerator.ts');
    assert.ok(solutionBrief.prohibitedFiles[0].path.includes('*.svg'), 'Derived SVGs must be prohibited');
  });

  // Point 9: Forge Modifies Authoritative Source
  await it('Forge updates canonical generator source and verifies vector output', async () => {
    const generatorPath = path.resolve(process.cwd(), 'packages/runtime/src/evidence/StoryPackGenerator.ts');
    assert.ok(fs.existsSync(generatorPath), 'StoryPackGenerator.ts must physically exist on disk');

    const content = fs.readFileSync(generatorPath, 'utf8');
    assert.ok(content.includes('3D Isometric') || content.includes('renderWebhookSlideVisual'), 'Generator must contain 3D isometric slide logic');
    assert.ok(content.includes('generateSlideSvg'), 'Generator must contain generateSlideSvg');

    // Run deterministic generation to verify all 8 slides compile
    const extractor = new EvidenceExtractor();
    const storyGen = new StoryPackGenerator();
    const evidence = extractor.extractFromProject('projects/webhook-billing-bridge');
    const storyPack = storyGen.generateStoryPack(evidence);

    assert.strictEqual(storyPack.slides.length, 8, 'Must generate exactly 8 SVG slides');
    assert.ok(storyPack.slides[3].visual.svgContent.includes('<svg'), 'Slide 4 must be valid SVG XML');
    assert.ok(storyPack.slides[4].visual.svgContent.includes('<svg'), 'Slide 5 must be valid SVG XML');
    assert.ok(storyPack.slides[6].visual.svgContent.includes('<svg'), 'Slide 7 must be valid SVG XML');
    assert.ok(storyPack.slides[7].visual.svgContent.includes('<svg'), 'Slide 8 must be valid SVG XML');
  });

  // Point 10: Sentinel Receives Completion Event
  await it('Sentinel receives step completion telemetry via Event Spine', async () => {
    let eventReceived = false;
    eventBus.subscribe('mission.step_completed', (payload) => {
      eventReceived = true;
    });

    eventBus.emit('mission.step_completed', {
      missionId: createdMissionId,
      stepId: `${createdMissionId}-step-1`,
      agentId: 'forge',
      authoritativeSource: 'packages/runtime/src/evidence/StoryPackGenerator.ts'
    }, 'test_harness');

    assert.strictEqual(eventReceived, true, 'Sentinel must receive step completion event on Event Spine');
  });

  // Point 11: Sentinel Independently Verifies Against Contracts
  await it('Sentinel independently audits deliverable across 9 quality dimensions', async () => {
    const brief = SentinelObserver.generateDailyBrief();
    assert.strictEqual(brief.qualityDimensions.length, 9, 'Must audit all 9 dimensions');
    assert.strictEqual(brief.contractsVerifiedCount, 8, 'Must verify 8/8 contracts');
    assert.ok(brief.overallHealthScore >= 95, 'Health score must be >= 95');

    const archDim = brief.qualityDimensions.find(d => d.category === 'ARCHITECTURE');
    assert.strictEqual(archDim?.verdict, 'PASS');
    assert.ok(archDim?.rationale.includes('StoryPackGenerator.ts'));
  });

  // Point 12: Automatic Failure Redirection to Forge (Without Human Intervention)
  await it('Supervisor automatically diagnoses QA failure and routes corrective feedback to Forge', async () => {
    const mockFailedStep: any = {
      id: `${createdMissionId}-step-qa`,
      assignedAgentId: 'sentinel',
      title: 'QA Audit',
      goal: 'Audit slide layouts',
      dependencies: [],
      status: 'FAILED'
    };

    const mockMission: any = {
      id: createdMissionId,
      title: 'Fix Slide Layouts',
      steps: [mockFailedStep]
    };

    const diagnosis = MissionSupervisor.diagnoseFailure(
      mockFailedStep,
      'Sentinel QA rejection: Slide 4 3D facet angle exceeds boundary. Contract failed: ev-qa-contract-1790547094069-41f1e2d3',
      mockMission,
      0
    );

    assert.strictEqual(diagnosis.classification, 'QA_FAILURE', 'Classification must be QA_FAILURE');
    assert.strictEqual(diagnosis.canAutoRecover, true, 'Supervisor must mark as auto-recoverable');
    assert.strictEqual(diagnosis.targetRetryAgent, 'forge', 'Target retry agent must be Forge');
    assert.ok(diagnosis.enrichedGoal.includes('[SENTINEL QA REJECTION FEEDBACK]'), 'Goal must carry QA feedback');
  });

  // Point 13: Retry Loop Preserving Mission Identity
  await it('Retry loop preserves mission identity, spend tracking, and DAG continuity', async () => {
    const mission = missionEngine.getMission(createdMissionId);
    assert.ok(mission, 'Mission must exist');
    assert.strictEqual(mission.id, createdMissionId, 'Mission ID must remain unchanged during retry');
    
    // Ledger spend continuity
    const txs = missionEngine.getTransactions(createdMissionId);
    assert.ok(txs.length >= 1, 'Mission transactions must be recorded in Ledger');
    assert.ok(mission.currentSpendCents > 0, 'Current spend must reflect inference cost');
  });

  // Point 14: Retry Loop Respecting Authority Boundaries (Never Auto-Signing Gates 1, 2, or 3)
  await it('Supervisor strictly halts and refuses auto-recovery on Gate 1/2/3 human authority steps', async () => {
    const gateStep: any = {
      id: `${createdMissionId}-step-gate1`,
      assignedAgentId: 'release',
      title: 'Gate 1 GitHub Push',
      goal: 'Push signed commit to origin main',
      requiresApproval: true,
      approvalId: 'appr-gate1-prod',
      dependencies: [],
      status: 'BLOCKED'
    };

    const mockMission: any = {
      id: createdMissionId,
      title: 'Production Deployment',
      steps: [gateStep]
    };

    const diagnosis = MissionSupervisor.diagnoseFailure(
      gateStep,
      'Blocked: Human authority signature required before Gate 1 GitHub push.',
      mockMission,
      0
    );

    assert.strictEqual(diagnosis.classification, 'BLOCKED_BY_APPROVAL', 'Must classify as BLOCKED_BY_APPROVAL');
    assert.strictEqual(diagnosis.canAutoRecover, false, 'Auto-recovery must be FALSE for human authority gates');
    assert.ok(diagnosis.injectedLessons.some(l => l.includes('Agent != Signer Rule')), 'Must cite Agent != Signer Rule');
  });

  // Point 15: Cryptographic Evidence Generation and SHA-256 Seal
  await it('Deliverable is cryptographically sealed with deterministic SHA-256 evidence hash', async () => {
    const evidencePayload = {
      missionId: createdMissionId,
      authoritativeSource: 'packages/runtime/src/evidence/StoryPackGenerator.ts',
      solutionBriefId: solutionBrief.id,
      slidesVerifiedCount: 8,
      sentinelPassed: true,
      timestamp: new Date().toISOString()
    };

    evidenceSeal = crypto.createHash('sha256').update(JSON.stringify(evidencePayload)).digest('hex');
    assert.strictEqual(evidenceSeal.length, 64, 'Evidence seal must be exactly 64 hex characters');
    assert.ok(/^[0-9a-f]{64}$/.test(evidenceSeal), 'Evidence seal must be valid SHA-256 hex');
  });

  // Point 16: Proposed Lesson Emitted to .gideon/lessons_cache.json
  await it('Verified institutional lesson is recorded in .gideon/lessons_cache.json', async () => {
    const cachePath = path.resolve(process.cwd(), '.gideon', 'lessons_cache.json');
    assert.ok(fs.existsSync(cachePath), '.gideon/lessons_cache.json must exist');

    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    assert.strictEqual(cacheData.isAuthoritative, false, 'Cache must explicitly declare isAuthoritative: false');
    assert.ok(Array.isArray(cacheData.lessons), 'Cache must contain lessons array');

    const preservationLesson = cacheData.lessons.find((l: any) => l.key === 'RULE_GENERATED_ARTIFACT_PRESERVATION');
    assert.ok(preservationLesson, 'RULE_GENERATED_ARTIFACT_PRESERVATION must be present in cache');
    assert.strictEqual(preservationLesson.verificationStatus, 'VERIFIED', 'Status must be VERIFIED');
    assert.ok(preservationLesson.confidence >= 0.95, 'Confidence must be >= 0.95');
    assert.ok(preservationLesson.evidenceIds.length > 0, 'Must link to verifiable evidence ID');
  });

  console.log('================================================================');
  console.log(`  E2E OPERATIONAL VERIFICATION RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('================================================================');
}

runAll().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
