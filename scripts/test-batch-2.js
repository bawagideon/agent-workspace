const { execSync } = require('child_process');
const path = require('path');

const projects = [
  'churn-early-warning',
  'customer-health-score',
  'cancellation-rescue-engine',
  'silent-customer-detector',
  'renewal-risk-radar',
  'email-to-crm-automation',
  'pdf-business-data-extractor',
  'spreadsheet-chaos-cleaner',
  'whatsapp-lead-organizer',
  'staff-handoff-engine'
];

console.log('================================================================');
console.log(' GIDEON BATCH 2 TEST HARNESS (PROJECTS 11 - 20)                 ');
console.log(' Category 3: Stop Churn | Category 4: Kill Manual Business Work ');
console.log('================================================================\n');

let allPassed = true;
const summary = [];

projects.forEach((proj, idx) => {
  const projPath = path.resolve(__dirname, '..', 'projects', proj);
  const num = String(idx + 11).padStart(2, '0');
  process.stdout.write(`[#${num}] Testing ${proj}... `);
  try {
    const start = Date.now();
    execSync('npm test', { cwd: projPath, stdio: 'pipe' });
    const duration = Date.now() - start;
    console.log(`✅ PASSED (${duration}ms)`);
    summary.push({ project: proj, status: 'PASSED', duration });
  } catch (err) {
    console.log(`❌ FAILED`);
    console.error(err.stdout?.toString() || err.message);
    allPassed = false;
    summary.push({ project: proj, status: 'FAILED' });
  }
});

console.log('\n================================================================');
if (allPassed) {
  console.log(`🎉 10/10 PROJECTS IN BATCH 2 VERIFIED PASSING!`);
} else {
  console.log(`⚠️ SOME PROJECTS FAILED IN BATCH 2.`);
}
console.log('================================================================');

if (!allPassed) {
  process.exit(1);
}
