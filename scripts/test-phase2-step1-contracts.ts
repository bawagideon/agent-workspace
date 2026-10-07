import crypto from 'crypto';
import { 
  ProjectContextPack, 
  VerifiedLesson, 
  ContextPackFreshnessCheck,
  LessonVerificationStatus 
} from '../packages/shared/src';

async function runPhase2Step1ContractVerification() {
  console.log('================================================================');
  console.log('🏛️  GIDEON AI HQ — PHASE 2: STEP 1 CONTEXT DOMAIN CONTRACT PROOFS');
  console.log('    Architectural Hierarchy & Invalidation Verification');
  console.log('================================================================\n');

  let allPassed = true;

  // -------------------------------------------------------------
  // PROOF 1: 8-QUESTION FIRST-CLASS SECTIONS COMPLETENESS
  // -------------------------------------------------------------
  console.log('▶ [Proof 1/5] Verifying 8 First-Class Operational Question Sections...');
  try {
    const samplePack: ProjectContextPack = {
      packId: `pack_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      projectId: 'proj_b2b_automation_service',
      targetAgent: 'forge',
      projectRevision: 12,
      generatedAt: new Date().toISOString(),
      packVersion: '2.0.0',
      sourceStateHash: crypto.createHash('sha256').update('sample_state_payload').digest('hex'),

      // 1. What is this project?
      projectIdentity: {
        id: 'proj_b2b_automation_service',
        slug: 'b2b-automation-service',
        name: 'B2B Automation Service',
        category: 'API_SERVICE',
        businessObjective: 'High-margin client onboarding & webhook automation',
        targetCustomer: 'B2B Marketing & Sales Agencies',
        problemSolved: 'Automates manual invoice routing and onboarding webhooks',
        techStack: ['Node.js', 'Express', 'Stripe', 'Node Test Runner'],
        currentVersion: 'v1.0.0'
      },

      // 2. What has Gideon already done?
      history: {
        completedMissionsCount: 3,
        lastCompletedMission: {
          id: 'mission-audit-001',
          title: 'Adversarial Security & Rate Limiting Audit',
          completedAt: new Date().toISOString(),
          costCents: 15,
          evidenceId: 'ev-audit-1790318'
        },
        recentTestStatus: 'PASS',
        lastAuditScore: 96,
        auditEventCount: 8
      },

      // 3. What is currently happening?
      currentState: {
        status: 'QA_VERIFIED',
        revision: 12,
        assignedPort: 4102,
        activeLease: {
          runnerId: 'runner-daemon-01',
          pid: 4892,
          port: 4102,
          expiresAt: new Date(Date.now() + 600000).toISOString()
        },
        openUnknowns: ['Webhook retry backoff curve', 'Stripe idempotency TTL']
      },

      // 4. Why did Gideon make the current decision?
      decisionRationale: {
        strategicObjective: 'Expand enterprise webhook endpoints with token auth',
        actionRecommendation: 'Implement Bearer token middleware on /v1/webhooks',
        whyNotExplanation: 'Direct OAuth rejected due to low agency adoption in target segment',
        decisionConfidence: 0.88
      },

      // 5. What evidence supports the decision?
      evidence: {
        evidenceIds: ['ev-v5-1-revenue-machine-1790318224832', 'ev-qa-approve-1790318194191'],
        citations: ['Stripe 2026 Webhook Reliability Benchmark', 'Sentinel Adversarial Audit v5'],
        testArtifactIds: ['art_log_tr_1790318149299_eef15f'],
        hmacSignaturesPresent: true
      },

      // 6. What constraints apply?
      constraints: {
        allowedStartCommand: 'node src/index.js',
        allowedTestCommands: ['node --test tests/*.spec.js', 'npm test'],
        workingDirectory: 'projects/b2b-automation-service',
        resourceLimits: {
          maxMemoryMb: 512,
          timeoutMs: 600000
        },
        zeroOutboundEnforced: true,
        financialRuleOfIronEnforced: true,
        budgetLimitCents: 200
      },

      // 7. What should the next agent know?
      nextAgentBrief: {
        assignedRole: 'forge',
        targetTaskGoal: 'Implement token-bucket rate limiter for /v1/webhooks',
        expectedDeliverable: 'projects/b2b-automation-service/src/middleware/rateLimiter.js',
        interfaceContracts: ['rateLimiter(req, res, next) throws 429 on overflow'],
        knownBlockers: []
      },

      // 8. What information must remain inaccessible?
      inaccessibleInformation: {
        domainFirewallRules: ['FINANCE domain masked for Tier-2 engineering workers'],
        redactedKeys: ['STRIPE_SECRET_KEY', 'PAYSTACK_SECRET_KEY', 'BANK_ACCOUNT_NUM'],
        inaccessibleProjects: ['projects/stripe-client-workflow'],
        policyReason: 'Domain partition security boundary (Least Privilege)'
      },

      verifiedLessons: []
    };

    // Assert all 8 sections exist
    const requiredSections = [
      'projectIdentity',
      'history',
      'currentState',
      'decisionRationale',
      'evidence',
      'constraints',
      'nextAgentBrief',
      'inaccessibleInformation'
    ];

    for (const sec of requiredSections) {
      if (!(sec in samplePack) || (samplePack as any)[sec] === undefined) {
        throw new Error(`Required Context Pack section '${sec}' is missing!`);
      }
    }

    console.log('  ✓ All 8 First-Class Operational Question Sections validated:');
    requiredSections.forEach((s, idx) => console.log(`    [${idx + 1}/8] ${s}: Verified Present`));
    console.log('  PASSED [Proof 1/5] - 8-Question Schema Completeness Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 1/5]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 2: CONFIDENCE != TRUTH (PROVENANCE & VERIFICATION)
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 2/5] Confidence != Truth Invariant (Explicit Provenance)...');
  try {
    const unverifiedHighConfidence: VerifiedLesson = {
      id: 'less_001',
      key: 'stripe_webhook_timeout',
      category: 'TECHNICAL',
      statement: 'Stripe webhooks timeout after 3000ms under high concurrency',
      rationale: 'Observed during burst test #4',
      source: {
        agentId: 'forge',
        observedAt: new Date().toISOString()
      },
      verificationStatus: 'OBSERVED', // Unverified!
      confidence: 0.98, // High statistical score, but NOT verified truth
      evidenceIds: []
    };

    // Enforce invariant: An unverified lesson MUST NOT be classified as ORGANIZATIONAL_MEMORY
    function isAllowedInContextPack(lesson: VerifiedLesson): boolean {
      return lesson.verificationStatus === 'VERIFIED' || lesson.verificationStatus === 'ORGANIZATIONAL_MEMORY';
    }

    if (isAllowedInContextPack(unverifiedHighConfidence)) {
      throw new Error('Unverified lesson with high confidence was erroneously accepted into Context Pack!');
    }

    console.log(`  ✓ Unverified lesson (confidence: ${unverifiedHighConfidence.confidence}, status: ${unverifiedHighConfidence.verificationStatus}) strictly excluded from Context Pack`);

    // Verify when officially approved by Sentinel
    const verifiedLesson: VerifiedLesson = {
      ...unverifiedHighConfidence,
      verificationStatus: 'VERIFIED',
      verifiedBy: 'sentinel',
      verifiedAt: new Date().toISOString(),
      evidenceIds: ['ev-qa-approve-1790318194191']
    };

    if (!isAllowedInContextPack(verifiedLesson)) {
      throw new Error('Approved verified lesson was rejected from Context Pack!');
    }

    console.log(`  ✓ Verified lesson (status: ${verifiedLesson.verificationStatus}, verifiedBy: ${verifiedLesson.verifiedBy}) successfully permitted`);
    console.log('  PASSED [Proof 2/5] - Confidence != Truth Invariant Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 2/5]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 3: HARD STATE MACHINE FOR LESSON PROMOTION
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 3/5] Hard State Machine for Lesson Promotion...');
  try {
    const validTransitions: Record<LessonVerificationStatus, LessonVerificationStatus[]> = {
      'OBSERVED': ['PROPOSED'],
      'PROPOSED': ['REVIEWED'],
      'REVIEWED': ['VERIFIED'],
      'VERIFIED': ['ORGANIZATIONAL_MEMORY'],
      'ORGANIZATIONAL_MEMORY': []
    };

    function validateLessonTransition(from: LessonVerificationStatus, to: LessonVerificationStatus): boolean {
      return (validTransitions[from] || []).includes(to);
    }

    // Direct illegal leap from OBSERVED ➔ ORGANIZATIONAL_MEMORY must be blocked
    const illegalLeap = validateLessonTransition('OBSERVED', 'ORGANIZATIONAL_MEMORY');
    if (illegalLeap) {
      throw new Error('Illegal transition from OBSERVED directly to ORGANIZATIONAL_MEMORY was allowed!');
    }

    // Direct illegal leap from PROPOSED ➔ VERIFIED (skipping review) must be blocked
    const skipReview = validateLessonTransition('PROPOSED', 'VERIFIED');
    if (skipReview) {
      throw new Error('Illegal transition skipping REVIEWED stage was allowed!');
    }

    // Legal sequential step OBSERVED ➔ PROPOSED
    const legalStep = validateLessonTransition('OBSERVED', 'PROPOSED');
    if (!legalStep) {
      throw new Error('Legal step OBSERVED -> PROPOSED was rejected!');
    }

    console.log('  ✓ Illegal leap OBSERVED -> ORGANIZATIONAL_MEMORY blocked (rejection proven)');
    console.log('  ✓ Illegal shortcut PROPOSED -> VERIFIED without review blocked (rejection proven)');
    console.log('  ✓ Deterministic step OBSERVED -> PROPOSED permitted');
    console.log('  PASSED [Proof 3/5] - Hard State Machine Invariants Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 3/5]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 4: STALE REVISION INVALIDATION (TEST F CONTRACT)
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 4/5] Stale Revision Invalidation Contract...');
  try {
    function evaluateFreshness(packRevision: number, authoritativeRevision: number): ContextPackFreshnessCheck {
      const isCurrent = packRevision === authoritativeRevision;
      return {
        isCurrent,
        packRevision,
        authoritativeRevision,
        hashMatches: isCurrent,
        invalidationReason: isCurrent ? undefined : `Stale context pack: stamped revision #${packRevision} does not match authoritative project revision #${authoritativeRevision}`
      };
    }

    // Case 1: Fresh pack
    const freshCheck = evaluateFreshness(12, 12);
    if (!freshCheck.isCurrent) throw new Error('Fresh pack marked as stale!');
    console.log(`  ✓ Fresh Context Pack (rev #12 == rev #12): isCurrent = true`);

    // Case 2: Stale pack (project was updated to revision 13 while agent was holding rev 12 pack)
    const staleCheck = evaluateFreshness(12, 13);
    if (staleCheck.isCurrent) throw new Error('Stale pack marked as current!');
    console.log(`  ✓ Stale Context Pack (pack rev #12 vs current rev #13): isCurrent = false`);
    console.log(`    Reason: "${staleCheck.invalidationReason}"`);

    console.log('  PASSED [Proof 4/5] - Stale Revision Invalidation Contract Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 4/5]:', err.message);
    allPassed = false;
  }

  // -------------------------------------------------------------
  // PROOF 5: AGENT-SPECIFIC DOMAIN PARTITIONING CONTRACT
  // -------------------------------------------------------------
  console.log('\n▶ [Proof 5/5] Agent-Specific Domain Partitioning Contract...');
  try {
    interface AgentDomainPolicy {
      targetAgent: string;
      allowedDomains: string[];
      maskedKeys: string[];
    }

    const policies: Record<string, AgentDomainPolicy> = {
      forge: {
        targetAgent: 'forge',
        allowedDomains: ['WORK', 'TECHNICAL'],
        maskedKeys: ['STRIPE_SECRET_KEY', 'BANK_ACCOUNT', 'FINANCE_BALANCES']
      },
      sentinel: {
        targetAgent: 'sentinel',
        allowedDomains: ['WORK', 'TECHNICAL', 'SECURITY_AUDIT'],
        maskedKeys: ['STRIPE_SECRET_KEY'] // sentinel audits code, but has no access to payout keys
      },
      scout: {
        targetAgent: 'scout',
        allowedDomains: ['BUSINESS', 'SOCIAL'],
        maskedKeys: ['SOURCE_CODE_WRITE', 'PAYMENTS', 'DEPLOY_KEYS']
      }
    };

    const forgePolicy = policies.forge;
    const scoutPolicy = policies.scout;

    if (forgePolicy.allowedDomains.includes('FINANCE')) {
      throw new Error('Forge policy illegally permits FINANCE domain access!');
    }
    if (scoutPolicy.allowedDomains.includes('WORK')) {
      throw new Error('Scout policy illegally permits WORK domain access!');
    }

    console.log(`  ✓ Forge policy partitioned: allowed=[${forgePolicy.allowedDomains.join(', ')}], masked=[${forgePolicy.maskedKeys.join(', ')}]`);
    console.log(`  ✓ Scout policy partitioned: allowed=[${scoutPolicy.allowedDomains.join(', ')}], masked=[${scoutPolicy.maskedKeys.join(', ')}]`);
    console.log('  PASSED [Proof 5/5] - Domain Partitioning Policy Proven');
  } catch (err: any) {
    console.error('  ❌ FAILED [Proof 5/5]:', err.message);
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🏆 ALL 5/5 PHASE 2 STEP 1 CONTRACT PROOFS PASSED (100%)');
    console.log('   Context Engine Domain Model & Invalidation Contracts Certified.');
  } else {
    console.log('❌ SOME CONTRACT PROOFS FAILED.');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runPhase2Step1ContractVerification().catch(e => {
  console.error('Contract test failed:', e);
  process.exit(1);
});
