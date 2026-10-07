/**
 * @gideon/test-batch-1-commercial
 * Exhaustive Deterministic Verification Test for Batch 1 Commercial Weapons (#01 - #10)
 * 
 * Verifies across 11 Dimensions:
 * 1. SOURCE - Source code & package.json integrity
 * 2. BUILD - Clean code parse & syntax validation
 * 3. TEST - Node.js test runner passes with 0 failures
 * 4. DEMO - public/index.html responsive sandbox UI
 * 5. PORTFOLIO - Registration in Desktop/my-3d-portfolio-main/src/data/projects.generated.js
 * 6. SHOWCASE - Registration & mapping in Gideon HQ Showcase fleet
 * 7. HQ - First-class record in .gideon/projects_cache.json
 * 8. BRAND - Adherence to Gideon visual & typography standards
 * 9. LINKEDIN - Complete multi-format post package + Sentinel Claim Audit
 * 10. EVIDENCE - Cryptographic sealed QA contract in .gideon/evidence/
 * 11. MISSION - Traceable linkage in .gideon/project_missions_cache.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const portfolioProjectsPath = path.resolve('C:\\Users\\DELL\\Desktop\\my-3d-portfolio-main\\src\\data\\projects.generated.js');
const projectsCachePath = path.join(workspaceRoot, '.gideon', 'projects_cache.json');
const missionsCachePath = path.join(workspaceRoot, '.gideon', 'project_missions_cache.json');
const evidenceDir = path.join(workspaceRoot, '.gideon', 'evidence');

const batch1Slugs = [
  'leadleak-detector',
  'missed-call-recovery',
  'lead-response-timer',
  'lost-lead-recovery-engine',
  'quote-ghost-detector',
  'conversion-leak-scanner',
  'booking-friction-detector',
  'abandoned-booking-recovery',
  'contact-form-intelligence',
  'lead-qualification-engine'
];

console.log('========================================================================================');
console.log(' GIDEON BATCH 1 DETERMINISTIC COMMERCIAL INTEGRATION TEST HARNESS                       ');
console.log('========================================================================================\n');

// Load caches
const projectsCache = fs.existsSync(projectsCachePath)
  ? JSON.parse(fs.readFileSync(projectsCachePath, 'utf8'))
  : {};

const missionsCache = fs.existsSync(missionsCachePath)
  ? JSON.parse(fs.readFileSync(missionsCachePath, 'utf8'))
  : {};

const portfolioContent = fs.existsSync(portfolioProjectsPath)
  ? fs.readFileSync(portfolioProjectsPath, 'utf8')
  : '';

let allPassed = true;
const matrix = [];

batch1Slugs.forEach((slug, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const projDir = path.join(workspaceRoot, 'projects', slug);
  const projId = `proj_${slug.replace(/[^a-zA-Z0-9_]/g, '_')}`;

  const row = {
    num: `#${num}`,
    slug,
    source: 'FAIL',
    build: 'FAIL',
    test: 'FAIL',
    demo: 'FAIL',
    portfolio: 'FAIL',
    showcase: 'FAIL',
    hq: 'FAIL',
    brand: 'FAIL',
    linkedin: 'FAIL',
    evidence: 'FAIL',
    mission: 'FAIL'
  };

  // 1. SOURCE
  const pkgPath = path.join(projDir, 'package.json');
  const srcPath = path.join(projDir, 'src', 'index.js');
  const readmePath = path.join(projDir, 'README.md');
  const dossierPath = path.join(projDir, 'COMMERCIAL_DOSSIER.md');
  const integrationPath = path.join(projDir, 'INTEGRATION.md');
  const demoScriptPath = path.join(projDir, 'DEMO_SCRIPT.md');

  if (
    fs.existsSync(pkgPath) &&
    fs.existsSync(srcPath) &&
    fs.existsSync(readmePath) &&
    fs.existsSync(dossierPath) &&
    fs.existsSync(integrationPath) &&
    fs.existsSync(demoScriptPath)
  ) {
    row.source = 'PASS';
  }

  // 2. BUILD (Syntax validation)
  try {
    require(srcPath);
    row.build = 'PASS';
  } catch (err) {
    row.build = 'FAIL';
  }

  // 3. TEST
  try {
    const testOut = execSync('npm test', { cwd: projDir, stdio: 'pipe' }).toString();
    const passMatch = testOut.match(/pass (\d+)/);
    const failMatch = testOut.match(/fail (\d+)/);
    const failures = failMatch ? parseInt(failMatch[1], 10) : 0;
    const passes = passMatch ? parseInt(passMatch[1], 10) : 0;
    if (failures === 0 && passes > 0) {
      row.test = `PASS (${passes})`;
    } else {
      row.test = 'FAIL';
    }
  } catch (err) {
    row.test = 'FAIL';
  }

  // 4. DEMO
  const demoHtmlPath = path.join(projDir, 'public', 'index.html');
  if (fs.existsSync(demoHtmlPath)) {
    const html = fs.readFileSync(demoHtmlPath, 'utf8');
    if (html.includes('<!DOCTYPE html>') && html.includes('viewport') && (html.includes('onclick') || html.includes('addEventListener') || html.includes('<button'))) {
      row.demo = 'PASS';
    }
  }

  // 5. PORTFOLIO
  if (portfolioContent.includes(`id: "${slug}"`) && portfolioContent.includes(`evidenceRef: "ev-qa-contract-`)) {
    row.portfolio = 'PASS';
  }

  // 6. SHOWCASE
  const showcaseFile = path.join(workspaceRoot, 'apps', 'hq', 'src', 'app', '(dashboard)', 'showcase', 'page.tsx');
  if (fs.existsSync(showcaseFile)) {
    const sc = fs.readFileSync(showcaseFile, 'utf8');
    if (sc.includes('isOpenProof') && sc.includes(slug.split('-')[0])) {
      row.showcase = 'PASS';
    }
  }

  // 7. HQ
  if (projectsCache[projId] && projectsCache[projId].status === 'QA_VERIFIED' && projectsCache[projId].pricingCents > 0) {
    row.hq = 'PASS';
  }

  // 8. BRAND
  if (fs.existsSync(demoHtmlPath)) {
    const html = fs.readFileSync(demoHtmlPath, 'utf8');
    if (html.includes('#090d16') || html.includes('rgba(18, 24, 38') || html.includes('JetBrains Mono') || html.includes('Inter')) {
      row.brand = 'PASS';
    }
  }

  // 9. LINKEDIN
  const postPath = path.join(projDir, 'POST.md');
  if (fs.existsSync(postPath)) {
    const postContent = fs.readFileSync(postPath, 'utf8');
    if (
      postContent.includes('Primary LinkedIn Post') &&
      postContent.includes('Short Version') &&
      postContent.includes('Sentinel Claim Audit & Verification Registry') &&
      postContent.includes('github.com/bawagideon')
    ) {
      row.linkedin = 'PASS';
    }
  }

  // 10. EVIDENCE
  const evidenceFiles = fs.readdirSync(evidenceDir).filter(f => f.startsWith('ev-qa-contract-') && f.includes(slug));
  if (evidenceFiles.length > 0) {
    const evContent = JSON.parse(fs.readFileSync(path.join(evidenceDir, evidenceFiles[0]), 'utf8'));
    if (evContent.hmacSignature && evContent.overallStatus === 'PASS' && evContent.pillarResults?.functional?.passed) {
      row.evidence = 'PASS';
    }
  }

  // 11. MISSION
  const allMissions = Array.isArray(missionsCache) ? missionsCache : Object.values(missionsCache);
  const missionEntries = allMissions.filter(m => m.slug === slug && m.status === 'COMPLETED');
  if (missionEntries.length > 0) {
    row.mission = 'PASS';
  }

  matrix.push(row);

  // Check overall pass
  const hasFailure = Object.values(row).some(v => v === 'FAIL');
  if (hasFailure) {
    allPassed = false;
  }
});

// Format table output
console.log('PROJECT | SOURCE | BUILD | TEST | DEMO | PORTFOLIO | SHOWCASE | HQ | BRAND | LINKEDIN | EVIDENCE | MISSION');
console.log('-------------------------------------------------------------------------------------------------------------');
matrix.forEach(r => {
  console.log(`${r.num} ${r.slug.padEnd(26)} | ${r.source.padEnd(6)} | ${r.build.padEnd(5)} | ${r.test.padEnd(9)} | ${r.demo.padEnd(5)} | ${r.portfolio.padEnd(9)} | ${r.showcase.padEnd(8)} | ${r.hq.padEnd(4)} | ${r.brand.padEnd(5)} | ${r.linkedin.padEnd(8)} | ${r.evidence.padEnd(8)} | ${r.mission.padEnd(7)}`);
});

console.log('\n========================================================================================');
if (allPassed) {
  console.log('🎉 ALL 10 BATCH 1 PROJECTS PASSED ALL 11 COMMERCIAL INTEGRATION GATES DETERMINISTICALLY!');
} else {
  console.log('⚠️ SOME PROJECTS FAILED ONE OR MORE INTEGRATION GATES.');
}
console.log('========================================================================================');

process.exit(allPassed ? 0 : 1);
