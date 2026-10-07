/**
 * ==============================================================================
 * GIDEON AI HQ — PHASE 2D: VERIFIED LESSON STORE VERIFICATION
 * 
 * 8 Rigorous Lesson State Machine & Authority Invariant Proofs:
 * 1. Valid Sequential Transitions (OBSERVED -> PROPOSED -> REVIEWED -> VERIFIED -> ORGANIZATIONAL_MEMORY)
 * 2. Illegal Leap Rejections (Strict state machine progression)
 * 3. Independent Evidence Validation (Unresolvable references rejected)
 * 4. Actor Authority Gates (Forge rejected, Sentinel QA / Human Admin enforced)
 * 5. Confidence != Truth (0.99 confidence unverified lessons excluded from context)
 * 6. Distinct Project Invariant (>= 3 distinct project IDs required for ORGANIZATIONAL_MEMORY)
 * 7. Optimistic Concurrency Control (OCC prevents double-promotion collisions)
 * 8. Non-Authoritative Cache Semantics (.gideon/lessons_cache.json is read-only)
 * 
 * Plus Integration Proof: Verified lesson present in Forge pack, unverified absent.
 * ==============================================================================
 */

import path from 'path';
import { 
  VerifiedLessonStore, 
  LessonTransitionError, 
  LessonEvidenceError, 
  LessonAuthorityError, 
  LessonConcurrencyConflictError 
} from '../packages/memory/src/VerifiedLessonStore';
import { ProjectContextPackBuilder } from '../packages/memory/src/ProjectContextPackBuilder';
import { ProjectRecord } from '../packages/shared/src';

