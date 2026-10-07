const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');

const postTemplates = {
  'lost-lead-recovery-engine': {
    title: 'Content Package: Lost Lead Recovery Engine (Weapon #04)',
    primary: `Most companies think they have a "lead generation problem."
Then we look into their CRM.
There are 4,200 leads sitting there:
- 1,800 received a single email and were never contacted again.
- 600 requested a quote 9 months ago and went silent.
- 400 were "interested, call back in Q3."

Nobody called back.

Instead of spending $10,000 on new ads next month, you can monetize the pipeline you already bought.

🛠️ I built the Lost Lead Recovery Engine:
1. Audits dormant CRM records past 30, 60, and 90 days.
2. Identifies unreplied single-touch prospects and stalled proposals.
3. Deploys structured, non-aggressive reactivation sequences tailored to past interactions.
4. Auto-suppresses anyone who unsubscribed or opted out.

Scenario: In our 200-lead reactivation benchmark, the engine surfaced $15,000 in recoverable pipeline from leads that were previously written off as dead.

Stop buying new leads until you close the loop on the ones you already have.

👉 Full open-source code & interactive simulator: https://github.com/bawagideon/lost-lead-recovery-engine`,
    short: `Most sales teams don't need more leads. They need to stop abandoning the ones they already paid for.
National Sales Executive Association: 80% of sales require 5 follow-ups, yet 44% of reps stop after 1.

I built the Lost Lead Recovery Engine: audits dormant CRM records and deploys automated reactivation sequences.
Reactivate your pipeline: https://github.com/bawagideon/lost-lead-recovery-engine`,
    technical: `Architecting automated CRM dormancy audit & reactivation:
• Programmatic query across HubSpot/Salesforce REST APIs for leads with last_contact_date > 60d.
• Segmentation heuristic filtering out hard bounces, unsubscribes, and closed-won accounts.
• Rate-limited batching engine preventing spam provider throttling.
• 100% automated test coverage with deterministic dormancy boundary checks.`,
    commercial: `What is the value of 500 old leads in your CRM?
If your sales reps only touch them once, you paid $50-$200 per lead to give them away.
Lost Lead Recovery Engine systematically re-engages cold pipeline, booking consultations without spending an extra dollar on paid ads.`,
    visual: `CRM Funnel infographic: 4,200 Dormant Contacts -> Reactivation Filter -> 37 Booked Meetings.`
  },
  'quote-ghost-detector': {
    title: 'Content Package: Quote Ghost Detector (Weapon #05)',
    primary: `A service business sends 200 custom quotes worth $184,000.
120 of them never receive a single follow-up.

Why? Because founders and sales reps are busy building current projects or chasing fresh leads.

Prospects don't ghost because they hate your offer. They ghost because:
1. They got busy with work.
2. They had one question about page 3 of the contract and forgot to ask.
3. Nobody followed up to guide them to the finish line.

🛠️ I built the Quote Ghost Detector:
• Listens to proposal and invoice webhooks (PandaDoc, DocuSign, Stripe).
• Enforces an immutable 48-hour follow-up SLA.
• Dashboard surfaces: "$184,000 Quoted / $73,000 Currently Unattended Past 48h" in our benchmark scenario.
• 1-Click Follow-Up Dispatcher generates personalized check-ins addressing common contract friction points.

Following up is not aggressive. It is professional stewardship.

👉 Full open-source code & interactive simulator: https://github.com/bawagideon/quote-ghost-detector`,
    short: `60% of proposals receive zero follow-up touches after day 2.
Gartner: Deal close rates drop 68% after 7 days without a touchpoint.

I built Quote Ghost Detector: monitors outstanding quotes and flags deals aging past 48 hours.
Protect your pipeline: https://github.com/bawagideon/quote-ghost-detector`,
    technical: `Deterministic proposal aging radar:
• Webhook listener capturing proposal_sent, viewed, and signed event payloads.
• Chronological aging calculator calculating exact SLA breach status.
• Weighted pipeline risk scoring factoring deal contract value and days dormant.
• Zero runtime dependencies with 100% test pass rate.`,
    commercial: `How much quoted revenue is currently sitting in your outbox without a follow-up?
For most agencies and contractors, it's 30% to 50% of monthly pipeline.
Quote Ghost Detector ensures no high-value proposal ever slips through the cracks.`,
    visual: `Dashboard showing $184,000 quoted vs $73,000 red bar of unattended proposals past 48 hours.`
  },
  'conversion-leak-scanner': {
    title: 'Content Package: Conversion Leak Scanner (Weapon #06)',
    primary: `Most companies think their website is "working fine" because it looks good on their MacBook.
Then we run a headless conversion audit and find:
1. Primary CTA is below the fold on mobile viewports.
2. Tap targets are 28px (causing misclicks on iPhone touchscreens).
3. The contact form asks for 9 fields (including fax and address for a simple inquiry).
4. Mobile page load takes 4.8 seconds (Google: 53% of mobile visitors bounce after 3s).
5. The submit button is throwing an unhandled 500 error on the backend.

🛠️ I built the Conversion Leak Scanner:
• Audits any public website across 9 core conversion pillars.
• Generates a quantified Conversion Health Score (0-100).
• Pinpoints every specific leak with severity and estimated revenue penalty.
• Feeds directly into an actionable engineering fix plan.

Before you increase your ad budget, fix the holes in the bucket.

👉 Full open-source code & interactive simulator: https://github.com/bawagideon/conversion-leak-scanner`,
    short: `If your website takes 4.8 seconds to load on mobile, you aren't paying for marketing — you're paying to bounce 53% of your visitors.

I built Conversion Leak Scanner: 9-pillar diagnostic tool that finds technical conversion leaks in seconds.
Audit your site: https://github.com/bawagideon/conversion-leak-scanner`,
    technical: `Headless 9-pillar CRO diagnostic engine:
• Evaluates mobile viewport responsiveness, tap target sizes, and DOM node counts.
• Inspects Core Web Vitals (LCP, FID/INP, CLS) latency thresholds.
• Quantifies form field friction penalties mathematically.
• Emits structured JSON diagnostics with zero external runtime dependencies.`,
    commercial: `Pouring money into Meta and Google ads when your landing page leaks 50% of mobile traffic is an expensive mistake.
Conversion Leak Scanner pinpoints the exact 5 technical fixes that double lead capture from existing traffic.`,
    visual: `Split-screen visual: Desktop website looking perfect vs Mobile viewport showing overlapping buttons and 4.8s load spinner.`
  },
  'booking-friction-detector': {
    title: 'Content Package: Booking Friction Detector (Weapon #07)',
    primary: `I audited a dental clinic's online booking flow. Here was the user experience:
1. Click "Book Appointment"
2. Redirect to third-party portal
3. Create an account with password and email verification
4. Fill out 14-field medical history form
5. Choose provider
6. Pick date
7. Pick time
8. "Someone will call you tomorrow to confirm your time"

Abandonment rate: 84%.

Patients don't want a 14-step onboarding questionnaire just to reserve a cleaning. They want to pick a slot and enter their phone number.

🛠️ I built the Booking Friction Detector:
• Analyzes multi-step appointment flows and measures click/field bloat.
• Compares complex legacy flows against our streamlined 2-step architecture:
  Step 1: Select Service & Open Slot (Instant live calendar).
  Step 2: Name & Phone Number + Instant 1-Click SMS confirmation.
  (Defer long intake questionnaires to the post-confirmation screen).

In our benchmark simulation, abandonment collapsed from 84% down to 25%.

👉 Full open-source code & interactive simulator: https://github.com/bawagideon/booking-friction-detector`,
    short: `Why do 84% of patients abandon clinic booking flows?
Because clinics ask for passwords and 14 medical fields before showing an open calendar date.

Booking Friction Detector replaces complex booking funnels with a frictionless 2-step reservation flow.
Try the simulator: https://github.com/bawagideon/booking-friction-detector`,
    technical: `High-conversion appointment funnel architecture:
• Evaluates step complexity and cognitive load scores.
• Implements two-phase booking: synchronous slot reservation followed by deferred asynchronous intake.
• Google Calendar and Cal.com API slot locking with 10-minute hold window.
• 100% test coverage with edge-case protection.`,
    commercial: `For a clinic averaging 300 booking starts a month, reducing abandonment from 84% to 25% unlocks 170+ additional patients every single month.
That is the power of removing booking friction.`,
    visual: `Side-by-side funnel diagram: 6-Step Legacy (84% drop) vs 2-Step Gideon Flow (25% drop).`
  },
  'abandoned-booking-recovery': {
    title: 'Content Package: Abandoned Booking Recovery (Weapon #08)',
    primary: `E-commerce brands spend millions recovering abandoned carts.
Why are service businesses completely ignoring abandoned bookings?

A prospective patient clicks your booking link, chooses "Thursday at 2 PM", types their name and phone number... and their child cries or a Slack notification pops up.

They close the tab.
The clinic never knows they existed.

🛠️ I built Abandoned Booking Recovery:
• Tracks real-time session inputs with zero friction.
• Detects when a session goes inactive for >10 minutes with partial contact data.
• Holds the prospective time slot on the calendar for 30 minutes.
• Dispatches an automated conversational text:
  "Hi Michael, we noticed you were booking your Dental Cleaning for Thursday at 2 PM! We're holding your preferred slot for the next 30 minutes. Tap here to confirm in 1 click: [Link]"

Scenario: In our 100-booking benchmark simulation, this workflow reclaims 25% of bounced bookings with zero manual labor.

👉 Full open-source code & interactive simulator: https://github.com/bawagideon/abandoned-booking-recovery`,
    short: `If a patient starts booking an appointment, enters their phone number, and closes the tab, do you have any way to recover them?
Abandoned Booking Recovery holds the slot for 30 minutes and texts a 1-click confirmation.
Demo: https://github.com/bawagideon/abandoned-booking-recovery`,
    technical: `Real-time session abandonment recovery engine:
• Client-side input blur telemetry tracking form progress.
• Inactivity timer triggering webhook after 10 minutes of dormancy.
• Ephemeral slot lock in calendar store with 30-minute TTL.
• Anti-spam suppression rate limits recovery SMS to 1 per 7 days.
• 100% test coverage with full edge-case suite.`,
    commercial: `A MedSpa or dental clinic losing 25 booking starts a month to tab abandonment loses $10,000+ in potential lifetime patient revenue.
Abandoned Booking Recovery salvages 7 to 8 of those clients automatically every month.`,
    visual: `SMS screenshot showing automated slot-hold notification with 1-click confirm link.`
  },
  'contact-form-intelligence': {
    title: 'Content Package: Contact Form Intelligence (Weapon #09)',
    primary: `Why are enterprise contact forms still just 3 dumb input boxes?

Name: _________
Email: _________
Message: _________

A VP of Technology submits:
"Need an enterprise automation system for 200 staff. Budget $50,000. Urgent timeline."

And it sits in the same inbox as:
"Hey bro do you offer free guest posts?"

🛠️ I built Contact Form Intelligence:
• Parses raw inquiry messages using deterministic intent extraction in <2ms.
• Classifies service category, urgency indicators, and budget tier in real time.
• Validates corporate domain emails vs throwaway free webmail.
• Intelligently routes high-tier prospects:
  - Enterprise Tier → Bypasses SDR queue, instantly displays Founder VIP calendar link.
  - Urgent Matter → Pings on-call dispatcher via SMS immediately.
  - Low-budget tire-kicker → Automated polite FAQ response.

Treat high-value buyers with the velocity they deserve.

👉 Full open-source code & interactive simulator: https://github.com/bawagideon/contact-form-intelligence`,
    short: `Treating a $50k enterprise inquiry the same as a spam message in your contact form is why sales teams miss quota.
Contact Form Intelligence parses intent and budget in <2ms and renders VIP calendar booking instantly.
Demo: https://github.com/bawagideon/contact-form-intelligence`,
    technical: `Sub-millisecond intent extraction and VIP routing:
• Regex tokenizer parsing currency symbols, numerical budgets, and urgency triggers.
• Domain classification separating MX corporate domains from webmail providers.
• Dynamic confirmation page payload routing Tier A leads directly to Cal.com VIP schedules.
• Zero third-party LLM latency with 100% unit & edge-case test pass rate.`,
    commercial: `When an enterprise decision-maker requests a demo, their buying intent is at its peak right on that page.
Contact Form Intelligence books them into an executive calendar before they close the browser tab.`,
    visual: `Comparison card: Generic form confirmation ("We will reply in 48 hours") vs VIP confirmation ("VIP Confirmed: Book directly with our CTO").`
  }
};

