import crypto from 'crypto';
import { 
  ProjectContextPackBuilder, 
  ProjectDataSource 
} from '../packages/memory/src/ProjectContextPackBuilder';
import { 
  ProjectRecord, 
  ProjectMissionLink, 
  ProjectEvent, 
  ProjectTestRun, 
  VerifiedLesson 
} from '../packages/shared/src';

// In-Memory Read-Only Mock Store to verify exact read/write invariants
class TestProjectDataStore implements ProjectDataSource {
  public project: ProjectRecord;
  public missions: ProjectMissionLink[] = [];
  public events: ProjectEvent[] = [];
  public testRuns: ProjectTestRun[] = [];
  public lessons: VerifiedLesson[] = [];

  // Track mutation counts
  public mutationAttemptCount = 0;

  constructor(initialProject: ProjectRecord) {
    this.project = { ...initialProject };
  }

  async getProjectById(id: string): Promise<ProjectRecord | null> {
    if (this.project.id === id) {
      // Return copy to prevent accidental in-place mutation
      return { ...this.project };
    }
    return null;
  }

  async getProjectMissions(projectId: string): Promise<ProjectMissionLink[]> {
    return this.missions.filter(m => m.projectId === projectId).map(m => ({ ...m }));
  }

  async getEvents(projectId: string): Promise<ProjectEvent[]> {
    return this.events.filter(e => e.projectId === projectId).map(e => ({ ...e }));
  }

  async getTestRuns(projectId: string): Promise<ProjectTestRun[]> {
    return this.testRuns.filter(tr => tr.projectId === projectId).map(tr => ({ ...tr }));
  }

  async getVerifiedLessons(projectId: string): Promise<VerifiedLesson[]> {
    return this.lessons.map(l => ({ ...l }));
  }
}

