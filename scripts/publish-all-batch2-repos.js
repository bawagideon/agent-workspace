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
    slug: 'churn-early-warning',
    name: 'Churn Early Warning System',
    desc: 'B2B usage-velocity telemetry engine that monitors sliding-window engagement, detects silent 30-day drop-offs, and alerts customer success before accounts cancel.'
  },
  {
    slug: 'customer-health-score',
    name: 'Customer Health Score & Explainability HUD',
    desc: 'Weighted multi-factor retention engine that scores account viability across usage, support sentiment, invoice promptness, and sponsor engagement with full audit explainability.'
  },
  {
    slug: 'cancellation-rescue-engine',
    name: 'Cancellation Rescue Engine',
    desc: 'Autonomous churn intervention system that diagnoses exit motives in real time and automatically deploys targeted rescue offers (billing freezes, tiered discounts, sponsor escalation).'
  },
  {
    slug: 'silent-customer-detector',
    name: 'Silent Customer & Dormancy Radar',
    desc: 'Inactivity detection telemetry that flags high-value accounts experiencing total login decay before they churn without filing support tickets.'
  },
  {
    slug: 'renewal-risk-radar',
    name: 'Renewal Risk Radar',
    desc: 'Contract expiration intelligence system that flags annual deals ending in 30/60/90 days cross-referenced with unresolved support tickets and NPS drop-offs.'
  },
  {
    slug: 'email-to-crm-automation',
    name: 'Email-to-CRM Automation Engine',
    desc: 'Inbound message intelligence pipeline that parses unstructured business emails, extracts entities (budget, timeline, company, intent), creates CRM records, and synthesizes customized replies.'
  },
  {
    slug: 'pdf-business-data-extractor',
    name: 'PDF Invoice & Financial Table Extractor',
    desc: 'Autonomous financial document parsing engine that ingests unstructured PDF invoices, reconstructs line-item matrices, audits arithmetic totals, and exports clean accounting JSON/CSV.'
  },
  {
    slug: 'spreadsheet-chaos-cleaner',
    name: 'Spreadsheet Chaos Cleaner & Deduplicator',
    desc: 'Automated CRM data sanitization pipeline that ingests corrupted CSV/XLSX spreadsheets, normalizes international phone numbers to E.164, fixes email typos, and eliminates duplicate contacts.'
  },
  {
    slug: 'whatsapp-lead-organizer',
    name: 'WhatsApp Lead Organizer & Pipeline Sync',
    desc: 'High-velocity chat transcript parser that extracts prospect names, budgets, intents, and action commitments from unstructured WhatsApp chat streams into structured CRM pipeline stages.'
  },
  {
    slug: 'staff-handoff-engine',
    name: 'Staff Handoff & Knowledge Continuity Engine',
    desc: 'Autonomous SOP and account compilation system that synthesizes an employee’s communication logs, client commitments, and open tasks into a single immutable handover dossier.'
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function publishAll() {
  console.log('================================================================');
  console.log(' PUBLISHING ALL 10 BATCH 2 REPOSITORIES TO GITHUB               ');
  console.log('================================================================\n');

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const num = String(i + 11).padStart(2, '0');
    console.log(`\n[#${num}] Processing ${p.slug}...`);

    // Step 1: Check or create repository via GitHub API
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
      fs.writeFileSync(tempJson, createPayload, 'utf8');

      try {
        const createCmd = `curl.exe -s -X POST -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github.v3+json" -H "User-Agent: Gideon-HQ" -d @"${tempJson}" https://api.github.com/user/repos`;
        const createRes = JSON.parse(execSync(createCmd).toString());
        if (createRes.id) {
          console.log(`  ✅ Successfully created repo: ${createRes.html_url}`);
        } else {
          console.error(`  ❌ Failed to create repo:`, createRes.message || createRes);
        }
      } catch (err) {
        console.error(`  ❌ Error creating repo:`, err.message);
      } finally {
        if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson);
      }
    }

    // Step 2: Initialize local git repo in projects/<slug> and push
    const projDir = path.join(workspaceRoot, 'projects', p.slug);
    const gitOpts = { cwd: projDir, stdio: 'pipe' };

    try {
      if (!fs.existsSync(path.join(projDir, '.git'))) {
        execSync('git init', gitOpts);
        execSync('git branch -M main', gitOpts);
      }

      execSync('git config user.name "Gideon Bawa"', gitOpts);
      execSync('git config user.email "bawagideon@gmail.com"', gitOpts);
      execSync('git add .', gitOpts);

      try {
        execSync(`git commit -m "feat(commercial): initial release of ${p.name} (#${num} in Master 50)"`, gitOpts);
      } catch (e) {}

      let pushed = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          try { execSync('git remote remove origin', { cwd: projDir, stdio: 'ignore' }); } catch(e){}
          const authRemote = `https://${token}@github.com/bawagideon/${p.slug}.git`;
          execSync(`git remote add origin ${authRemote}`, { cwd: projDir, stdio: 'ignore' });

          console.log(`  🚀 [Attempt ${attempt}] Pushing to origin main...`);
          execSync('git -c credential.helper= push -u origin main --force', gitOpts);
          execSync(`git remote set-url origin https://github.com/bawagideon/${p.slug}.git`, gitOpts);
          console.log(`  🎉 LIVE ON GITHUB: https://github.com/bawagideon/${p.slug}`);
          pushed = true;
          break;
        } catch (err) {
          console.error(`  ⚠️ [Attempt ${attempt}] Failed: ${err.message}. Retrying in 2s...`);
          await sleep(2000);
        } finally {
          try { execSync(`git remote set-url origin https://github.com/bawagideon/${p.slug}.git`, gitOpts); } catch(e){}
        }
      }

      if (!pushed) {
        console.error(`  ❌ Failed to push ${p.slug} after 3 attempts.`);
      }
    } catch (err) {
      console.error(`  ❌ Git error for ${p.slug}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log(' ALL 10 BATCH 2 REPOSITORIES PROCESSED!                         ');
  console.log('================================================================\n');
}

publishAll();