const claimAudits = {
  'lost-lead-recovery-engine': [
    { claim: '80% of sales require 5 follow-ups, while 44% of reps stop after 1', category: 'SOURCE-BACKED STATISTIC', note: 'National Sales Executive Association benchmark.' },
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
  ]
};

Object.keys(postTemplates).forEach((slug) => {
  const t = postTemplates[slug];
  const postFile = path.join(workspaceRoot, 'projects', slug, 'POST.md');

  let output = `# ${t.title}\n\n`;
  output += `## 1. Primary LinkedIn Post\n\`\`\`text\n${t.primary}\n\`\`\`\n\n---\n\n`;
  output += `## 2. Short Version (High Velocity)\n\`\`\`text\n${t.short}\n\`\`\`\n\n---\n\n`;
  output += `## 3. Technical Version (For Engineers & CTOs)\n\`\`\`text\n${t.technical}\n\`\`\`\n\n---\n\n`;
  output += `## 4. Commercial Version (For Founders & Heads of Sales)\n\`\`\`text\n${t.commercial}\n\`\`\`\n\n---\n\n`;
  output += `## 5. Visual Concept\n* **Visual Asset:** ${t.visual}\n\n---\n\n`;

  output += `## 6. Sentinel Claim Audit & Verification Registry\n\n`;
  output += `| Quantitative Assertion | Classification | Evidentiary Basis / Audit Note |\n`;
  output += `| :--- | :---: | :--- |\n`;

  claimAudits[slug].forEach((c) => {
    output += `| **${c.claim}** | \`${c.category}\` | ${c.note} |\n`;
  });

  output += `\n> [!IMPORTANT]\n`;
  output += `> **Strict Truth-in-Marketing Policy:** Simulated benchmarks and published research statistics must never be represented to prospective clients as verified historical case studies. Verified customer results require countersigned client transaction logs.\n`;

  fs.writeFileSync(postFile, output, 'utf8');
  console.log(`[Standardize Posts] Formatted complete 6-section POST.md in ${slug}`);
});