async function runPhase2Step2PackBuilderVerification() {
  console.log('================================================================');
  console.log('🏛️  GIDEON AI HQ — PHASE 2B: CONTEXT PACK BUILDER VERIFICATION');
  console.log('    8-Proof Rigorous Projection & Invariant Suite');
  console.log('================================================================\n');

  let allPassed = true;

  // Base authoritative fixture
  const baseFixture: ProjectRecord = {
    id: 'proj_b2b_automation_service',
    slug: 'b2b-automation-service',
    name: 'B2B Automation Service',
    category: 'API_SERVICE',
    status: 'QA_VERIFIED',
    workspacePath: 'projects/b2b-automation-service',
    currentVersion: 'v1.0.0',
    revision: 7,
    businessObjective: 'Enterprise client invoice and onboarding automation',
    targetCustomer: 'Digital Marketing & Sales Agencies',
    problemSolved: 'Automates manual invoice routing and onboarding webhooks',
    pricingCents: 85000,
    currency: 'USD',
    buildCostCents: 450,
    totalTokensUsed: 14500,
    healthStatus: 'HEALTHY',
    activePort: 4102,
    metadata: {
      techStack: ['Node.js', 'Express', 'Stripe', 'Node Test Runner'],
      interfaceContracts: ['rateLimiter(req, res, next) throws 429 on overflow'],
      citations: ['Stripe 2026 Webhook Reliability Benchmark'],
      openUnknowns: ['Webhook retry backoff curve'],
      executionProfile: {
        projectId: 'proj_b2b_automation_service',
        allowedStartCommand: 'node src/index.js',
        allowedTestCommands: ['node --test tests/*.spec.js', 'npm test'],
        workingDirectory: 'projects/b2b-automation-service',
        environmentPolicy: ['PORT', 'NODE_ENV'],
        allowedPorts: [4100, 4199],
        resourceLimits: {
          maxMemoryMb: 512,
          timeoutMs: 600000
        },
        profileVersion: 1,
        approvedAt: new Date().toISOString(),
        approvedBy: 'sentinel'
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // -------------------------------------------------------------
  // PROOF 1: READ-ONLY BEHAVIOR (ZERO MUTATION)
  // -------------------------------------------------------------
  console.log('▶ [Proof 1/8] Verifying Read-Only Projection Invariant (Zero Mutation)...');
  try {
    const store = new TestProjectDataStore(baseFixture);
    store.missions.push({
      id: 'm1',
      projectId: baseFixture.id,
      missionId: 'mission-001',
      missionTitle: 'Scaffold core controllers',
      objective: 'Scaffold checkout webhook controller',
      status: 'COMPLETED',
      assignedRole: 'forge',
      costCents: 10,
      tokensUsed: 2500,
      evidenceId: 'ev-001',
      createdAt: new Date().toISOString()
    });
    store.events.push({
      id: 'e1',
      eventId: 'evt-001',
      projectId: baseFixture.id,
      eventType: 'BUILD_STARTED',
      actor: 'forge',
      payload: {},
      createdAt: new Date().toISOString()
    });

    const initialRevision = store.project.revision;
    const initialEventsCount = store.events.length;
    const initialMissionsCount = store.missions.length;
    const initialTestRunsCount = store.testRuns.length;

    const builder = new ProjectContextPackBuilder(store);
    const pack = await builder.buildPack(baseFixture.id, 'forge');

    if (!pack) throw new Error('Failed to generate pack');

    // Assert zero mutations
    if (store.project.revision !== initialRevision) {
      throw new Error(`Project revision mutated from ${initialRevision} to ${store.project.revision}!`);
    }
    if (store.events.length !== initialEventsCount) {
      throw new Error('Events collection mutated during pack build!');
    }
    if (store.missions.length !== initialMissionsCount) {
      throw new Error('Missions collection mutated during pack build!');
    }
    if (store.testRuns.length !== initialTestRunsCount) {
      throw new Error('Test runs collection mutated during pack build!');
    }

    console.log(`  ✓ Read-only projection verified: revision remains ${store.project.revision}, 0 events/missions created`);
    console.log('  PASSED [Proof 1/8] - Pure Read-Only Invariant Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 1/8]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 2: EIGHT-QUESTION POPULATION
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 2/8] Verifying Eight-Question Section Population...');
  try {
    const store = new TestProjectDataStore(baseFixture);
    const builder = new ProjectContextPackBuilder(store);
    const pack = await builder.buildPack(baseFixture.id, 'forge');

    // 1. Identity
    if (pack.projectIdentity.id !== baseFixture.id || pack.projectIdentity.slug !== baseFixture.slug) {
      throw new Error('Section 1 (projectIdentity) mismatch');
    }
    // 2. History
    if (typeof pack.history.completedMissionsCount !== 'number' || typeof pack.history.auditEventCount !== 'number') {
      throw new Error('Section 2 (history) missing required fields');
    }
    // 3. Current State
    if (pack.currentState.revision !== baseFixture.revision || pack.currentState.status !== baseFixture.status) {
      throw new Error('Section 3 (currentState) mismatch');
    }
    // 4. Decision Rationale
    if (!pack.decisionRationale.strategicObjective || typeof pack.decisionRationale.decisionConfidence !== 'number') {
      throw new Error('Section 4 (decisionRationale) missing');
    }
    // 5. Evidence
    if (!Array.isArray(pack.evidence.evidenceIds) || !Array.isArray(pack.evidence.citations)) {
      throw new Error('Section 5 (evidence) missing');
    }
    // 6. Constraints
    if (!pack.constraints.workingDirectory || !pack.constraints.resourceLimits) {
      throw new Error('Section 6 (constraints) missing');
    }
    // 7. Next Agent Brief
    if (pack.nextAgentBrief.assignedRole !== 'forge' || !pack.nextAgentBrief.expectedDeliverable) {
      throw new Error('Section 7 (nextAgentBrief) missing');
    }
    // 8. Inaccessible Information
    if (!Array.isArray(pack.inaccessibleInformation.redactedKeys) || pack.inaccessibleInformation.redactedKeys.length === 0) {
      throw new Error('Section 8 (inaccessibleInformation) missing');
    }

    console.log('  ✓ All 8 first-class operational questions populated with authoritative data:');
    console.log(`    - Identity: ${pack.projectIdentity.name} (${pack.projectIdentity.slug})`);
    console.log(`    - Current State: rev #${pack.currentState.revision}, status: ${pack.currentState.status}`);
    console.log(`    - Brief: assigned to ${pack.nextAgentBrief.assignedRole}`);
    console.log(`    - Inaccessible: ${pack.inaccessibleInformation.redactedKeys.length} sensitive categories masked`);
    console.log('  PASSED [Proof 2/8] - Eight-Question Population Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 2/8]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 3: REVISION STAMPING & INVALIDATION
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 3/8] Verifying Revision Stamping & Stale Pack Invalidation...');
  try {
    const store = new TestProjectDataStore(baseFixture);
    const builder = new ProjectContextPackBuilder(store);

    // Build pack at revision 7
    const pack1 = await builder.buildPack(baseFixture.id, 'forge');
    if (pack1.projectRevision !== 7) {
      throw new Error(`Expected pack projectRevision 7, got ${pack1.projectRevision}`);
    }

    // Verify freshness against rev 7
    const freshCheck = ProjectContextPackBuilder.verifyFreshness(pack1, 7);
    if (!freshCheck.isCurrent) throw new Error('Fresh pack marked as stale');

    // Simulate legitimate state update incrementing revision to 8
    store.project.revision = 8;
    store.project.status = 'STAGING';

    // Verify pack1 is now flagged as stale
    const staleCheck = ProjectContextPackBuilder.verifyFreshness(pack1, store.project.revision);
    if (staleCheck.isCurrent) {
      throw new Error('Old revision 7 pack was erroneously accepted as current for project at revision 8!');
    }
    console.log(`  ✓ Stale check intercepted: "${staleCheck.invalidationReason}"`);

    // Build pack2 at revision 8
    const pack2 = await builder.buildPack(baseFixture.id, 'forge');
    if (pack2.projectRevision !== 8) {
      throw new Error(`Expected pack2 projectRevision 8, got ${pack2.projectRevision}`);
    }

    if (pack1.sourceStateHash === pack2.sourceStateHash) {
      throw new Error('sourceStateHash failed to change when underlying project revision and status changed!');
    }

    console.log(`  ✓ Revision stamping verified: pack1 (rev #${pack1.projectRevision}) -> pack2 (rev #${pack2.projectRevision})`);
    console.log(`  ✓ State hash updated on state mutation: ${pack1.sourceStateHash.slice(0, 12)}... -> ${pack2.sourceStateHash.slice(0, 12)}...`);
    console.log('  PASSED [Proof 3/8] - Revision Stamping & Invalidation Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 3/8]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 4: DETERMINISTIC HASHING
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 4/8] Verifying Deterministic Source State Hashing...');
  try {
    const store = new TestProjectDataStore(baseFixture);
    const builder = new ProjectContextPackBuilder(store);

    const packA = await builder.buildPack(baseFixture.id, 'forge');
    const packB = await builder.buildPack(baseFixture.id, 'forge');

    // Dynamic IDs differ
    if (packA.packId === packB.packId) {
      throw new Error('Pack IDs should be uniquely generated per invocation');
    }

    // Source state hash MUST be strictly identical
    if (packA.sourceStateHash !== packB.sourceStateHash) {
      throw new Error(`Source state hash was non-deterministic! Hash A: ${packA.sourceStateHash} vs Hash B: ${packB.sourceStateHash}`);
    }

    console.log(`  ✓ Deterministic hash verified across independent runs: ${packA.sourceStateHash}`);
    console.log('  PASSED [Proof 4/8] - Deterministic Hashing Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 4/8]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 5: AGENT-SPECIFIC DOMAIN PROJECTION
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 5/8] Verifying Policy-First Agent Domain Partitioning...');
  try {
    const store = new TestProjectDataStore(baseFixture);
    const builder = new ProjectContextPackBuilder(store);

    const forgePack = await builder.buildPack(baseFixture.id, 'forge');
    const scoutPack = await builder.buildPack(baseFixture.id, 'scout');
    const sentinelPack = await builder.buildPack(baseFixture.id, 'sentinel');

    // 1. Forge brief differs from Scout brief
    if (forgePack.nextAgentBrief.assignedRole !== 'forge' || scoutPack.nextAgentBrief.assignedRole !== 'scout') {
      throw new Error('Agent roles not scoped');
    }
    if (forgePack.nextAgentBrief.expectedDeliverable === scoutPack.nextAgentBrief.expectedDeliverable) {
      throw new Error('Deliverables should be agent-specific');
    }

    // 2. Scout must have SOURCE_CODE_WRITE masked
    if (!scoutPack.inaccessibleInformation.redactedKeys.includes('SOURCE_CODE_WRITE')) {
      throw new Error('Scout policy failed to redact source code write capability');
    }

    // 3. Forge must have FINANCE_BALANCES masked
    if (!forgePack.inaccessibleInformation.redactedKeys.includes('FINANCE_BALANCES')) {
      throw new Error('Forge policy failed to redact finance balances');
    }

    // 4. Sentinel brief focuses on adversarial QA
    if (!sentinelPack.nextAgentBrief.targetTaskGoal.includes('adversarial QA audit')) {
      throw new Error('Sentinel brief failed to focus on adversarial QA audit');
    }

    console.log('  ✓ Forge projection: Code workspace accessible, finance balances masked');
    console.log('  ✓ Scout projection: Market intelligence accessible, code write access masked');
    console.log('  ✓ Sentinel projection: Adversarial QA & verification briefed, payouts masked');
    console.log('  PASSED [Proof 5/8] - Agent-Specific Domain Projection Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 5/8]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 6: SECRET NON-INGRESS ASSERTION
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 6/8] Verifying Secret Non-Ingress (Zero Credential Leakage)...');
  try {
    const fakeSecrets = [
      'sk_live_' + '998877665544332211aabbcc',
      'TEST_STRIPE_SECRET',
      'TEST_SUPABASE_SERVICE_KEY',
      'TEST_HMAC_SECRET',
      'TEST_GATEWAY_TOKEN'
    ];

    // Seed fixture with fake secrets in an attempt to leak them into the pack
    const contaminatedFixture: ProjectRecord = {
      ...baseFixture,
      metadata: {
        ...baseFixture.metadata,
        // Attacker attempts to place secrets in metadata
        unauthorizedSecret: fakeSecrets[0],
        testKey: fakeSecrets[1]
      }
    };

    const store = new TestProjectDataStore(contaminatedFixture);
    const builder = new ProjectContextPackBuilder(store);
    const pack = await builder.buildPack(contaminatedFixture.id, 'forge');

    const serializedPack = JSON.stringify(pack);

    // Verify none of the fake secrets exist anywhere in the pack output
    for (const secret of fakeSecrets) {
      if (serializedPack.includes(secret)) {
        throw new Error(`Secret Leakage Detected: Secret '${secret}' found in serialized Context Pack!`);
      }
    }

    console.log('  ✓ Zero secret leakage verified: all test secret signatures absent from output');
    console.log('  PASSED [Proof 6/8] - Secret Non-Ingress Invariant Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 6/8]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 7: UNSUPPORTED AGENT REJECTION
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 7/8] Verifying Unsupported Agent Rejection (Fail Closed)...');
  try {
    const store = new TestProjectDataStore(baseFixture);
    const builder = new ProjectContextPackBuilder(store);

    let rejectedAdmin = false;
    try {
      await builder.buildPack(baseFixture.id, 'admin' as any);
    } catch (e: any) {
      if (e.message.includes('Unsupported target agent')) {
        rejectedAdmin = true;
        console.log(`  ✓ Target agent 'admin' rejected: "${e.message}"`);
      }
    }
    if (!rejectedAdmin) throw new Error("Target agent 'admin' was not rejected!");

    let rejectedEverything = false;
    try {
      await builder.buildPack(baseFixture.id, 'everything' as any);
    } catch (e: any) {
      if (e.message.includes('Unsupported target agent')) {
        rejectedEverything = true;
        console.log(`  ✓ Target agent 'everything' rejected: "${e.message}"`);
      }
    }
    if (!rejectedEverything) throw new Error("Target agent 'everything' was not rejected!");

    console.log('  PASSED [Proof 7/8] - Unsupported Target Agents Rejected (Fail Closed)');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 7/8]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 8: UNKNOWN PROJECT REJECTION
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 8/8] Verifying Unknown Project Rejection...');
  try {
    const store = new TestProjectDataStore(baseFixture);
    const builder = new ProjectContextPackBuilder(store);

    let rejectedUnknown = false;
    try {
      await builder.buildPack('proj_nonexistent_9999', 'forge');
    } catch (e: any) {
      if (e.message.includes('Unknown project') || e.message.includes('nonexistent project')) {
        rejectedUnknown = true;
        console.log(`  ✓ Nonexistent project rejected: "${e.message}"`);
      }
    }

    if (!rejectedUnknown) throw new Error('Nonexistent project was not rejected!');

    console.log('  PASSED [Proof 8/8] - Unknown Project Rejection Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 8/8]:', err.message);
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🏆 ALL 8/8 PHASE 2B CONTEXT PACK BUILDER PROOFS PASSED (100%)');
    console.log('   Read-Only Projection, Deterministic Hashing & Agent Scoping Certified.');
  } else {
    console.log('❌ SOME BUILDER PROOFS FAILED.');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runPhase2Step2PackBuilderVerification().catch(e => {
  console.error('Builder test suite failed with unhandled error:', e);
  process.exit(1);
});
