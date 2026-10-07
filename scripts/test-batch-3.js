const { execSync } = require('child_process');
const path = require('path');

const slugs = [
  'client-approval-tracker',
  'revision-scope-detector',
  'agency-profitability-tracker',
  'client-onboarding-portal',
  'proposal-to-project-converter',
  'checkout-leak-detector',
  'cart-recovery-intelligence',
  'product-page-conversion-auditor',
  'payment-failure-recovery',
  'inventory-revenue-protector'
];

console.log('Testing Batch 3 projects...\n');
let passed = 0;

for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const testPath = path.join(__dirname, '..', 'projects', slug, 'test', `${slug}.test.js`);
  try {
    execSync(`node --test "${testPath}"`, { stdio: 'pipe' });
    console.log(`[#${i + 21}] ✅ ${slug} passed`);
    passed++;
  } catch (err) {
    console.error(`[#${i + 21}] ❌ ${slug} failed:`, err.message);
  }
}

console.log(`\nResult: ${passed}/${slugs.length} passed.`);
if (passed !== slugs.length) process.exit(1);
