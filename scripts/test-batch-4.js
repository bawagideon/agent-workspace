const { execSync } = require('child_process');
const path = require('path');

const slugs = [
  'crm-data-decay-detector',
  'dormant-customer-reactivator',
  'sales-pipeline-leak-analyzer',
  'deal-stall-detector',
  'sales-follow-up-os',
  'ai-output-qa-gateway',
  'ai-cost-leak-detector',
  'ai-agent-budget-guard',
  'ai-support-escalation-engine',
  'ai-hallucination-audit-layer'
];

console.log('Testing Batch 4 projects...\n');
let passed = 0;

for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const testPath = path.join(__dirname, '..', 'projects', slug, 'test', `${slug}.test.js`);
  try {
    execSync(`node --test "${testPath}"`, { stdio: 'pipe' });
    console.log(`[#${i + 31}] ✅ ${slug} passed`);
    passed++;
  } catch (err) {
    console.error(`[#${i + 31}] ❌ ${slug} failed:`, err.message);
  }
}

console.log(`\nResult: ${passed}/${slugs.length} passed.`);
if (passed !== slugs.length) process.exit(1);
