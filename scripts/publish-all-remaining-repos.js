const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(workspaceRoot, 'apps/hq/.env.local'), 'utf8');
const tokenMatch = env.match(/GITHUB_TOKEN\s*=\s*(.+)/);
if (!tokenMatch) {
  console.error('No GITHUB_TOKEN in apps/hq/.env.local');
  process.exit(1);
}
const token = tokenMatch[1].trim().replace(/^['"]|['"]$/g, '');

const remainingProjects = [
  // --- BATCH 3 (#21 - #30) ---
  {
    slug: 'client-approval-tracker',
    name: 'Client Approval Tracker & Signoff Engine',
    desc: 'Versioned asset state machine and immutable signoff portal that eliminates weeks of chasing client feedback across scattered emails and WhatsApp chats.'
  },
  {
    slug: 'revision-scope-detector',
    name: 'Revision Scope Creep Detector',
    desc: 'Contractual clause matcher and semantic diff engine that flags "Just one quick change" requests and auto-generates change-order invoices before profits bleed.'
  },
  {
    slug: 'agency-profitability-tracker',
    name: 'Agency Project Profitability Radar',
    desc: 'Blended hourly cost calculator and margin leak auditor that stops agencies from celebrating $5,000 projects that secretly burned 94 hours ($12/hr margin).'
  },
  {
    slug: 'client-onboarding-portal',
    name: 'Client Onboarding & Asset Vault',
    desc: 'Autonomous client kickoff portal that eliminates 10 days of back-and-forth emails by collecting brand assets, API credentials, and kickoff milestones in one secure vault.'
  },
  {
    slug: 'proposal-to-project-converter',
    name: 'Proposal to Project Kickoff Converter',
    desc: 'Webhook listener and workspace provisioner that converts signed $15k client proposals into initialized Slack channels, milestones, and initial Stripe invoices in 60 seconds.'
  },
  {
    slug: 'checkout-leak-detector',
    name: 'Checkout Funnel Leak Detector',
    desc: 'Visual 5-stage checkout telemetry that maps visitor drop-offs between Cart, Shipping, and Payment, exposing exact dollar losses per step.'
  },
  {
    slug: 'cart-recovery-intelligence',
    name: 'Cart Recovery Intent Intelligence',
    desc: 'Behavioral telemetry engine that diagnoses why shoppers abandon carts (shipping sticker shock vs card decline vs distraction) and triggers dynamic 1-click rescue offers.'
  },
  {
    slug: 'product-page-conversion-auditor',
    name: 'Product Page CRO Auditor',
    desc: 'E-commerce landing page diagnostic engine that audits trust badges, reviews placement, sticky Add-to-Cart widgets, and mobile load speed, scoring store readiness.'
  },
  {
    slug: 'payment-failure-recovery',
    name: 'Payment Failure & 3D Secure Recovery Engine',
    desc: 'Real-time payment decline interceptor that diagnoses decline reason codes and dispatches instant alternative payment links via SMS to rescue $500+ orders.'
  },
  {
    slug: 'inventory-revenue-protector',
    name: 'Inventory Revenue Protector & Stockout Radar',
    desc: 'Dual risk radar that flags impending stockouts of bestsellers before sales stop, while pinpointing dead inventory locking up $40k in cash.'
  },

  // --- BATCH 4 (#31 - #40) ---
  {
    slug: 'crm-data-decay-detector',
    name: 'CRM Data Decay & Contact Hygiene Engine',
    desc: 'Deterministic contact hygiene scanner that validates corporate email domains, detects defunct company websites, and flags invalid phone numbers before sales reps waste hours.'
  },
  {
    slug: 'dormant-customer-reactivator',
    name: 'Dormant Customer Reactivation Engine',
    desc: 'RFM segmentation engine that audits past buyers who have gone quiet for 6+ months, matching past purchase history to generate high-converting reactivation sequences.'
  },
  {
    slug: 'sales-pipeline-leak-analyzer',
    name: 'Sales Pipeline Velocity & Leak Analyzer',
    desc: 'Stage conversion velocity engine that pinpoints exactly where high-value sales deals drop off, exposing the sales stages costing the company the most pipeline.'
  },
  {
    slug: 'deal-stall-detector',
    name: 'Deal Stall & Stagnation Radar',
    desc: 'Freshness telemetry that audits open sales pipeline, flagging high-ticket enterprise opportunities that have sat unattended past stage SLA limits.'
  },
  {
    slug: 'sales-follow-up-os',
    name: 'Sales Commitment & Follow-Up OS',
    desc: 'Autonomous promise extraction engine that parses meeting notes, extracts verbal commitments made to prospects, and schedules automated drafts.'
  },
  {
    slug: 'ai-output-qa-gateway',
    name: 'AI Output QA Gateway & Prompt Shield',
    desc: 'High-speed deterministic safety gateway for production AI models that intercepts prompt injection attacks, scrubs sensitive credentials/PII, and auto-heals corrupted JSON.'
  },
  {
    slug: 'ai-cost-leak-detector',
    name: 'AI Cost Leak & Token Usage Observatory',
    desc: 'Real-time LLM cost accounting middleware that tracks token usage per customer and feature, flagging anomalous recursive cost spikes before an $8,000 OpenAI invoice arrives.'
  },
  {
    slug: 'ai-agent-budget-guard',
    name: 'AI Agent Budget Guard & Loop Breaker',
    desc: 'Sliding-window circuit breaker for autonomous AI agents that halts runaway recursive loops and hard-caps execution costs at a strict dollar limit.'
  },
  {
    slug: 'ai-support-escalation-engine',
    name: 'AI Support Sentiment & Escalation Engine',
    desc: 'Sentiment velocity monitor for support chatbots that intercepts angry customers and VIP accounts, gracefully handing off to human support before brand reputation suffers.'
  },
  {
    slug: 'ai-hallucination-audit-layer',
    name: 'AI Hallucination & Grounding Audit Layer',
    desc: 'Evidence verification engine that compares AI-generated statements against verified knowledgebase documents, highlighting unsupported claims and grounding answers.'
  },

  // --- BATCH 5 (#41 - #50) ---
  {
    slug: 'sla-breach-radar',
    name: 'Operations SLA Breach Radar',
    desc: 'Real-time priority countdown HUD that monitors customer fulfillment orders and support tickets, triggering proactive escalations before SLA breach penalties hit.'
  },
  {
    slug: 'operations-bottleneck-mapper',
    name: 'Operations Bottleneck & Cycle Time Mapper',
    desc: 'Process mining engine that analyzes multi-stage operational event logs, calculating cycle times per department and isolating the choke points that delay fulfillment by days.'
  },
  {
    slug: 'invoice-collection-radar',
    name: 'Overdue Invoice Collection Radar',
    desc: 'Cash-flow recovery system that categorizes accounts receivable into 30/60/90 day aging buckets, automatically dispatching polite-to-firm escalation sequences to recover unpaid revenue.'
  },
  {
    slug: 'subscription-leakage-detector',
    name: 'Subscription License & Billing Leakage Detector',
    desc: 'Reconciliation engine that audits application user seats against Stripe subscription tiers, flagging free-rider users who retained access after plan cancellations.'
  },
  {
    slug: 'internal-request-router',
    name: 'Internal IT & Ops Request Router',
    desc: 'Deterministic ticket categorization router that ingests chaotic Slack/email messages, classifies urgency and department, and assigns SLAs.'
  },
  {
    slug: 'revenue-leak-observatory',
    name: 'Revenue Leak Observatory & Command Center',
    desc: 'Unified cross-funnel executive telemetry cockpit connecting lead response, quotes, checkout abandonment, overdue invoices, and customer churn into a single real-time dollar loss view.'
  },
  {
    slug: 'customer-journey-black-box',
    name: 'Customer Journey Black Box & Attribution Radar',
    desc: 'Cross-channel event stitcher that maps the entire customer lifecycle from first ad impression to first purchase and renewals, ending marketing and sales finger-pointing.'
  },
  {
    slug: 'business-digital-health-score',
    name: 'Business Digital Health & Friction Auditor',
    desc: 'Automated multi-engine auditor that benchmarks small-to-medium businesses across mobile UX, response latency, conversion friction, and SEO, generating an executive 0-100 score.'
  },
  {
    slug: 'opportunity-to-prototype-engine',
    name: 'Opportunity-to-Prototype Scaffolding Engine',
    desc: 'Commercial deal closer that converts diagnosed client friction into working customized interactive HTML sandboxes in under 24 hours, replacing boring slides with live proof.'
  },
  {
    slug: 'business-rescue-os',
    name: 'Business Rescue OS — Meta Command Platform',
    desc: 'The Meta Flagship orchestrating all 50 Gideon commercial weapons: an end-to-end autonomous business audit, revenue defense diagnosis, and automated remediation engine.'
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function publishRemaining() {
  console.log('================================================================');
  console.log(' PUBLISHING ALL 30 REMAINING REPOSITORIES (#21 - #50) TO GITHUB  ');
  console.log('================================================================\n');

  for (let i = 0; i < remainingProjects.length; i++) {
    const p = remainingProjects[i];
    const num = String(i + 21).padStart(2, '0');
    console.log(`\n[#${num}] Processing ${p.slug}...`);

    let repoExists = false;
    try {
      const checkCmd = `curl.exe -s -H "Authorization: Bearer ${token}" -H "User-Agent: Gideon-HQ" https://api.github.com/repos/bawagideon/${p.slug}`;
      const checkRes = JSON.parse(execSync(checkCmd).toString());
      if (checkRes.id) {
        repoExists = true;
        console.log(`  ℹ️ Repo bawagideon/${p.slug} already exists on GitHub.`);
      }
    } catch (e) {}

    if (!repoExists) {
      console.log(`  📦 Creating public repo bawagideon/${p.slug} via GitHub API...`);
      const createPayload = JSON.stringify({
        name: p.slug,
        description: p.desc,
        private: false,
        auto_init: false
      });
      const tempJson = path.join(workspaceRoot, `.temp_${p.slug}.json`);
      fs.writeFileSync(tempJson, createPayload);

      let created = false;
      while (!created) {
        try {
          const createCmd = `curl.exe -s -X POST -H "Authorization: Bearer ${token}" -H "User-Agent: Gideon-HQ" -H "Content-Type: application/json" -d "@${tempJson.replace(/\\/g, '/')}" https://api.github.com/user/repos`;
          const raw = execSync(createCmd).toString();
          const res = JSON.parse(raw);
          if (res.id) {
            console.log(`  ✅ Successfully created github.com/bawagideon/${p.slug}`);
            created = true;
          } else if (res.message && res.message.includes('secondary rate limit')) {
            console.warn(`  ⏳ Hit secondary rate limit. Backing off for 60 seconds...`);
            await sleep(60000);
          } else {
            console.log(`  ⚠️ API response: ${res.message || 'unknown'}`);
            created = true; // Avoid infinite loop on other errors
          }
        } catch (err) {
          console.error(`  ❌ Error during creation: ${err.message}`);
          created = true;
        }
      }

      if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson);
      await sleep(4000); // polite pause between creations
    }

    // Git push local files
    const projDir = path.join(workspaceRoot, 'projects', p.slug);
    const gitDir = path.join(projDir, '.git');
    const authRemote = `https://${token}@github.com/bawagideon/${p.slug}.git`;
    const cleanRemote = `https://github.com/bawagideon/${p.slug}.git`;

    try {
      if (!fs.existsSync(gitDir)) {
        console.log(`  🔧 Initializing local git repository...`);
        execSync(`git init -b main`, { cwd: projDir, stdio: 'pipe' });
        execSync(`git config user.name "Gideon Bawa"`, { cwd: projDir, stdio: 'pipe' });
        execSync(`git config user.email "bawagideon@gmail.com"`, { cwd: projDir, stdio: 'pipe' });
        execSync(`git remote add origin ${cleanRemote}`, { cwd: projDir, stdio: 'pipe' });
      }

      execSync(`git add .`, { cwd: projDir, stdio: 'pipe' });
      try {
        execSync(`git commit -m "feat(commercial-weapon): #${num} ${p.name} production release"`, { cwd: projDir, stdio: 'pipe' });
        console.log(`  💾 Committed project files.`);
      } catch (e) {}

      execSync(`git remote set-url origin ${authRemote}`, { cwd: projDir, stdio: 'pipe' });

      let pushed = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`  🚀 Pushing to origin/main (attempt ${attempt})...`);
          execSync(`git push -u origin main --force`, { cwd: projDir, stdio: 'pipe' });
          console.log(`  🌟 Successfully pushed bawagideon/${p.slug} to main!`);
          pushed = true;
          break;
        } catch (pushErr) {
          console.warn(`  ⚠️ Push failed on attempt ${attempt}: ${pushErr.message.trim()}`);
          await sleep(2500);
        }
      }

      if (!pushed) {
        console.error(`  ❌ Failed to push ${p.slug} after 3 attempts.`);
      }
    } catch (err) {
      console.error(`  ❌ Error processing local git for ${p.slug}:`, err.message);
    } finally {
      try {
        execSync(`git remote set-url origin ${cleanRemote}`, { cwd: projDir, stdio: 'pipe' });
      } catch (e) {}
    }
  }

  console.log('\n================================================================');
  console.log(' ALL 30 REMAINING REPOSITORIES PROCESSED & PUSHED TO GITHUB!     ');
  console.log('================================================================\n');
}

publishRemaining();
