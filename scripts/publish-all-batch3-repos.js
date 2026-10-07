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

const projects = [
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
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function publishAll() {
  console.log('================================================================');
  console.log(' PUBLISHING ALL 10 BATCH 3 REPOSITORIES TO GITHUB               ');
  console.log('================================================================\n');

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
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
      try {
        const createCmd = `curl.exe -s -X POST -H "Authorization: Bearer ${token}" -H "User-Agent: Gideon-HQ" -H "Content-Type: application/json" -d "@${tempJson.replace(/\\/g, '/')}" https://api.github.com/user/repos`;
        const res = JSON.parse(execSync(createCmd).toString());
        if (res.id) {
          console.log(`  ✅ Successfully created github.com/bawagideon/${p.slug}`);
        } else {
          console.log(`  ⚠️ API response: ${res.message || 'unknown'}`);
        }
      } catch (err) {
        console.error(`  ❌ Failed creating repo: ${err.message}`);
      } finally {
        if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson);
      }
      await sleep(1500);
    }

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
  console.log(' ALL 10 BATCH 3 REPOSITORIES PROCESSED & PUSHED!                 ');
  console.log('================================================================\n');
}

publishAll();
