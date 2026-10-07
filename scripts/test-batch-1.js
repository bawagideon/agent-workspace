const { execSync } = require('child_process');
const path = require('path');

const projects = [
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

console.log('================================================================');
console.log(' GIDEON BATCH 1 TEST HARNESS (PROJECTS 01 - 10)                 ');
console.log(' Category 1: Stop Losing Leads | Category 2: Get More Customers ');
console.log('================================================================\n');

let allPassed = true;
const summary = [];

projects.forEach((proj, idx) => {
  const projPath = path.resolve(__dirname, '..', 'projects', proj);
  const num = String(idx + 1).padStart(2, '0');
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
  console.log(`🎉 10/10 PROJECTS IN BATCH 1 VERIFIED PASSING!`);
} else {
  console.log(`⚠️ SOME PROJECTS FAILED IN BATCH 1.`);
}
console.log('================================================================');
