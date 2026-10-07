const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');

const claimAudits = {
  'leadleak-detector': [
    { claim: '$15,000/mo ad spend scenario', category: 'SIMULATION', note: 'Illustrative commercial model input, not historical client data.' },
    { claim: 'Harvard Business Review 2,241-company 5m response study', category: 'SOURCE-BACKED STATISTIC', note: 'Published HBR study (Oldroyd, McElheran, Elkington).' },
    { claim: '3h 42m median response latency', category: 'SIMULATION', note: 'Derived from our 100-inquiry benchmark scenario.' },
    { claim: 'Sub-millisecond local normalization & hash logic', category: 'FACT', note: 'Empirical execution time of pure JS runtime functions.' },
    { claim: '100 leads / 28 leaked / $10,500 recovered', category: 'SIMULATION', note: 'Deterministic 100-lead simulation output ($1,500 ACV, 25% close rate).' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'missed-call-recovery': [
    { claim: '85-90% of callers hang up on voicemail without leaving a message', category: 'SOURCE-BACKED STATISTIC', note: 'Telephony industry benchmark (Invoca & Bria research).' },
    { claim: '$2,500 to $12,000 contract value', category: 'ASSUMPTION', note: 'Standard average contract value range for roofing, dental, and legal.' },
    { claim: '4-second SMS dispatch delivery trigger', category: 'FACT', note: 'Webhook event processing latency under local tests.' },
    { claim: '35% conversion of abandoned callers in benchmark', category: 'SIMULATION', note: 'Deterministic simulated recovery model across 50 simulated calls.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'lead-response-timer': [
    { claim: '391% drop in lead qualification past 30 minutes', category: 'SOURCE-BACKED STATISTIC', note: 'Published MIT / InsideSales lead response study.' },
    { claim: 'Sub-microsecond timestamp delta accounting', category: 'FACT', note: 'Standard high-resolution Node.js hrtime logic.' },
    { claim: '3h 42m median latency in 120-inquiry dataset', category: 'SIMULATION', note: 'Simulated 120-lead CRM test scenario.' },
    { claim: 'Dynamic SLA color gating (Green <5m, Yellow 5-30m, Red >2h)', category: 'FACT', note: 'Deterministic rule configuration enforced by code.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'lost-lead-recovery-engine': [
    { claim: '80% of sales require 5 follow-ups, while 44% of reps stop after 1', category: 'SOURCE-BACKED STATISTIC', note: 'Published National Sales Executive Association benchmark.' },
    { claim: 'Dormancy classification (30d, 60d, 90d inactive)', category: 'FACT', note: 'Deterministic rule heuristic evaluated in-memory.' },
    { claim: '200 dormant leads yielding $15,000 reactivated pipeline', category: 'SIMULATION', note: 'Simulation model assuming 200 leads, 5% response, $1,500 deal size.' },
    { claim: 'Zero external dependencies', category: 'FACT', note: 'Uses standard Node.js library.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'quote-ghost-detector': [
    { claim: '60% of proposals receive zero follow-up touches after day 2', category: 'SOURCE-BACKED STATISTIC', note: 'HubSpot Sales Enablement benchmark.' },
    { claim: '$184,000 quoted / $73,000 unattended past 48h', category: 'SIMULATION', note: 'Benchmark scenario across 200 synthetic proposals.' },
    { claim: '48-hour SLA threshold auditor', category: 'FACT', note: 'Deterministic chronological evaluation in test suite.' },
    { claim: '68% drop in close rates past 7 days without touchpoint', category: 'SOURCE-BACKED STATISTIC', note: 'Gartner B2B buying journey data.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'conversion-leak-scanner': [
    { claim: '53% of mobile visitors bounce if page takes >3 seconds to load', category: 'SOURCE-BACKED STATISTIC', note: 'Google Mobile Web Research.' },
    { claim: '9 technical conversion pillars evaluated (0-100 score)', category: 'FACT', note: 'Deterministic heuristic logic in codebase.' },
    { claim: '$18,400 projected recoverable monthly revenue', category: 'SIMULATION', note: 'Model based on 1,500 visits, 2% conversion lift, $500 product.' },
    { claim: 'Zero external dependencies', category: 'FACT', note: 'Self-contained diagnostic engine.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'booking-friction-detector': [
    { claim: '84% abandonment on multi-step healthcare forms', category: 'SOURCE-BACKED STATISTIC', note: 'Formstack Form Conversion Report.' },
    { claim: '2-step booking architecture reducing abandonment to 25%', category: 'SIMULATION', note: 'Simulated 300-session comparison model.' },
    { claim: '$70,000 monthly revenue lift model', category: 'SIMULATION', note: '300 attempts x 59% net conversion improvement x $400 patient ACV.' },
    { claim: 'Step-count and cognitive load score calculation', category: 'FACT', note: 'Deterministic scoring algorithm in codebase.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'abandoned-booking-recovery': [
    { claim: '20% to 30% of booking starts abandon after entering phone number', category: 'SOURCE-BACKED STATISTIC', note: 'Baymard Institute checkout abandonment benchmarks adapted to service bookings.' },
    { claim: '10-minute inactivity hold and 30-minute calendar lock', category: 'FACT', note: 'Programmed timer invariants in engine.' },
    { claim: 'Reclaiming 25% of dropped bookings via SMS link', category: 'SIMULATION', note: 'Simulated benchmark scenario across 100 booking events.' },
    { claim: 'Anti-spam suppression limits to 1 SMS / 7 days', category: 'FACT', note: 'Hardcoded safety guard in codebase.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'contact-form-intelligence': [
    { claim: 'Sub-2ms intent and budget entity extraction', category: 'FACT', note: 'Measured local in-memory regex tokenizer execution time.' },
    { claim: 'Corporate email validation (@company vs @gmail)', category: 'FACT', note: 'Deterministic domain string analysis.' },
    { claim: '40% high-ticket pipeline lift via instant VIP booking', category: 'SIMULATION', note: 'Simulated enterprise response velocity model.' },
    { claim: '$40,000 budget fast-track triage', category: 'SIMULATION', note: 'Demo input payload scenario.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ],
  'lead-qualification-engine': [
    { claim: '40% to 60% of sales rep time wasted on unqualified inquiries', category: 'SOURCE-BACKED STATISTIC', note: 'Salesforce State of Sales Report.' },
    { claim: '4-pillar scoring heuristic (Intent, Budget, Urgency, ICP Authority)', category: 'FACT', note: 'Code-enforced deterministic scoring formula.' },
    { claim: '40 hours/month executive selling time saved', category: 'SIMULATION', note: 'Simulated 50-lead triage scenario at $75/hour rep cost.' },
    { claim: 'Sub-millisecond score normalization', category: 'FACT', note: 'Pure arithmetic computation.' },
    { claim: 'Verified client case study revenue', category: 'VERIFIED CUSTOMER RESULT', note: 'None claimed — pilot cohort currently enrolling.' }
  ]
};

Object.keys(claimAudits).forEach((slug) => {
  const postFile = path.join(workspaceRoot, 'projects', slug, 'POST.md');
  if (!fs.existsSync(postFile)) return;

  let content = fs.readFileSync(postFile, 'utf8');

  // Strip existing claim audit section if already present
  if (content.includes('## 6. Sentinel Claim Audit & Verification Registry')) {
    content = content.split('## 6. Sentinel Claim Audit & Verification Registry')[0].trim();
  }

  const claims = claimAudits[slug];
  let table = '\n\n---\n\n## 6. Sentinel Claim Audit & Verification Registry\n\n';
  table += '| Quantitative Assertion | Classification | Evidentiary Basis / Audit Note |\n';
  table += '| :--- | :---: | :--- |\n';

  claims.forEach((c) => {
    table += `| **${c.claim}** | \`${c.category}\` | ${c.note} |\n`;
  });

  table += '\n> [!IMPORTANT]\n';
  table += '> **Strict Truth-in-Marketing Policy:** Simulated benchmarks and published research statistics must never be represented to prospective clients as verified historical case studies. Verified customer results require countersigned client transaction logs.\n';

  fs.writeFileSync(postFile, content + table, 'utf8');
  console.log(`[Audit & Harden] Updated Claim Registry in ${slug}/POST.md`);
});
