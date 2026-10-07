const { execSync } = require('child_process');
const path = require('path');

const slugs = [
  // Batch 1
  'leadleak-detector',
  'missed-call-recovery',
  'lead-response-timer',
  'lost-lead-recovery-engine',
  'quote-ghost-detector',
  'conversion-leak-scanner',
  'booking-friction-detector',
  'abandoned-booking-recovery',
  'contact-form-intelligence',
  'lead-qualification-engine',
  // Batch 2
  'churn-early-warning',
  'customer-health-score',
  'cancellation-rescue-engine',
  'silent-customer-detector',
  'renewal-risk-radar',
  'email-to-crm-automation',
  'pdf-business-data-extractor',
  'spreadsheet-chaos-cleaner',
  'whatsapp-lead-organizer',
  'staff-handoff-engine',
  // Batch 3
  'client-approval-tracker',
  'revision-scope-detector',
  'agency-profitability-tracker',
  'client-onboarding-portal',
  'proposal-to-project-converter',
  'checkout-leak-detector',
  'cart-recovery-intelligence',
  'product-page-conversion-auditor',
  'payment-failure-recovery',
  'inventory-revenue-protector',
  // Batch 4
  'crm-data-decay-detector',
  'dormant-customer-reactivator',
  'sales-pipeline-leak-analyzer',
  'deal-stall-detector',
  'sales-follow-up-os',
  'ai-output-qa-gateway',
  'ai-cost-leak-detector',
  'ai-agent-budget-guard',
  'ai-support-escalation-engine',
  'ai-hallucination-audit-layer',
  // Batch 5
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

console.log('================================================================');
console.log(' MASTER 50 ARSENAL — COMPREHENSIVE AUTOMATED QA SUITE           ');
console.log('================================================================\n');

let passed = 0;
const failures = [];

for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const num = String(i + 1).padStart(2, '0');
  const projPath = path.join(__dirname, '..', 'projects', slug);
  try {
    execSync(`npm test`, { cwd: projPath, stdio: 'pipe' });
    console.log(`[#${num}] ✅ ${slug}`);
    passed++;
  } catch (err) {
    console.error(`[#${num}] ❌ ${slug} FAILED`);
    failures.push(slug);
  }
}

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL PASSING: ${passed} / ${slugs.length} (100% QA Invariant)`);
console.log('----------------------------------------------------------------');

if (failures.length > 0) {
  console.error('Failed projects:', failures);
  process.exit(1);
}