async function runStep4LessonStoreTests() {
  console.log('================================================================');
  console.log('🏛️  GIDEON AI HQ — PHASE 2D: VERIFIED LESSON STORE PROOFS');
  console.log('    Hard State Machine, OCC Concurrency & Provenance Verification');
  console.log('================================================================\n');

  let allPassed = true;
  const testCachePath = path.resolve(process.cwd(), '.gideon', 'test_lessons_cache.json');
  const store = new VerifiedLessonStore({ cachePath: testCachePath });

  // --------------------------------------------------------------------------
  // PROOF 1: VALID SEQUENTIAL TRANSITIONS
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 1/8] Verifying Valid Sequential Transitions...');
  try {
    // 1. Create (starts at OBSERVED, rev 1)
    const lesson = await store.createLesson({
      key: 'test_port_isolation_rule',
      category: 'TECHNICAL',
      statement: 'Project test runners must bind only to ports allocated in the 4100-4199 range',
      rationale: 'Avoid TCP port collision with HQ dev server on 3000 and OpenClaw on 18789',
      source: {
        projectId: 'proj_b2b',
        agentId: 'forge',
        missionId: 'mission_001'
      },
      confidence: 0.95
    });

    if (lesson.verificationStatus !== 'OBSERVED' || lesson.revision !== 1) {
      throw new Error(`Initial lesson status was '${lesson.verificationStatus}', revision was ${lesson.revision}`);
    }

    // 2. Propose (OBSERVED -> PROPOSED, rev 2)
    const proposed = await store.proposeLesson(lesson.id, 'forge', 1);
    if (proposed.verificationStatus !== 'PROPOSED' || proposed.revision !== 2) {
      throw new Error(`Propose transition failed: status=${proposed.verificationStatus}, rev=${proposed.revision}`);
    }

    // 3. Review (PROPOSED -> REVIEWED, rev 3)
    const reviewed = await store.reviewLesson(lesson.id, 'sentinel', 2, 'Syntactically valid port isolation constraint');
    if (reviewed.verificationStatus !== 'REVIEWED' || reviewed.revision !== 3) {
      throw new Error(`Review transition failed: status=${reviewed.verificationStatus}, rev=${reviewed.revision}`);
    }

    // 4. Verify (REVIEWED -> VERIFIED, rev 4)
    const verified = await store.verifyLesson(
      lesson.id, 
      'sentinel', 
      3, 
      ['ev-qa-approve-1790285020564'],
      () => true // simulate valid cryptographic resolver
    );
    if (verified.verificationStatus !== 'VERIFIED' || verified.revision !== 4) {
      throw new Error(`Verify transition failed: status=${verified.verificationStatus}, rev=${verified.revision}`);
    }

    // 5. Promote to Organizational Memory (VERIFIED -> ORGANIZATIONAL_MEMORY, rev 5)
    const org = await store.promoteToOrganizationalMemory(
      lesson.id, 
      'human', 
      4, 
      ['proj_b2b', 'proj_stripe', 'proj_portal'] // 3 distinct projects
    );
    if (org.verificationStatus !== 'ORGANIZATIONAL_MEMORY' || org.revision !== 5) {
      throw new Error(`Organizational promotion failed: status=${org.verificationStatus}, rev=${org.revision}`);
    }

    console.log('  ✓ Step-by-step sequential progression verified:');
    console.log('    OBSERVED (rev 1) -> PROPOSED (rev 2) -> REVIEWED (rev 3) -> VERIFIED (rev 4) -> ORGANIZATIONAL_MEMORY (rev 5)');
    console.log('  PASSED [Proof 1/8] - Valid Sequential Transitions Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 1/8]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 2: ILLEGAL LEAP REJECTIONS
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 2/8] Verifying Illegal State Machine Leaps Rejected...');
  try {
    const freshLesson = await store.createLesson({
      key: 'test_illegal_leap',
      category: 'TECHNICAL',
      statement: 'Illegal leap attempt',
      rationale: 'Testing state machine guard',
      source: { agentId: 'forge' },
      confidence: 0.99
    });

    // Attempt illegal leap: OBSERVED -> ORGANIZATIONAL_MEMORY
    let leapBlocked = false;
    try {
      await store.promoteToOrganizationalMemory(freshLesson.id, 'human', 1, ['p1', 'p2', 'p3']);
    } catch (e: any) {
      if (e instanceof LessonTransitionError) {
        leapBlocked = true;
      }
    }
    if (!leapBlocked) {
      throw new Error('State machine failed to block illegal leap from OBSERVED to ORGANIZATIONAL_MEMORY!');
    }

    // Attempt illegal shortcut: OBSERVED -> VERIFIED (skipping PROPOSED and REVIEWED)
    let shortcutBlocked = false;
    try {
      await store.verifyLesson(freshLesson.id, 'sentinel', 1, ['ev-001'], () => true);
    } catch (e: any) {
      if (e instanceof LessonTransitionError) {
        shortcutBlocked = true;
      }
    }
    if (!shortcutBlocked) {
      throw new Error('State machine failed to block illegal shortcut from OBSERVED to VERIFIED!');
    }

    console.log('  ✓ Direct leap OBSERVED -> ORGANIZATIONAL_MEMORY blocked by state machine');
    console.log('  ✓ Direct shortcut OBSERVED -> VERIFIED blocked by state machine');
    console.log('  PASSED [Proof 2/8] - Illegal State Machine Leaps Rejected');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 2/8]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 3: INDEPENDENT EVIDENCE VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 3/8] Verifying Independent Evidence Validation...');
  try {
    const l3 = await store.createLesson({
      key: 'test_evidence_rule',
      category: 'TECHNICAL',
      statement: 'Must have independently resolvable evidence',
      rationale: 'Evidence audit',
      source: { agentId: 'forge' },
      confidence: 0.9
    });
    await store.proposeLesson(l3.id, 'forge', 1);
    await store.reviewLesson(l3.id, 'sentinel', 2);

    // 1. Empty evidence IDs rejected
    let emptyBlocked = false;
    try {
      await store.verifyLesson(l3.id, 'sentinel', 3, []);
    } catch (e: any) {
      if (e instanceof LessonEvidenceError) emptyBlocked = true;
    }
    if (!emptyBlocked) {
      throw new Error('Failed to reject empty evidence list for verification');
    }

    // 2. Unresolvable fake evidence rejected
    let fakeBlocked = false;
    try {
      await store.verifyLesson(
        l3.id, 
        'sentinel', 
        3, 
        ['ev-fake-fabricated-signature-999'], 
        () => false // resolver rejects
      );
    } catch (e: any) {
      if (e instanceof LessonEvidenceError) fakeBlocked = true;
    }
    if (!fakeBlocked) {
      throw new Error('Failed to reject unresolvable fake evidence citation!');
    }

    console.log('  ✓ Empty evidence array rejected: evidence is mandatory');
    console.log('  ✓ Unresolvable evidence ID rejected by independent resolver');
    console.log('  PASSED [Proof 3/8] - Independent Evidence Validation Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 3/8]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 4: ACTOR AUTHORITY ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 4/8] Verifying Actor Authority Enforcement...');
  try {
    const l4 = await store.createLesson({
      key: 'test_authority_rule',
      category: 'TECHNICAL',
      statement: 'Testing actor authority',
      rationale: 'Authority check',
      source: { agentId: 'forge' },
      confidence: 0.8
    });
    await store.proposeLesson(l4.id, 'forge', 1);

    // 1. Forge cannot review
    let forgeReviewBlocked = false;
    try {
      await store.reviewLesson(l4.id, 'forge', 2);
    } catch (e: any) {
      if (e instanceof LessonAuthorityError) forgeReviewBlocked = true;
    }
    if (!forgeReviewBlocked) {
      throw new Error('Failed to block Forge from reviewing its own lesson!');
    }

    // Advance to REVIEWED with Sentinel
    await store.reviewLesson(l4.id, 'sentinel', 2);

    // 2. Forge cannot verify
    let forgeVerifyBlocked = false;
    try {
      await store.verifyLesson(l4.id, 'forge', 3, ['ev-test'], () => true);
    } catch (e: any) {
      if (e instanceof LessonAuthorityError) forgeVerifyBlocked = true;
    }
    if (!forgeVerifyBlocked) {
      throw new Error('Failed to block Forge from verifying lesson!');
    }

    // Advance to VERIFIED with Sentinel
    await store.verifyLesson(l4.id, 'sentinel', 3, ['ev-test'], () => true);

    // 3. Sentinel cannot promote to ORGANIZATIONAL_MEMORY (Human Admin only)
    let sentinelOrgBlocked = false;
    try {
      await store.promoteToOrganizationalMemory(l4.id, 'sentinel', 4, ['p1', 'p2', 'p3']);
    } catch (e: any) {
      if (e instanceof LessonAuthorityError) sentinelOrgBlocked = true;
    }
    if (!sentinelOrgBlocked) {
      throw new Error('Failed to block Sentinel from promoting to ORGANIZATIONAL_MEMORY!');
    }

    console.log('  ✓ Forge blocked from reviewing or verifying lessons');
    console.log('  ✓ Sentinel blocked from promoting to ORGANIZATIONAL_MEMORY (Human Admin only)');
    console.log('  PASSED [Proof 4/8] - Actor Authority Enforcement Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 4/8]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 5: CONFIDENCE != TRUTH INVARIANT
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 5/8] Verifying Confidence != Truth Invariant...');
  try {
    // Create an OBSERVED lesson with 99.9% statistical confidence
    const unverifiedLesson = await store.createLesson({
      key: 'test_high_confidence_unverified',
      category: 'TECHNICAL',
      statement: 'Speculative pattern with 0.99 confidence',
      rationale: 'Statistical correlation without QA verification',
      source: { agentId: 'forge' },
      confidence: 0.99
    });

    // Check authorized lessons for pack
    const authorized = store.getAuthorizedLessonsForPack('proj_b2b');
    const leaked = authorized.find(l => l.id === unverifiedLesson.id);

    if (leaked) {
      throw new Error('Security Invariant Violated: Unverified lesson leaked into Context Pack due to high confidence!');
    }

    console.log('  ✓ High-confidence lesson (0.99) in OBSERVED state strictly excluded from Context Pack');
    console.log('  ✓ Status (VERIFIED/ORGANIZATIONAL_MEMORY) is the sole authority signal, not confidence');
    console.log('  PASSED [Proof 5/8] - Confidence != Truth Invariant Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 5/8]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 6: DISTINCT PROJECT REQUIREMENT (>= 3 DISTINCT PROJECTS)
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 6/8] Verifying Distinct Project Requirement (>= 3 Distinct Projects)...');
  try {
    const l6 = await store.createLesson({
      key: 'test_distinct_projects',
      category: 'TECHNICAL',
      statement: 'Must be proven in 3 distinct projects',
      rationale: 'Cross-project generalization',
      source: { agentId: 'forge', projectId: 'proj_alpha' },
      confidence: 0.85
    });
    await store.proposeLesson(l6.id, 'forge', 1);
    await store.reviewLesson(l6.id, 'sentinel', 2);
    await store.verifyLesson(l6.id, 'sentinel', 3, ['ev-test-1'], () => true);

    // 1. Attempt promotion with same project 3 times: ['proj_alpha', 'proj_alpha', 'proj_alpha']
    let duplicateBlocked = false;
    try {
      await store.promoteToOrganizationalMemory(
        l6.id, 
        'human', 
        4, 
        ['proj_alpha', 'proj_alpha', 'proj_alpha']
      );
    } catch (e: any) {
      if (e instanceof LessonTransitionError) duplicateBlocked = true;
    }
    if (!duplicateBlocked) {
      throw new Error('Failed to block organizational promotion when 3 references are from the SAME project!');
    }

    // 2. Promotion with 3 truly distinct projects succeeds
    const orgPromoted = await store.promoteToOrganizationalMemory(
      l6.id, 
      'human', 
      4, 
      ['proj_alpha', 'proj_beta', 'proj_gamma']
    );

    if (orgPromoted.verificationStatus !== 'ORGANIZATIONAL_MEMORY') {
      throw new Error('Failed to promote with 3 distinct projects');
    }

    console.log('  ✓ Duplicate references of same project rejected (distinctProjectIds.size < 3)');
    console.log('  ✓ Validated across 3 distinct projects successfully promoted to ORGANIZATIONAL_MEMORY');
    console.log('  PASSED [Proof 6/8] - Distinct Project Requirement Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 6/8]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 7: OPTIMISTIC CONCURRENCY CONTROL (OCC)
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 7/8] Verifying Optimistic Concurrency Control (OCC)...');
  try {
    const l7 = await store.createLesson({
      key: 'test_occ_race',
      category: 'TECHNICAL',
      statement: 'Testing concurrent modification race',
      rationale: 'OCC collision check',
      source: { agentId: 'forge' },
      confidence: 0.9
    });

    // Both Sentinel A and Sentinel B read lesson at revision 1
    // Writer A proposes lesson with expectedRevision 1 -> succeeds, revision bumps to 2
    await store.proposeLesson(l7.id, 'forge', 1);

    // Writer B attempts propose with expectedRevision 1 -> MUST throw concurrency conflict
    let conflictCaught = false;
    try {
      await store.proposeLesson(l7.id, 'scout', 1);
    } catch (e: any) {
      if (e instanceof LessonConcurrencyConflictError) conflictCaught = true;
    }

    if (!conflictCaught) {
      throw new Error('Optimistic Concurrency Control failed to detect revision conflict!');
    }

    console.log('  ✓ Writer 1 succeeded: revision bumped 1 -> 2');
    console.log('  ✓ Writer 2 conflict caught: "Concurrency Conflict: Lesson revision mismatch."');
    console.log('  PASSED [Proof 7/8] - Optimistic Concurrency Control Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 7/8]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 8: NON-AUTHORITATIVE CACHE SEMANTICS
  // --------------------------------------------------------------------------
  console.log('\n▶ [Proof 8/8] Verifying Non-Authoritative Cache Semantics...');
  try {
    // Verify test_lessons_cache.json exists and has isAuthoritative: false
    const fs = await import('fs');
    if (!fs.existsSync(testCachePath)) {
      throw new Error('Local lessons cache file was not created');
    }

    const rawCache = JSON.parse(fs.readFileSync(testCachePath, 'utf8'));
    if (rawCache.isAuthoritative !== false) {
      throw new Error('Cache violation: Cache payload should explicitly declare isAuthoritative: false');
    }
    if (rawCache.source !== 'supabase') {
      throw new Error('Cache violation: Cache source should indicate primary source "supabase"');
    }
    if (typeof rawCache.sourceRevision !== 'number') {
      throw new Error('Cache violation: Cache missing sourceRevision tracking');
    }

    console.log('  ✓ Local cache explicitly declared non-authoritative: isAuthoritative = false');
    console.log('  ✓ Authoritative source tracked: source = "supabase", sourceRevision = ' + rawCache.sourceRevision);
    console.log('  PASSED [Proof 8/8] - Non-Authoritative Cache Semantics Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 8/8]:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // INTEGRATION PROOF: CONTEXT PACK BUILDER INTEGRATION
  // --------------------------------------------------------------------------
  console.log('\n▶ [Integration Proof] Context Pack Builder Integration with VerifiedLessonStore...');
  try {
    const sampleProject: ProjectRecord = {
      id: 'proj_integration_test',
      slug: 'integration-test',
      name: 'Integration Test Project',
      category: 'SAAS',
      status: 'QA_VERIFIED',
      workspacePath: 'projects/integration-test',
      currentVersion: 'v1.0.0',
      revision: 10,
      businessObjective: 'Verify Context Pack builder integration',
      pricingCents: 1000,
      currency: 'USD',
      buildCostCents: 100,
      totalTokensUsed: 5000,
      healthStatus: 'HEALTHY',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Prepare store with 1 VERIFIED lesson and 1 PROPOSED lesson
    const verifiedLesson = await store.createLesson({
      key: 'rule_verified_integration',
      category: 'TECHNICAL',
      statement: 'Verified rule for Forge',
      rationale: 'Test',
      source: { agentId: 'forge', projectId: sampleProject.id },
      confidence: 0.95
    });
    await store.proposeLesson(verifiedLesson.id, 'forge', 1);
    await store.reviewLesson(verifiedLesson.id, 'sentinel', 2);
    await store.verifyLesson(verifiedLesson.id, 'sentinel', 3, ['ev-test-100'], () => true);

    const proposedLesson = await store.createLesson({
      key: 'rule_unverified_integration',
      category: 'TECHNICAL',
      statement: 'Unverified rule that should be filtered out',
      rationale: 'Test',
      source: { agentId: 'forge', projectId: sampleProject.id },
      confidence: 0.99
    });
    await store.proposeLesson(proposedLesson.id, 'forge', 1);

    // Create dataSource pointing to store
    const dataSource = {
      getProjectById: async () => sampleProject,
      getProjectMissions: async () => [],
      getEvents: async () => [],
      getTestRuns: async () => [],
      getVerifiedLessons: async (projId: string) => store.getAuthorizedLessonsForPack(projId)
    };

    const builder = new ProjectContextPackBuilder(dataSource);
    const forgePack = await builder.buildPack(sampleProject.id, 'forge');

    const containsVerified = forgePack.verifiedLessons.some(l => l.id === verifiedLesson.id);
    const containsProposed = forgePack.verifiedLessons.some(l => l.id === proposedLesson.id);

    if (!containsVerified) {
      throw new Error('Integration error: VERIFIED lesson was omitted from Forge context pack!');
    }
    if (containsProposed) {
      throw new Error('Integration error: PROPOSED (unverified) lesson was leaked into Forge context pack!');
    }

    console.log('  ✓ Forge context pack contains VERIFIED lesson');
    console.log('  ✓ Forge context pack excludes PROPOSED lesson');
    console.log('  PASSED [Integration Proof] - Context Pack Builder Integration Certified');
  } catch (err: any) {
    console.error('  ❌ FAILED [Integration Proof]:', err.message);
    allPassed = false;
  }

  // Cleanup test cache
  try {
    const fs = await import('fs');
    if (fs.existsSync(testCachePath)) fs.unlinkSync(testCachePath);
  } catch {}

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🏆 ALL 8/8 PHASE 2D VERIFIED LESSON STORE PROOFS PASSED (100%)');
    console.log('   Plus Integration Proof Certified.');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('❌ SOME PHASE 2D PROOFS FAILED.');
    console.log('================================================================\n');
    process.exit(1);
  }
}

runStep4LessonStoreTests();
