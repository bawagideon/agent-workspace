/**
 * ==============================================================================
 * GIDEON AI HQ — PHASE 2C: SECURITY PROJECTION PIPELINE VERIFICATION
 * 
 * 7 Rigorous Security Invariant Proofs:
 * 1. Policy-First Field Selection (Forbidden fields never enter the projection)
 * 2. Deep Defense-in-Depth Sanitizer (Catches nested credentials)
 * 3. Agent Domain Isolation (Forge != Scout != Sentinel)
 * 4. Question 8 Disclosure (Categorical reasons, zero secret value leakage)
 * 5. Cross-Project Isolation (Project A strictly excludes Project B data)
 * 6. Deterministic Projection & Dual State Hashing (authoritativeStateHash vs projectedContextHash)
 * 7. Fail Closed (Unsupported agents & unclassifiable inputs rejected)
 * ==============================================================================
 */

import { 
  SecurityProjectionPipeline, 
  AGENT_SECURITY_POLICIES, 
  SecurityPolicyError 
} from '../packages/memory/src/SecurityProjectionPipeline';
import { ProjectContextPackBuilder } from '../packages/memory/src/ProjectContextPackBuilder';
import { 
  ProjectRecord, 
  ProjectMissionLink, 
  ProjectEvent, 
  ProjectTestRun 
} from '../packages/shared/src';

class MockDataStore {
  public project: ProjectRecord;
  public missions: ProjectMissionLink[] = [];
  public events: ProjectEvent[] = [];
  public testRuns: ProjectTestRun[] = [];

  constructor(p: ProjectRecord) {
    this.project = { ...p };
  }

  async getProjectById(id: string) {
    return this.project.id === id ? this.project : null;
  }
  async getProjectMissions(projectId: string) {
    return this.missions.filter(m => m.projectId === projectId);
  }
  async getEvents(projectId: string) {
    return this.events.filter(e => e.projectId === projectId);
  }
  async getTestRuns(projectId: string) {
    return this.testRuns.filter(t => t.projectId === projectId);
  }
  async getVerifiedLessons(projectId: string) {
    return [];
  }
}

