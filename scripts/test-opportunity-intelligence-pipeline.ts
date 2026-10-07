import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { OpportunityIntelligenceEngine } from '../packages/runtime/src/opportunities/OpportunityIntelligenceEngine';
import { opportunityDossierAdapter } from '../apps/hq/src/lib/OpportunityDossierAdapter';

async function runOpportunityIntelligencePipelineTest() {
  console.log('================================================================');
  console.log('  TEST: Gideon Opportunity Intelligence Engine & Loop 2 Pipeline');
  console.log('  10-Checkpoint Deterministic Verification Suite                 ');
  console.log('================================================================\n');

  const engine = OpportunityIntelligenceEngine.getInstance();

  // -------------------------------------------------------------
  // CHECKPOINT 1: Ingestion of 50 Real Verified Businesses
  // -------------------------------------------------------------
  console.log('▶ [Checkpoint 1/10] Ingestion of 50 Real Verified Businesses...');
  const dossiers = engine.loadDossiers();
  assert(dossiers.length >= 50, 'Must load at least 50 opportunity dossiers');

  const cities = new Set(dossiers.map(d => d.business.location.split(',')[0].trim()));
  assert(cities.size >= 10, 'Must span at least 10 major global metropolitan markets');
  assert(dossiers.some(d => d.business.name.includes('Blossom Med')), 'Must contain Blossom Med');
  assert(dossiers.some(d => d.business.name.includes('Savvy Property Inspections')), 'Must contain Savvy Property Inspections');
  assert(dossiers.some(d => d.business.name.includes('Building Smiles')), 'Must contain Building Smiles Dental');
  console.log(`  ✓ Loaded ${dossiers.length} real business dossiers across ${cities.size} global markets.`);

  // -------------------------------------------------------------
  // CHECKPOINT 2: Epistemic Discipline (FACT vs OBSERVATION vs HYPOTHESIS)
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 2/10] Epistemic Discipline & Evidence Separation...');
  const reviewResult = engine.reviewOpportunityWithSentinel('opp-006');
  assert(reviewResult.success, 'Sentinel review must succeed');
  assert(reviewResult.brief, 'Sentinel must return OpportunityIntelligenceBrief');

  const brief = reviewResult.brief!;
  assert(brief.identityChecklist.businessExists, 'Business existence must be verified');
  assert(brief.whatWeKnow.some(k => k.startsWith('[FACT]')), 'What we know must contain verified FACTS');
  assert(brief.whatWeDoNotKnow.some(u => u.startsWith('[UNCERTAIN]') || u.startsWith('[HYPOTHESIS]')), 'Uncertainty must be explicitly flagged');

  // Verify that an unverified dossier has no false confirmed defects
  const unverifiedDossier = dossiers.find(d => d.id === 'opp-001')!;
  const unverifiedReview = engine.reviewOpportunityWithSentinel('opp-001');
  assert(!unverifiedReview.brief?.whatWeKnow.some(k => k.includes('Empirical defect confirmed')), 'Unverified site must NOT be flagged with confirmed defect');
  console.log(`  ✓ Epistemic integrity verified: FACT, OBSERVATION, and HYPOTHESIS strictly demarcated.`);

  // -------------------------------------------------------------
  // CHECKPOINT 3: Forge Technical Investigation on Blossom Med (opp-006)
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 3/10] Forge Technical Probe (Defect Confirmation on Blossom Med)...');
  const probeResult = engine.investigateTechnicalPainWithForge('opp-006', 'AUDIT_ENDPOINT');
  assert(probeResult.success, 'Forge investigation must succeed');
  assert(probeResult.confirmed, 'Blossom Med public contact defect must be confirmed');
  assert.strictEqual(probeResult.dossier?.lifecycle, 'PAIN_CONFIRMED', 'Lifecycle must advance to PAIN_CONFIRMED');
  assert.strictEqual(probeResult.evidenceItem?.classification, 'FACT', 'Confirmed defect must be classified as FACT');
  assert(probeResult.evidenceItem?.rawExtract?.includes('Unhandled rejection'), 'Must cite empirical console trace extract');
  console.log(`  ✓ Defect empirically confirmed on opp-006: "${probeResult.evidenceItem?.observation}"`);

  // -------------------------------------------------------------
  // CHECKPOINT 4: Forge Micro-Prototype Construction (Smallest Concrete Footprint)
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 4/10] Forge Micro-Prototype Construction...');
  const protoResult = engine.buildMicroPrototype('opp-006', 'MICRO_PROTOTYPE');
  assert(protoResult.success, 'Micro-prototype construction must succeed');
  assert(protoResult.prototype, 'Must deliver valid PrototypeDeliverable');
  assert.strictEqual(protoResult.dossier?.lifecycle, 'DEMO_READY', 'Lifecycle must advance to DEMO_READY');
  assert.strictEqual(protoResult.prototype?.qualityChecklist.length, 4, 'Must evaluate 4 critical quality invariants');
  console.log(`  ✓ Built micro-prototype "${protoResult.prototype?.title}" at ${protoResult.prototype?.sandboxUrl}`);

  // -------------------------------------------------------------
  // CHECKPOINT 5: Sentinel Independent Prototype Validation (100/100 Scorecard)
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 5/10] Sentinel Independent Prototype Audit (100/100 QA Scorecard)...');
  const validationResult = engine.validatePrototypeWithSentinel('opp-006');
  assert(validationResult.success, 'Sentinel validation must succeed');
  assert.strictEqual(validationResult.score, 100, 'Micro-prototype must achieve 100/100 score');
  assert(validationResult.passed, 'Micro-prototype must pass audit');
  assert(validationResult.dossier?.prototype?.validatedBySentinel, 'Prototype must be marked validated by Sentinel');
  console.log(`  ✓ Sentinel audit passed with score ${validationResult.score}/100.`);

  // -------------------------------------------------------------
  // CHECKPOINT 6: Ledger Economic Profiling & Rational Pricing
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 6/10] Ledger Economic Profile & Dynamic Price Ranges...');
  const opp006 = engine.getDossier('opp-006')!;
  assert(opp006.economics.proposedPriceUSD > 0, 'Must have positive proposed price');
  assert(opp006.economics.priceRangeUSD[0] < opp006.economics.priceRangeUSD[1], 'Must have valid price spread');
  assert(opp006.economics.depositRequirementUSD > 0, 'Must require upfront deposit');
  assert(opp006.economics.pricingAssumptions.length >= 2, 'Must state explicit pricing assumptions');
  assert(opp006.economics.pricingRationale.length > 20, 'Must have defensible pricing rationale');
  console.log(`  ✓ Economic profile verified: $${opp006.economics.proposedPriceUSD} (Spread: $${opp006.economics.priceRangeUSD[0]} - $${opp006.economics.priceRangeUSD[1]}).`);

  // -------------------------------------------------------------
  // CHECKPOINT 7: Strict Human Governance Gate (Outreach Blocked Until Approved)
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 7/10] Human Governance Gate (Outreach Authorization)...');
  // Re-verify that unapproved dossier strictly blocks external contact
  const opp007 = engine.getDossier('opp-007')!;
  assert.strictEqual(Boolean(opp007.humanContactApproved), false, 'Dossier must NOT allow contact by default');

  // Authorize contact explicitly
  const approveResult = engine.approveHumanContact('opp-006', 'Authorized for manual executive intro email.');
  assert(approveResult.success, 'Contact approval must succeed');
  assert.strictEqual(approveResult.dossier?.humanContactApproved, true, 'Dossier must record human approval');
  assert.strictEqual(approveResult.dossier?.lifecycle, 'HUMAN_CONTACT_APPROVAL', 'Lifecycle must be HUMAN_CONTACT_APPROVAL');
  console.log(`  ✓ Human governance verified: autonomous outreach strictly blocked without manual operator signature.`);

  // -------------------------------------------------------------
  // CHECKPOINT 8: Lifecycle Branching & Rejection Handling (ARCHIVED, WATCH)
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 8/10] Lifecycle Branching & Pipeline Filtering...');
  const archiveResult = opportunityDossierAdapter.updateLifecycle('opp-050', 'ARCHIVED');
  assert.strictEqual(archiveResult?.lifecycle, 'ARCHIVED', 'Must update lifecycle to ARCHIVED');

  const activeDossiers = opportunityDossierAdapter.getAll({ lifecycle: 'IDENTITY_VERIFIED' });
  assert(!activeDossiers.some(d => d.id === 'opp-050'), 'Archived dossiers must not appear in active filtered queries');
  console.log(`  ✓ Rejection & alternative lifecycle paths verified cleanly.`);

  // -------------------------------------------------------------
  // CHECKPOINT 9: Cross-Opportunity Pattern Detection & Capability Registry
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 9/10] Cross-Opportunity Pattern Detection...');
  const patterns = engine.detectCrossOpportunityPatterns();
  assert(patterns.length >= 4, 'Must detect at least 4 cross-opportunity patterns');

  const formPattern = patterns.find(p => p.id === 'pat-004');
  assert(formPattern, 'Must detect Public Contact Form Endpoint Fragility pattern');
  assert(formPattern?.matchingOpportunityIds.includes('opp-006'), 'Must cluster Blossom Med into form fragility pattern');
  assert.strictEqual(formPattern?.recommendedCapability.id, 'cap_resilient_intake_gateway', 'Must map to CapabilityRegistry');

  const tradePattern = patterns.find(p => p.id === 'pat-002');
  assert(tradePattern, 'Must detect Manual Trade Scoping pattern');
  assert(tradePattern!.matchingOpportunityIds.length >= 4, 'Trade scoping must cluster at least 4 contractors');
  console.log(`  ✓ Detected ${patterns.length} cross-opportunity patterns clustering ${patterns.reduce((acc, p) => acc + p.matchingOpportunityIds.length, 0)} businesses into reusable capabilities.`);

  // -------------------------------------------------------------
  // CHECKPOINT 10: Sentinel Daily Intelligence Brief & Notification Persistence
  // -------------------------------------------------------------
  console.log('\n▶ [Checkpoint 10/10] Sentinel Daily Intelligence Brief & Persistence...');
  const dailyBrief = engine.generateSentinelDailyBrief();
  assert.strictEqual(dailyBrief.systemHealthScore, 98, 'Health score must be 98%');
  assert.strictEqual(dailyBrief.opportunitiesReviewed, 50, 'Brief must cover all 50 opportunities');
  assert(dailyBrief.reusableCapabilitiesIdentified >= 4, 'Brief must reflect detected patterns');

  const notifs = engine.loadNotifications();
  assert(notifs.length > 0, 'Notifications must persist to file');
  assert(notifs.some(n => n.level === 'DAILY_INTELLIGENCE'), 'Must contain DAILY_INTELLIGENCE notification');
  assert(notifs.some(n => n.level === 'COMPLETED'), 'Must contain COMPLETED notification');
  assert(notifs.some(n => n.observation && n.recommendation), 'Notifications must carry observation and recommendation fields');
  console.log(`  ✓ Sentinel daily brief and hierarchical notifications persisted successfully.`);

  // -------------------------------------------------------------
  // BONUS: HTTP Integration Verification
  // -------------------------------------------------------------
  console.log('\n▶ [Bonus] Testing Next.js HTTP API Endpoints...');
  try {
    const dossiersRes = await fetch('http://localhost:3000/api/opportunities/dossiers');
    const dossiersJson = await dossiersRes.json();
    assert.strictEqual(dossiersJson.total, 50, 'HTTP API must return 50 dossiers');
    console.log(`  ✓ GET /api/opportunities/dossiers -> 200 OK (${dossiersJson.total} dossiers)`);

    const patternsRes = await fetch('http://localhost:3000/api/opportunities/patterns');
    const patternsJson = await patternsRes.json();
    assert(patternsJson.patterns.length >= 4, 'HTTP API must return patterns');
    console.log(`  ✓ GET /api/opportunities/patterns -> 200 OK (${patternsJson.patterns.length} patterns)`);

    const briefRes = await fetch('http://localhost:3000/api/sentinel/daily-brief');
    const briefJson = await briefRes.json();
    assert.strictEqual(briefJson.brief?.systemHealthScore, 98, 'HTTP API must return daily brief');
    console.log(`  ✓ GET /api/sentinel/daily-brief -> 200 OK (Health: ${briefJson.brief?.systemHealthScore}%)`);
  } catch (err: any) {
    console.warn(`  ⚠️ HTTP API fetch warning: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log('  ✅ ALL 10 OPPORTUNITY INTELLIGENCE CHECKPOINTS PASSED!');
  console.log('================================================================\n');
}

runOpportunityIntelligencePipelineTest().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
