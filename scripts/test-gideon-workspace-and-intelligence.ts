import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { CapabilityRegistry } from '../packages/runtime/src/capabilities/CapabilityRegistry';
import { ContextResolver } from '../packages/runtime/src/workspace/ContextResolver';
import { SentinelObserver } from '../packages/runtime/src/supervisor/SentinelObserver';

console.log('================================================================');
console.log('  TEST: Gideon V5 AI Workspace & Engineering Intelligence Suite');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function it(description: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof (res as any).then === 'function') {
      return (res as Promise<void>).then(() => {
        console.log(`  [PASS] ${description}`);
        passedTests++;
      }).catch((err) => {
        console.error(`  [FAIL] ${description}`);
        console.error(`         ${err.message}`);
        throw err;
      });
    } else {
      console.log(`  [PASS] ${description}`);
      passedTests++;
    }
  } catch (err: any) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    throw err;
  }
}

async function runAll() {
  // Test 1: Capability Registry Integrity
  it('CapabilityRegistry exports 10 canonical engineering capabilities with status ACTIVE', () => {
    const caps = CapabilityRegistry.getAll();
    assert.strictEqual(caps.length >= 10, true, `Expected >= 10 capabilities, found ${caps.length}`);
    const hmacCap = CapabilityRegistry.getById('cap-hmac-timing-safe');
    assert.ok(hmacCap, 'Timing-Safe HMAC capability must exist');
    assert.strictEqual(hmacCap?.category, 'SECURITY');
    assert.strictEqual(hmacCap?.status, 'ACTIVE');

    const isoCap = CapabilityRegistry.getById('cap-3d-isometric-engine');
    assert.ok(isoCap, '3D Isometric SVG Generator capability must exist');
    assert.strictEqual(isoCap?.category, 'EVIDENCE');
  });

  // Test 2: Dynamic Context Envelope Compilation
  await it('ContextResolver compiles valid Context Envelope with Fact vs. Opinion distinction', async () => {
    const envelope = await ContextResolver.compileEnvelope({ page: 'workspace' });
    assert.ok(envelope, 'Envelope must compile');
    assert.ok(Array.isArray(envelope.facts), 'Envelope must contain facts array');
    assert.ok(envelope.facts.length >= 4, 'Must have at least 4 authoritative facts');
    
    // Check Fact invariants
    envelope.facts.forEach(f => {
      assert.strictEqual(f.isAuthoritative, true, 'Facts must have isAuthoritative: true');
      assert.ok(f.sourceOfTruth, 'Fact must have sourceOfTruth');
    });

    // Check Observation invariants
    assert.ok(Array.isArray(envelope.observations), 'Envelope must contain observations');
    envelope.observations.forEach(o => {
      assert.strictEqual(o.isAuthoritative, false, 'Observations must have isAuthoritative: false');
      assert.ok(o.agent, 'Observation must designate author agent');
    });

    // Check ADRs and Verified Lessons
    assert.ok(envelope.adrs.length >= 4, 'Must have at least 4 ADRs');
    assert.ok(envelope.verifiedLessons.some(l => l.ruleId === 'RULE_GENERATED_ARTIFACT_PRESERVATION'), 'RULE_GENERATED_ARTIFACT_PRESERVATION must be loaded');

    // Check Official Red/Black brand identity
    assert.strictEqual(envelope.operator.brandIdentity.primaryColor, '#DC2626');
    assert.strictEqual(envelope.operator.brandIdentity.canvasColor, '#030712');
  });

  // Test 3: Sentinel Observer 9-Dimension Quality Review & Daily Brief
  it('SentinelObserver generates Daily Brief with 9 quality dimensions and health >= 95', () => {
    const brief = SentinelObserver.generateDailyBrief();
    assert.ok(brief, 'Brief must exist');
    assert.strictEqual(brief.contractsVerifiedCount, 8, 'Must verify 8/8 contracts');
    assert.strictEqual(brief.totalContractsCount, 8, 'Must have 8 total contracts');
    assert.strictEqual(brief.qualityDimensions.length, 9, 'Must evaluate exactly 9 quality dimensions');
    assert.ok(brief.overallHealthScore >= 95, 'Health score must be >= 95');

    // Verify all dimensions passed
    brief.qualityDimensions.forEach(dim => {
      assert.strictEqual(dim.verdict, 'PASS', `Dimension ${dim.name} must be PASS`);
      assert.ok(dim.score >= 90, `Score for ${dim.name} must be >= 90`);
    });
  });

  // Test 4: Physical Brand Assets and Files on Disk
  it('Official Red/Black SVG brand assets exist and are valid vector XML on disk', () => {
    const assets = [
      'apps/hq/public/brand/gideon-hq-crimson.svg',
      'apps/hq/public/brand/gideon-hq-dark.svg',
      'apps/hq/public/brand/gideon-hq-icon.svg',
      'apps/hq/public/favicon.svg'
    ];

    for (const asset of assets) {
      const fullPath = path.resolve(process.cwd(), asset);
      assert.ok(fs.existsSync(fullPath), `Asset file must exist on disk: ${asset}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(content.includes('<svg'), `Asset ${asset} must contain <svg`);
      assert.ok(content.includes('</svg>'), `Asset ${asset} must be closed XML with </svg>`);
    }
  });

  // Test 5: Authoritative Profile Fixture
  it('Authoritative profile fixture cv_v12.json exists with verified deliverables', () => {
    const profilePath = path.resolve(process.cwd(), 'fixtures/profile/cv_v12.json');
    assert.ok(fs.existsSync(profilePath), 'fixtures/profile/cv_v12.json must exist');
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    assert.strictEqual(profile.basics.name, 'Gideon Bawa');
    assert.ok(profile.verifiedProjects.length >= 2, 'Must have verified projects');
    const webhookProject = profile.verifiedProjects.find((p: any) => p.name === 'Webhook Billing Bridge');
    assert.ok(webhookProject, 'Webhook Billing Bridge must be verified');
    assert.strictEqual(webhookProject.metrics.testsPassing, '8/8');
  });

  console.log('================================================================');
  console.log(`  RESULT: ${passedTests} / ${totalTests} SUITES PASSED`);
  console.log('================================================================');
}

runAll().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