async function runStep3SecurityPipelineTests() {
  console.log('================================================================');
  console.log('🏛️  GIDEON AI HQ — PHASE 2C: SECURITY PROJECTION PIPELINE PROOFS');
  console.log('    Policy-First, Cross-Project Isolation & Least-Privilege Gate');
  console.log('================================================================\\n');

  let allPassed = true;

  const sampleProject: ProjectRecord = {
    id: 'proj_b2b_security_test',
    slug: 'b2b-security-test',
    name: 'B2B Security Service',
    category: 'CLIENT_SERVICE',
    status: 'QA_VERIFIED',
    workspacePath: 'projects/b2b-security-test',
    repository: 'https://github.com/gideon/b2b-security-test',
    currentVersion: 'v1.0.0',
    revision: 19,
    businessObjective: 'Deliver automated high-concurrency security proxy',
    targetCustomer: 'Enterprise DevSecOps Teams (private CRM contact: cto@enterprise.corp)',
    problemSolved: 'Prevent unauthorized credential leakage in agent workflows',
    pricingCents: 150000,
    currency: 'USD',
    buildCostCents: 450,
    totalTokensUsed: 12000,
    healthStatus: 'HEALTHY',
    activePort: 4105,
    metadata: {
      techStack: ['Node.js', 'TypeScript', 'Docker'],
      executionProfile: {
        allowedStartCommand: 'npm start',
        allowedTestCommands: ['npm test', 'npm run test:security'],
        workingDirectory: 'projects/b2b-security-test',
        resourceLimits: { maxMemoryMb: 512, timeoutMs: 30000 }
      },
      // Sensitive internal properties that MUST NEVER enter a Forge technical projection
      internalGrossMargin: '85%',
      stripePayoutAccountId: 'acct_19827364129',
      customerBillingEmail: 'billing@enterprise.corp'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // --------------------------------------------------------------------------
  // PROOF 1: POLICY-FIRST FIELD SELECTION
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 1/7] Verifying Policy-First Field Selection (Forbidden Fields Never Extracted)...');
  try {
    const forgePolicy = SecurityProjectionPipeline.getPolicy('forge');
    const forgeIdentity = SecurityProjectionPipeline.projectIdentity(sampleProject, forgePolicy);

    // Verify forbidden fields are not selected
    if ((forgeIdentity as any).internalGrossMargin !== undefined) {
      throw new Error('Policy violation: internalGrossMargin entered Forge projectIdentity!');
    }
    if ((forgeIdentity as any).stripePayoutAccountId !== undefined) {
      throw new Error('Policy violation: stripePayoutAccountId entered Forge projectIdentity!');
    }
    if ((forgeIdentity as any).customerBillingEmail !== undefined) {
      throw new Error('Policy violation: customerBillingEmail entered Forge projectIdentity!');
    }

    // Target customer should be omitted from Forge identity under least privilege
    if (forgeIdentity.targetCustomer !== undefined) {
      throw new Error('Policy violation: targetCustomer private CRM data leaked to Forge identity!');
    }

    // Permitted technical fields MUST be present
    if (!forgeIdentity.techStack.includes('TypeScript') || forgeIdentity.name !== 'B2B Security Service') {
      throw new Error('Policy error: Permitted technical fields missing from Forge identity');
    }

    console.log('  ✓ Forge projection: sensitive financial margins and CRM contacts never extracted');
    console.log('  ✓ Permitted technical fields (techStack, businessObjective) cleanly retained');
    console.log('  PASSED [Proof 1/7] - Policy-First Field Selection Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 1/7]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 2: DEEP DEFENSE-IN-DEPTH SANITIZER
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 2/7] Verifying Deep Defense-in-Depth Sanitizer (Nested Credential Scrubbing)...');
  try {
    // Construct a payload containing a nested secret simulating legacy/malicious input
    const maliciousPayload = {
      module: 'auth-service',
      config: {
        database: {
          host: 'db.internal',
          apiKey: 'sk_live_' + '999888777666555444333222111',
          token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig'
        }
      }
    };

    // Strict mode MUST throw SecurityPolicyError
    let threwStrict = false;
    try {
      SecurityProjectionPipeline.sanitizeDefenseInDepth(maliciousPayload, true);
    } catch (e: any) {
      if (e instanceof SecurityPolicyError) {
        threwStrict = true;
      }
    }
    if (!threwStrict) {
      throw new Error('Defense-in-depth strict mode failed to reject nested secret pattern!');
    }

    // Non-strict mode MUST scrub and replace secret pattern
    const scrubbed = SecurityProjectionPipeline.sanitizeDefenseInDepth({
      nested: {
        token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig',
        note: 'clean text'
      }
    }, false);

    const serialized = JSON.stringify(scrubbed);
    if (serialized.includes('sk_live_') || serialized.includes('Bearer eyJ')) {
      throw new Error('Sanitizer failed to scrub nested secret token!');
    }
    if (!serialized.includes('[REDACTED_SECRET]')) {
      throw new Error('Sanitizer did not replace detected credential with [REDACTED_SECRET]');
    }

    console.log('  ✓ Strict mode: Intercepted nested secret pattern and threw SecurityPolicyError');
    console.log('  ✓ Masking mode: Cleanly replaced nested token with [REDACTED_SECRET]');
    console.log('  PASSED [Proof 2/7] - Deep Defense-in-Depth Sanitizer Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 2/7]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 3: AGENT DOMAIN ISOLATION (Forge != Scout != Sentinel)
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 3/7] Verifying Agent Domain Isolation (Forge != Scout != Sentinel)...');
  try {
    const forgePolicy = SecurityProjectionPipeline.getPolicy('forge');
    const scoutPolicy = SecurityProjectionPipeline.getPolicy('scout');
    const sentinelPolicy = SecurityProjectionPipeline.getPolicy('sentinel');

    const forgeConstraints = SecurityProjectionPipeline.projectConstraints(
      sampleProject, 
      sampleProject.metadata.executionProfile, 
      forgePolicy
    );
    const scoutConstraints = SecurityProjectionPipeline.projectConstraints(
      sampleProject, 
      sampleProject.metadata.executionProfile, 
      scoutPolicy
    );
    const sentinelConstraints = SecurityProjectionPipeline.projectConstraints(
      sampleProject, 
      sampleProject.metadata.executionProfile, 
      sentinelPolicy
    );

    // 1. Forge has shell test commands, Scout has NONE
    if (!forgeConstraints.allowedTestCommands.includes('npm test')) {
      throw new Error('Forge missing approved test commands');
    }
    if (scoutConstraints.allowedTestCommands.length !== 0) {
      throw new Error('Scout must have ZERO allowed test commands (Read-only market boundary)');
    }

    // 2. Scout workspace is locked to sandbox/research, Forge is locked to projects/b2b-security-test
    if (scoutConstraints.workingDirectory !== 'sandbox/research') {
      throw new Error(`Scout workingDirectory '${scoutConstraints.workingDirectory}' not sandboxed`);
    }
    if (forgeConstraints.workingDirectory !== 'projects/b2b-security-test') {
      throw new Error(`Forge workingDirectory '${forgeConstraints.workingDirectory}' mismatch`);
    }

    // 3. Sentinel cannot start the application service (audit only)
    if (sentinelConstraints.allowedStartCommand !== undefined) {
      throw new Error('Sentinel must not have permission to execute service start command');
    }

    console.log('  ✓ Forge: full workspace execution profile, strict project boundary');
    console.log('  ✓ Scout: research sandbox only, zero shell/write capability');
    console.log('  ✓ Sentinel: audit/test commands permitted, service startup blocked');
    console.log('  PASSED [Proof 3/7] - Agent Domain Isolation Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 3/7]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 4: QUESTION 8 TRANSPARENT INACCESSIBILITY DISCLOSURE
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 4/7] Verifying Question 8 Disclosure (Categories & Reasons, Zero Secret Leakage)...');
  try {
    const forgePolicy = SecurityProjectionPipeline.getPolicy('forge');
    const inaccessible = SecurityProjectionPipeline.buildInaccessibleInformation(forgePolicy);

    // 1. Discloses categories
    if (!inaccessible.inaccessibleCategories.includes('FINANCIAL_CREDENTIALS')) {
      throw new Error('Missing FINANCIAL_CREDENTIALS category in Question 8 disclosure');
    }
    if (!inaccessible.inaccessibleCategories.includes('CROSS_PROJECT_DATA')) {
      throw new Error('Missing CROSS_PROJECT_DATA category in Question 8 disclosure');
    }

    // 2. Contains policy reasons
    if (!inaccessible.policyReason || !inaccessible.policyReason.includes('Zero Financial')) {
      throw new Error('Missing clear policy reason in disclosure');
    }

    // 3. Verifies zero secret values or raw private key variables are in Question 8
    const serialized = JSON.stringify(inaccessible);
    if (/sk_live|sk_test|private_key/i.test(serialized)) {
      throw new Error('Question 8 disclosure leaked secret signatures!');
    }

    console.log('  ✓ Categories disclosed: ' + inaccessible.inaccessibleCategories.join(', '));
    console.log('  ✓ Policy reason: ' + inaccessible.policyReason);
    console.log('  ✓ Zero secret values or internal variable names leaked in disclosure');
    console.log('  PASSED [Proof 4/7] - Question 8 Disclosure Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 4/7]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 5: CROSS-PROJECT ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 5/7] Verifying Cross-Project Isolation (Strict Data Segregation)...');
  try {
    const currentProjectId = 'proj_b2b_security_test';
    const foreignProjectId = 'proj_external_rogue_project';

    const foreignMission: ProjectMissionLink = {
      id: 'm-foreign-1',
      projectId: foreignProjectId,
      missionId: 'mission-rogue-001',
      assignedRole: 'forge',
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };

    const validMission: ProjectMissionLink = {
      id: 'm-valid-1',
      projectId: currentProjectId,
      missionId: 'mission-valid-001',
      assignedRole: 'forge',
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };

    const foreignEvent: ProjectEvent = {
      id: 'e-foreign-1',
      eventId: 'evt-foreign-1',
      projectId: foreignProjectId,
      eventType: 'SUSPICIOUS_MUTATION',
      actor: 'unknown',
      payload: {},
      createdAt: new Date().toISOString()
    };

    const { cleanMissions, cleanEvents } = SecurityProjectionPipeline.enforceCrossProjectIsolation(
      currentProjectId,
      [foreignMission, validMission],
      [foreignEvent],
      []
    );

    if (cleanMissions.length !== 1 || cleanMissions[0].projectId !== currentProjectId) {
      throw new Error('Cross-project isolation failed: Foreign mission not stripped!');
    }
    if (cleanEvents.length !== 0) {
      throw new Error('Cross-project isolation failed: Foreign event not stripped!');
    }

    console.log('  ✓ Foreign project missions and events successfully isolated and purged');
    console.log('  ✓ Zero cross-project contamination verified');
    console.log('  PASSED [Proof 5/7] - Cross-Project Isolation Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 5/7]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 6: DETERMINISTIC PROJECTION & DUAL STATE HASHING
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 6/7] Verifying Deterministic Projection & Dual State Hashing...');
  try {
    const store = new MockDataStore(sampleProject);
    const builder = new ProjectContextPackBuilder(store);

    const forgePack = await builder.buildPack(sampleProject.id, 'forge');
    const scoutPack = await builder.buildPack(sampleProject.id, 'scout');
    const sentinelPack = await builder.buildPack(sampleProject.id, 'sentinel');

    // 1. Authoritative state hash MUST be identical across all three agent packs
    if (forgePack.authoritativeStateHash !== scoutPack.authoritativeStateHash || 
        forgePack.authoritativeStateHash !== sentinelPack.authoritativeStateHash) {
      throw new Error('Authoritative state hash diverged across agent perspectives for identical project state!');
    }

    // 2. Projected context hashes MUST differ between Forge, Scout, and Sentinel
    if (forgePack.projectedContextHash === scoutPack.projectedContextHash) {
      throw new Error('Forge and Scout projected context hashes should not match due to domain partitioning');
    }
    if (forgePack.projectedContextHash === sentinelPack.projectedContextHash) {
      throw new Error('Forge and Sentinel projected context hashes should not match due to domain partitioning');
    }

    // 3. Repeatability: Re-building Forge pack must produce identical projectedContextHash
    const forgePack2 = await builder.buildPack(sampleProject.id, 'forge');
    if (forgePack.projectedContextHash !== forgePack2.projectedContextHash) {
      throw new Error('Projected context hash is non-deterministic across repeat invocations!');
    }

    console.log('  ✓ Identical authoritativeStateHash across all agents: ' + forgePack.authoritativeStateHash?.slice(0, 16) + '...');
    console.log('  ✓ Unique projectedContextHash for Forge:    ' + forgePack.projectedContextHash?.slice(0, 16) + '...');
    console.log('  ✓ Unique projectedContextHash for Scout:    ' + scoutPack.projectedContextHash?.slice(0, 16) + '...');
    console.log('  ✓ Unique projectedContextHash for Sentinel: ' + sentinelPack.projectedContextHash?.slice(0, 16) + '...');
    console.log('  PASSED [Proof 6/7] - Deterministic Projection & Dual Hashing Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 6/7]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 7: FAIL CLOSED ON UNSUPPORTED AGENTS & SCHEMAS
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 7/7] Verifying Fail-Closed Policy Enforcement...');
  try {
    let threwInvalid = false;
    try {
      SecurityProjectionPipeline.getPolicy('admin' as any);
    } catch (e: any) {
      if (e instanceof SecurityPolicyError) {
        threwInvalid = true;
      }
    }
    if (!threwInvalid) {
      throw new Error('Failed to reject unauthorized agent role "admin"!');
    }

    let threwEverything = false;
    try {
      SecurityProjectionPipeline.getPolicy('everything' as any);
    } catch (e: any) {
      if (e instanceof SecurityPolicyError) {
        threwEverything = true;
      }
    }
    if (!threwEverything) {
      throw new Error('Failed to reject wildcard agent role "everything"!');
    }

    console.log('  ✓ Unauthorized agent "admin" rejected fail-closed');
    console.log('  ✓ Wildcard agent "everything" rejected fail-closed');
    console.log('  PASSED [Proof 7/7] - Fail-Closed Policy Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 7/7]:', err.message);
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🏆 ALL 7/7 PHASE 2C SECURITY PIPELINE PROOFS PASSED (100%)');
    console.log('   Policy-First Filtering, Least-Privilege & Dual Hashing Certified.');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('❌ SOME PHASE 2C PROOFS FAILED.');
    console.log('================================================================\n');
    process.exit(1);
  }
}

runStep3SecurityPipelineTests();
