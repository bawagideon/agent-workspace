const { execSync } = require('child_process');
const path = require('path');

const slugs = [
  'sla-breach-radar',
  'operations-bottleneck-mapper',
  'invoice-collection-radar',
  'subscription-leakage-detector',
  'internal-request-router',
  'revenue-leak-observatory',
  'customer-journey-black-box',
  'business-digital-health-score',
  'opportunity-to-prototype-engine',
  'business-rescue-os'
];

console.log('Testing Batch 5 projects...\n');
let passed = 0;

for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const testPath = path.join(__dirname, '..', 'projects', slug, 'test', `${slug}.test.js`);
  try {
    execSync(`node --test "${testPath}"`, { stdio: 'pipe' });
    console.log(`[#${i + 41}] ✅ ${slug} passed`);
    passed++;
  } catch (err) {
    console.error(`[#${i + 41}] ❌ ${slug} failed:`, err.message);
  }
}

console.log(`\nResult: ${passed}/${slugs.length} passed.`);
if (passed !== slugs.length) process.exit(1);
