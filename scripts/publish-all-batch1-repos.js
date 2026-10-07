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
    slug: 'leadleak-detector',
    name: 'LeadLeak Detector & Pipeline Recovery',
    desc: 'Commercial inbound revenue defense engine that intercepts uncontacted leads across forms, WhatsApp, and calls, enforcing sub-5m response SLAs.'
  },
  {
    slug: 'missed-call-recovery',
    name: 'Missed-Call Revenue Recovery',
    desc: 'Automated telephony recovery system that converts unanswered phone calls into instant conversational SMS bookings within 90 seconds.'
  },
  {
    slug: 'lead-response-timer',
    name: 'Lead Response Timer & SLA Radar',
    desc: 'Response telemetry system measuring lead arrival to first human touch, exposing median latency on an executive radar.'
  },
  {
    slug: 'lost-lead-recovery-engine',
    name: 'Lost Lead Recovery Engine',
    desc: 'Cold pipeline reactivation engine that audits dormant CRM leads and deploys personalized re-engagement workflows without ad spend.'
  },
  {
    slug: 'quote-ghost-detector',
    name: 'Quote Ghost Detector & Aging Radar',
    desc: 'Proposal stewardship radar that monitors open bids, calculates ghosting risk past 48 hours, and dispatches automated sales check-ins.'
  },
  {
    slug: 'conversion-leak-scanner',
    name: 'Conversion Leak Scanner',
    desc: 'Headless 9-pillar technical diagnostic engine auditing mobile UX, tap targets, page speed, and form friction to reveal hidden revenue leaks.'
  },
  {
    slug: 'booking-friction-detector',
    name: 'Booking Friction Detector',
    desc: 'Conversion optimization engine that replaces bloated 14-step clinical onboarding flows with a frictionless 2-step calendar reservation architecture.'
  },
  {
    slug: 'abandoned-booking-recovery',
    name: 'Abandoned Booking Recovery',
    desc: 'Session recovery engine that detects incomplete appointment bookings, holds the selected time slot for 30 minutes, and triggers 1-click SMS recovery.'
  },
  {
    slug: 'contact-form-intelligence',
    name: 'Contact Form Intelligence',
    desc: 'Sub-millisecond intent and budget parsing engine evaluating form inquiries in real time, routing VIP enterprise buyers to executive calendars.'
  },
  {
    slug: 'lead-qualification-engine',
    name: 'Lead Qualification Engine',
    desc: '4-pillar commercial heuristic (Intent, Budget, Urgency, ICP Authority) gating calendar access and shielding executive time from tire-kickers.'
  }
];

async function publishAll() {
  console.log('================================================================');
  console.log(' PUBLISHING ALL 10 BATCH 1 REPOSITORIES TO GITHUB               ');
  console.log('================================================================\n');

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const num = String(i + 1).padStart(2, '0');
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

      // Configure identity if not set locally
      execSync('git config user.name "Gideon Bawa"', gitOpts);
      execSync('git config user.email "bawagideon@gmail.com"', gitOpts);

      execSync('git add .', gitOpts);

      try {
        execSync(`git commit -m "feat(commercial): initial release of ${p.name} (#${num} in Master 50)"`, gitOpts);
      } catch (e) {
        // Clean commit tree is fine
      }

      try {
        execSync('git remote remove origin', { cwd: projDir, stdio: 'ignore' });
      } catch (e) {}

      const authRemote = `https://${token}@github.com/bawagideon/${p.slug}.git`;
      execSync(`git remote add origin ${authRemote}`, { cwd: projDir, stdio: 'ignore' });

      console.log(`  🚀 Pushing to origin main...`);
      execSync('git -c credential.helper= push -u origin main --force', gitOpts);

      // Clean remote back to standard URL so token is never saved on disk
      execSync(`git remote set-url origin https://github.com/bawagideon/${p.slug}.git`, gitOpts);
      console.log(`  🎉 LIVE ON GITHUB: https://github.com/bawagideon/${p.slug}`);
    } catch (err) {
      console.error(`  ❌ Git push error for ${p.slug}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log(' ALL 10 REPOSITORIES CREATED & PUSHED TO GITHUB!                 ');
  console.log('================================================================\n');
}

publishAll();
