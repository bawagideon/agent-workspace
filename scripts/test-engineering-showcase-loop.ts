import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  EvidenceExtractor,
  ClaimValidator,
  PortfolioProjectionEngine,
  ContentPackGenerator,
  ShowcaseOrchestrator,
  StoryPackGenerator
} from '../packages/runtime/src/evidence';
import { EngineeringClaim } from '../packages/shared/src/types/evidence';

console.log('================================================================');
console.log('  TEST: Evidence-Based Engineering Showcase Loop');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function it(description: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Dynamic Evidence Extraction
// -----------------------------------------------------------------------------
it('1. Extracts dynamic canonical evidence from projects/webhook-billing-bridge without hard-coded IDs', () => {
  const extractor = new EvidenceExtractor();
  const evidence = extractor.extractFromProject('projects/webhook-billing-bridge');

  assert.strictEqual(evidence.projectId, 'webhook-billing-bridge');
  assert.strictEqual(evidence.projectName, 'Webhook Billing Bridge');
  assert.strictEqual(evidence.category, 'BACKEND_SYSTEMS');
  
  // Verify dynamically resolved evidence
  assert(evidence.verification.sentinelEvidenceId.startsWith('ev-qa-contract-'), 'Evidence ID should start with ev-qa-contract-');
  assert.strictEqual(evidence.verification.buildPassed, true);
  assert(evidence.verification.testsPassed >= 11, `Expected at least 11 tests passed, got ${evidence.verification.testsPassed}`);
  assert.strictEqual(evidence.verification.testsPassed, evidence.verification.testsTotal);
  assert.strictEqual(evidence.verification.secretsScanPassed, true);
  assert.strictEqual(evidence.verification.idempotencyVerified, true);
  assert.strictEqual(evidence.reputationStatus, 'PUBLISHABLE');

  // Verify benchmark records
  const bench = evidence.benchmarks.find(b => b.name === '20-thread-concurrency-assault');
  assert(bench, 'Expected 20-thread concurrency benchmark record');
  assert.strictEqual(bench?.metric, '0 duplicate downstream deliveries across 20 concurrent requests');
});

// -----------------------------------------------------------------------------
// Test 2: Claim Validation & Hype Blocker
// -----------------------------------------------------------------------------
it('2. Validates legitimate claims and strictly blocks unproven hype / inflated metrics', () => {
  const extractor = new EvidenceExtractor();
  const validator = new ClaimValidator();
  const evidence = extractor.extractFromProject('projects/webhook-billing-bridge');

  // Valid claim
  const validResult = validator.validateProjectClaims(evidence);
  assert.strictEqual(validResult.isValid, true);
  assert.strictEqual(validResult.errors.length, 0);

  // Inflated test claim
  const inflatedClaim: EngineeringClaim = {
    id: 'claim-fake-tests',
    statement: 'Validated across 50 passing integration tests with 0 failures.',
    category: 'VERIFICATION',
    verificationMethod: 'AUTOMATED_TEST',
    status: 'VERIFIED',
    evidencePath: evidence.verification.sentinelEvidenceId
  };
  const inflatedResult = validator.validateProjectClaims({
    ...evidence,
    claims: [inflatedClaim]
  });
  assert.strictEqual(inflatedResult.isValid, false);
  assert(inflatedResult.errors.some(e => e.includes('claims 50 passing tests')), 'Expected test count inflation error');

  // Forbidden hype rejection
  const hypeText = 'Our revolutionary military-grade quantum payment bridge delivers effortless 100x scale with millions of users.';
  const hypeResult = validator.validateContent(hypeText, evidence.claims, evidence);
  assert.strictEqual(hypeResult.isValid, false);
  assert(hypeResult.errors.some(e => e.includes('FORBIDDEN_HYPE_WORDS')), 'Expected hype blocker error');
});

// -----------------------------------------------------------------------------
// Test 3: Drift Detection
// -----------------------------------------------------------------------------
it('3. Flags claim drift when an assertion points to an invalid evidence path', () => {
  const extractor = new EvidenceExtractor();
  const validator = new ClaimValidator();
  const evidence = extractor.extractFromProject('projects/webhook-billing-bridge');

  const driftingClaim: EngineeringClaim = {
    id: 'claim-drift',
    statement: 'Idempotency verified under concurrency load.',
    category: 'PERFORMANCE',
    verificationMethod: 'BENCHMARK',
    status: 'VERIFIED',
    evidencePath: 'ev-non-existent-artifact-9999'
  };

  const driftResult = validator.validateProjectClaims({
    ...evidence,
    claims: [driftingClaim]
  });
  assert.strictEqual(driftResult.isValid, false);
  assert(driftResult.errors.some(e => e.includes('EVIDENCE_NOT_FOUND')), 'Expected missing evidence path to trigger error');
});

// -----------------------------------------------------------------------------
// Test 4: Flagship Project Packaging Integrity
// -----------------------------------------------------------------------------
it('4. Confirms senior-grade README, CI workflow, and git packaging on webhook-billing-bridge', () => {
  const projectDir = path.resolve('projects/webhook-billing-bridge');
  const readmePath = path.join(projectDir, 'README.md');
  const ciPath = path.join(projectDir, '.github', 'workflows', 'ci.yml');
  const gitDir = path.join(projectDir, '.git');

  assert(fs.existsSync(readmePath), 'README.md must exist');
  assert(fs.existsSync(ciPath), 'GitHub Actions ci.yml must exist');
  assert(fs.existsSync(gitDir), '.git directory must exist');

  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  assert(readmeContent.includes('Webhook Billing Bridge'), 'README should contain project title');
  assert(readmeContent.includes('crypto.timingSafeEqual'), 'README should detail timing-safe HMAC');
  assert(readmeContent.includes('sequenceDiagram'), 'README should contain Mermaid sequence diagram');
  assert(readmeContent.includes('Trade-offs'), 'README should contain trade-offs');

  const ciContent = fs.readFileSync(ciPath, 'utf8');
  assert(ciContent.includes('node-version: [20.x, 22.x]'), 'CI should test Node 20 and 22 LTS');
  assert(ciContent.includes('npm test'), 'CI should run npm test');
});

// -----------------------------------------------------------------------------
// Test 5: Deterministic Portfolio Projection
// -----------------------------------------------------------------------------
it('5. Deterministically projects flagship deliverable into my-3d-portfolio-main', () => {
  const extractor = new EvidenceExtractor();
  const projector = new PortfolioProjectionEngine();
  const evidence = extractor.extractFromProject('projects/webhook-billing-bridge');

  const { generatedFilePath, projectCard } = projector.projectToPortfolio(evidence);

  assert(fs.existsSync(generatedFilePath), 'projects.generated.js must be created');
  const generatedCode = fs.readFileSync(generatedFilePath, 'utf8');
  assert(generatedCode.includes('Webhook Billing Bridge'), 'Generated file should contain project name');
  assert(generatedCode.includes('export const generatedProjects'), 'Generated file must export generatedProjects array');
  assert(projectCard.demo_link.includes('#architecture--component-flow'), 'Honest link invariant: demo points to architecture section');

  // Verify constants integration
  const constantsPath = 'C:/Users/DELL/Desktop/my-3d-portfolio-main/src/constants/index.js';
  const constantsCode = fs.readFileSync(constantsPath, 'utf8');
  assert(constantsCode.includes('import { generatedProjects } from "../data/projects.generated";'), 'constants/index.js must import generatedProjects');
  assert(constantsCode.includes('...generatedProjects'), 'constants/index.js must spread generatedProjects at top of projects array');
});

// -----------------------------------------------------------------------------
// Test 6: Content Pack & Validated LinkedIn Technical Draft
// -----------------------------------------------------------------------------
it('6. Generates Content Evidence Pack with senior technical LinkedIn case study passing validation', () => {
  const extractor = new EvidenceExtractor();
  const packGen = new ContentPackGenerator();
  const evidence = extractor.extractFromProject('projects/webhook-billing-bridge');

  const pack = packGen.generatePack(evidence);

  assert.strictEqual(pack.projectId, 'webhook-billing-bridge');
  assert(pack.technicalCaseStudy.includes('Problem Statement & Failure Modes'));
  assert(pack.interviewTalkingPoints.length >= 3);
  assert(pack.linkedInDraft.hook.length > 20);
  assert(pack.linkedInDraft.technicalBody.includes('Timing-safe HMAC-SHA256'));
  assert(pack.linkedInDraft.tradeoffsAndLessons.includes('In-memory atomic locking'));
  assert(pack.linkedInDraft.callToAction.includes(evidence.repository.url));

  // Verify draft claims
  assert(pack.linkedInDraft.claims.length >= 3);
  assert(pack.linkedInDraft.claims.every(c => c.status === 'VERIFIED'));
});

// -----------------------------------------------------------------------------
// Test 7: 3-Gate Human Authority Pipeline Execution
// -----------------------------------------------------------------------------
it('7. Enforces Agent != Signer 3-Gate Human Approvals across GitHub, Portfolio, and LinkedIn', () => {
  const orchestrator = new ShowcaseOrchestrator();
  const result = orchestrator.executePipeline('projects/webhook-billing-bridge');

  // All 3 gates start PENDING_APPROVAL
  assert.strictEqual(result.gates.GATE_1_GITHUB_PUSH.status, 'PENDING_APPROVAL');
  assert.strictEqual(result.gates.GATE_2_PORTFOLIO_DEPLOY.status, 'PENDING_APPROVAL');
  assert.strictEqual(result.gates.GATE_3_LINKEDIN_BROADCAST.status, 'PENDING_APPROVAL');

  // Agent cannot approve without human signature
  assert.throws(() => {
    orchestrator.approveGate('GATE_1_GITHUB_PUSH', '');
  }, /SIGNATURE_REQUIRED/);

  // Human operator approves Gate 1 and Gate 2
  const gate1 = orchestrator.approveGate('GATE_1_GITHUB_PUSH', 'Gideon Bawa (Lead Engineer)');
  assert.strictEqual(gate1.status, 'APPROVED');
  assert.strictEqual(gate1.operatorSignature, 'Gideon Bawa (Lead Engineer)');
  assert(gate1.approvedAt);

  const gate2 = orchestrator.approveGate('GATE_2_PORTFOLIO_DEPLOY', 'Gideon Bawa (Lead Engineer)');
  assert.strictEqual(gate2.status, 'APPROVED');

  // Rejection test on Gate 3 (e.g. operator requests rewording)
  const gate3Rejected = orchestrator.rejectGate('GATE_3_LINKEDIN_BROADCAST', 'Need to add diagram screenshot before broadcast.');
  assert.strictEqual(gate3Rejected.status, 'REJECTED');
  assert.strictEqual(gate3Rejected.rejectionReason, 'Need to add diagram screenshot before broadcast.');

  // Subsequent operator approval once reworded
  const gate3Approved = orchestrator.approveGate('GATE_3_LINKEDIN_BROADCAST', 'Gideon Bawa (Lead Engineer)');
  assert.strictEqual(gate3Approved.status, 'APPROVED');
});

// -----------------------------------------------------------------------------
// Test 8: LinkedIn Story Pack & Visual SVG Card Generation
// -----------------------------------------------------------------------------
it('8. Generates LinkedIn Story Pack with 8 context-specific visual SVG slides passing claim validation', () => {
  const extractor = new EvidenceExtractor();
  const storyGen = new StoryPackGenerator();
  const evidence = extractor.extractFromProject('projects/webhook-billing-bridge');

  const pack = storyGen.generateStoryPack(evidence);

  assert.strictEqual(pack.projectId, 'webhook-billing-bridge');
  assert.strictEqual(pack.slides.length, 8);

  // Verify slide sequence & purpose
  assert.strictEqual(pack.slides[0].purpose, 'HOOK_TENSION');
  assert.strictEqual(pack.slides[1].purpose, 'NAIVE_ASSUMPTION');
  assert.strictEqual(pack.slides[2].purpose, 'REALITY_FAILURE');
  assert.strictEqual(pack.slides[3].purpose, 'CONCURRENCY_BENCHMARK');
  assert.strictEqual(pack.slides[4].purpose, 'SYSTEM_PILLARS');
  assert.strictEqual(pack.slides[5].purpose, 'INTERACTIVE_PROOF');
  assert.strictEqual(pack.slides[6].purpose, 'ARCHITECTURE_TOPOLOGY');
  assert.strictEqual(pack.slides[7].purpose, 'ENGINEERING_LESSON');

  // Verify physical SVG artifacts exist on disk
  for (const slide of pack.slides) {
    assert(fs.existsSync(slide.visual.filePath), `File ${slide.visual.filePath} must exist`);
    const svg = fs.readFileSync(slide.visual.filePath, 'utf8');
    assert(svg.includes('<svg'), `Slide ${slide.slideNumber} must be valid SVG`);
    assert(svg.includes('1080'), `Slide ${slide.slideNumber} must be 1080x1080`);
    assert(slide.visual.svgContent, `Slide ${slide.slideNumber} must contain svgContent string`);
  }

  // Verify narrative text has all 5 parts and is cryptographically hashed
  assert(pack.narrativePost.hook.includes('Until Stripe retries the exact same payment 20 times'));
  assert(pack.narrativePost.incitingIncident.includes('database race conditions allow concurrent deliveries'));
  assert(pack.narrativePost.technicalJourney.includes('crypto.timingSafeEqual'));
  assert(pack.narrativePost.technicalJourney.includes('0.00% duplicate downstream deliveries'));
  assert(pack.narrativePost.verifiedResolution.includes(evidence.verification.sentinelEvidenceId));
  assert.strictEqual(pack.narrativePost.contentHash.length, 64);

  // Validate that the content contains no forbidden hype words and all claims match
  const validator = new ClaimValidator();
  const validation = validator.validateContent(pack.narrativePost.fullText, pack.claims, evidence);
  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(validation.errors.length, 0);
});


// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('================================================================');
console.log(`  SHOWCASE LOOP TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
