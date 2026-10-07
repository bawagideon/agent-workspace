import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ProjectDatabase } from '../apps/hq/src/lib/projects/ProjectDatabase';
import { ProjectExecutionProfileValidator } from '../apps/hq/src/lib/projects/ProjectExecutionProfile';
import { ProjectRegistry } from '../apps/hq/src/lib/projects/ProjectRegistry';
import { ProjectStateMachine } from '../apps/hq/src/lib/projects/ProjectStateMachine';
import { ProjectRecord, ProjectMissionLink, ProjectTestRun } from '../packages/shared/src';

async function runPhase1InvariantsVerification() {
  console.log('================================================================');
  console.log('🏛️  GIDEON AI HQ — PHASE 1: PROJECT OS ACCEPTANCE VERIFICATION');
  console.log('    Rigorous 6-Test Invariant Proof Suite');
  console.log('================================================================\n');

  const db = ProjectDatabase.getInstance();
  const testId = `proj_test_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;

  // Setup: Create a clean disposable project for invariant testing
  const initialProject: ProjectRecord = {
    id: testId,
    slug: `test-project-${Date.now()}`,
    name: 'Disposable Invariant Test Project',
    category: 'API_SERVICE',
    status: 'DISCOVERY',
    workspacePath: 'projects/b2b-automation-service', // existing safe workspace
    currentVersion: 'v0.1.0',
    revision: 1,
    businessObjective: 'Verify Phase 1 invariants under adversarial load',
    pricingCents: 100000,
    currency: 'USD',
    buildCostCents: 500,
    totalTokensUsed: 5000,
    healthStatus: 'HEALTHY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.saveProject(initialProject);
  console.log(`[Setup] Created disposable project '${testId}' (initial revision: 1)`);

  let allPassed = true;

  // -------------------------------------------------------------
  // TEST A: EVENT REPLAY (IDEMPOTENT RECONCILIATION)
  // -------------------------------------------------------------
  console.log('\n▶ [Test A/6] Event Replay (Idempotent Reconciliation Invariant)...');
  try {
    const fixedEventId = `evt_dedup_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    
    // First emission
    const firstEmit = await db.logEvent({
      eventId: fixedEventId,
      projectId: testId,
      eventType: 'BUILD_STARTED',
      actor: 'forge',
      payload: { iteration: 1 }
    });

    if (firstEmit.isDuplicate) {
      throw new Error('First event emission incorrectly marked as duplicate!');
    }

    // Replay emission with identical eventId
    const replayEmit = await db.logEvent({
      eventId: fixedEventId,
      projectId: testId,
      eventType: 'BUILD_STARTED',
      actor: 'forge',
      payload: { iteration: 1 }
    });

    if (!replayEmit.isDuplicate) {
      throw new Error('Replayed event was not flagged as duplicate!');
    }

    if (replayEmit.id !== firstEmit.id) {
      throw new Error('Replayed event did not resolve to identical event record!');
    }

    // Verify cache count has not doubled
    const events = await db.getEvents(testId);
    const countWithId = events.filter(e => e.eventId === fixedEventId).length;
    if (countWithId !== 1) {
      throw new Error(`Duplicate event record leaked into store! Found ${countWithId} occurrences.`);
    }

    console.log(`  ✓ First event emitted: ${firstEmit.eventId} (duplicate=false)`);
    console.log(`  ✓ Replayed event intercepted: duplicate=true, 0 state mutation`);
    console.log('  PASSED [Test A/6] - Event Idempotency Invariant Verified');
  } catch (err: any) {
    console.error('  ❌ FAILED [Test A/6]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST B: STALE PROJECT REVISION (OPTIMISTIC CONCURRENCY)
  // -------------------------------------------------------------
  console.log('\n▶ [Test B/6] Stale Project Revision (Optimistic Concurrency Control)...');
  try {
    const projectBefore = await db.getProjectById(testId);
    if (!projectBefore) throw new Error('Project not found');
    const baseRevision = projectBefore.revision;

    // Writer 1 attempts update at baseRevision -> SUCCESS (revision becomes baseRevision + 1)
    const writer1Result = await db.saveProject({
      ...projectBefore,
      businessObjective: 'Writer 1 updated objective'
    }, baseRevision);

    if (writer1Result.revision !== baseRevision + 1) {
      throw new Error(`Expected revision ${baseRevision + 1}, got ${writer1Result.revision}`);
    }
    console.log(`  ✓ Writer 1 succeeded: revision updated ${baseRevision} -> ${writer1Result.revision}`);

    // Writer 2 attempts update at stale baseRevision -> MUST THROW CONFLICT
    let writer2ConflictCaught = false;
    try {
      await db.saveProject({
        ...projectBefore,
        businessObjective: 'Writer 2 stale update attempt'
      }, baseRevision);
    } catch (conflictErr: any) {
      if (conflictErr.message.includes('Concurrency Conflict') || conflictErr.message.includes('revision mismatch')) {
        writer2ConflictCaught = true;
        console.log(`  ✓ Writer 2 conflict caught: "${conflictErr.message}"`);
      } else {
        throw conflictErr;
      }
    }

    if (!writer2ConflictCaught) {
      throw new Error('Writer 2 stale update was permitted! Optimistic concurrency failed.');
    }

    console.log('  PASSED [Test B/6] - Optimistic Concurrency Invariant Verified');
  } catch (err: any) {
    console.error('  ❌ FAILED [Test B/6]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST C: PROJECT HISTORY PRESERVATION (ARCHIVAL VS DESTRUCTION)
  // -------------------------------------------------------------
  console.log('\n▶ [Test C/6] Project History Preservation (Non-Cascading Archival)...');
  try {
    // Log several events and a test run on project
    await db.logEvent({
      projectId: testId,
      eventType: 'TEST_PASSED',
      actor: 'sentinel',
      payload: { passCount: 5 }
    });

    await db.saveTestRun({
      projectId: testId,
      suiteName: 'Preservation Suite',
      command: 'npm test',
      status: 'PASS',
      passedCount: 5,
      failedCount: 0,
      skippedCount: 0,
      durationMs: 120,
      exitCode: 0,
      rawLogContent: 'Sample preservation test log content'
    });

    // Soft-archive the project
    const archived = await db.archiveProject(testId);
    if (archived.status !== 'ARCHIVED') {
      throw new Error(`Expected status 'ARCHIVED', got '${archived.status}'`);
    }

    // Historical records must remain 100% queryable
    const eventsAfterArchive = await db.getEvents(testId);
    const testsAfterArchive = await db.getTestRuns(testId);

    if (eventsAfterArchive.length === 0) {
      throw new Error('Events disappeared after project archival!');
    }
    if (testsAfterArchive.length === 0) {
      throw new Error('Test runs disappeared after project archival!');
    }

    console.log(`  ✓ Project soft-archived to '${archived.status}'. Destructive cascade prevented.`);
    console.log(`  ✓ Historical audit queryable: ${eventsAfterArchive.length} events, ${testsAfterArchive.length} test runs intact.`);
    console.log('  PASSED [Test C/6] - Historical Preservation Invariant Verified');
  } catch (err: any) {
    console.error('  ❌ FAILED [Test C/6]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST D: EXECUTION PROFILE ENFORCEMENT
  // -------------------------------------------------------------
  console.log('\n▶ [Test D/6] Execution Profile Governance & Policy Enforcement...');
  try {
    // 1. Missing profile -> blocked
    const resMissing = ProjectExecutionProfileValidator.verifyExecutionPermitted(undefined, 'node src/index.js');
    if (resMissing.permitted) throw new Error('Missing profile was permitted!');
    console.log(`  ✓ Missing profile rejected: "${resMissing.reason}"`);

    // 2. Unapproved profile -> blocked
    const rawProposed = ProjectExecutionProfileValidator.proposeProfile(testId, 'projects/b2b-automation-service');
    const resUnapproved = ProjectExecutionProfileValidator.verifyExecutionPermitted(rawProposed, 'node src/index.js');
    if (resUnapproved.permitted) throw new Error('Unapproved profile was permitted!');
    console.log(`  ✓ Unapproved profile rejected: "${resUnapproved.reason}"`);

    // 3. Approved profile -> allowed on approved start command
    const approved = ProjectExecutionProfileValidator.approveProfile(rawProposed, 'sentinel');
    const resApproved = ProjectExecutionProfileValidator.verifyExecutionPermitted(approved, 'node src/index.js');
    if (!resApproved.permitted) throw new Error(`Approved profile was rejected: ${resApproved.reason}`);
    console.log('  ✓ Approved profile permitted on valid start command');

    // 4. Unauthorized arbitrary command -> blocked
    const resArbitrary = ProjectExecutionProfileValidator.verifyExecutionPermitted(approved, 'rm -rf /');
    if (resArbitrary.permitted) throw new Error('Dangerous unauthorized command was permitted!');
    console.log(`  ✓ Unauthorized command rejected: "${resArbitrary.reason}"`);

    // 5. Invalid profile with path boundary breach -> blocked
    const boundaryBreach = { ...rawProposed, workingDirectory: '../../etc' };
    const resBreach = ProjectExecutionProfileValidator.validateProfile(boundaryBreach);
    if (resBreach.valid) throw new Error('Boundary breach was not caught by validator!');
    console.log(`  ✓ Path traversal breach rejected: "${resBreach.errors[0]}"`);

    console.log('  PASSED [Test D/6] - Execution Profile Policy Invariants Verified');
  } catch (err: any) {
    console.error('  ❌ FAILED [Test D/6]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST E: ARTIFACT-BACKED TEST LOGS
  // -------------------------------------------------------------
  console.log('\n▶ [Test E/6] Artifact-Backed Test Logs (Large Output Isolation)...');
  try {
    // Generate a simulated 50KB test log
    const largeLogLines: string[] = [];
    for (let i = 0; i < 500; i++) {
      largeLogLines.push(`[TRACE ${i}] Executing adversarial boundary check #${i} with payload hash=${crypto.randomBytes(16).toString('hex')}`);
    }
    const largeLogContent = largeLogLines.join('\n');

    const testRun = await db.saveTestRun({
      projectId: testId,
      suiteName: 'Adversarial Stress Suite',
      command: 'node --test tests/adversarial_audit.spec.js',
      status: 'PASS',
      passedCount: 500,
      failedCount: 0,
      skippedCount: 0,
      durationMs: 450,
      exitCode: 0,
      rawLogContent: largeLogContent
    });

    if (!testRun.artifactId) {
      throw new Error('Test run did not generate an artifactId reference!');
    }

    // Verify metadata row does NOT contain the raw 50KB log
    if ((testRun as any).rawLogContent || (testRun as any).log) {
      throw new Error('Raw log content leaked into primary test-run record!');
    }

    // Verify artifact file exists on disk
    const readArtifact = db.readTestLogArtifact(testRun.artifactId);
    if (!readArtifact || readArtifact.length !== largeLogContent.length) {
      throw new Error(`Artifact on disk could not be read or length mismatch! Expected ${largeLogContent.length}, got ${readArtifact?.length}`);
    }

    console.log(`  ✓ Metadata stored in DB: runId=${testRun.id}, artifactId=${testRun.artifactId}`);
    console.log(`  ✓ Large log isolated to disk artifact (${(largeLogContent.length / 1024).toFixed(1)} KB)`);
    console.log(`  ✓ Primary DB row clean: 0 bytes log duplication`);
    console.log('  PASSED [Test E/6] - Test Log Artifact Isolation Invariant Verified');
  } catch (err: any) {
    console.error('  ❌ FAILED [Test E/6]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // TEST F: PROJECT -> MISSION RECONSTRUCTION
  // -------------------------------------------------------------
  console.log('\n▶ [Test F/6] Project -> Mission Provenance Reconstruction...');
  try {
    const missionId = `mission_b2b_${Date.now()}`;

    // 1. Link a completed mission to the project
    const missionLink = await db.linkMission({
      projectId: testId,
      missionId,
      missionTitle: 'Build B2B Automation Endpoint & Sentinel Security Audit',
      objective: 'Scaffold checkout webhook controller, enforce rate limits, and audit boundary cases',
      status: 'COMPLETED',
      assignedRole: 'Forge & Sentinel',
      costCents: 15,
      tokensUsed: 14500,
      evidenceId: `ev_audit_${Date.now()}`
    });

    console.log(`  ✓ Mission linked: '${missionLink.missionTitle}' (${missionLink.missionId})`);

    // 2. Reconstruct entire project history
    const history = await db.reconstructProjectHistory(testId);

    if (!history.project) throw new Error('Reconstruction missing project metadata');
    if (history.missions.length === 0) throw new Error('Reconstruction missing missions');
    if (history.events.length === 0) throw new Error('Reconstruction missing events');
    if (history.testRuns.length === 0) throw new Error('Reconstruction missing test runs');
    if (history.totalCostCents <= 0) throw new Error('Reconstruction failed to aggregate costs');

    console.log('  ✓ Full historical chain reconstructed deterministically:');
    console.log(`    - Project: ${history.project.name} (${history.project.id})`);
    console.log(`    - Missions linked: ${history.missions.length}`);
    console.log(`    - Audit events: ${history.events.length}`);
    console.log(`    - Test runs: ${history.testRuns.length}`);
    console.log(`    - Total aggregated cost: $${(history.totalCostCents / 100).toFixed(2)}`);
    console.log(`    - Total aggregated tokens: ${history.totalTokensUsed}`);
    console.log('  PASSED [Test F/6] - Project -> Mission Reconstruction Invariant Verified');
  } catch (err: any) {
    console.error('  ❌ FAILED [Test F/6]:', err.message);
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🏆 ALL 6/6 PHASE 1 PROJECT OS INVARIANT PROOFS PASSED (100%)');
    console.log('   Phase 1 is Certified Authoritative, Idempotent, and Non-Destructive.');
  } else {
    console.log('❌ SOME INVARIANT PROOFS FAILED.');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runPhase1InvariantsVerification().catch(e => {
  console.error('Verification failed with uncaught exception:', e);
  process.exit(1);
});
