const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(workspaceRoot, 'apps/hq/.env.local'), 'utf8');
const token = env.match(/GITHUB_TOKEN\s*=\s*(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');

const retrySlugs = [
  'lead-response-timer',
  'booking-friction-detector',
  'abandoned-booking-recovery',
  'contact-form-intelligence'
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryPushes() {
  for (const slug of retrySlugs) {
    const projDir = path.join(workspaceRoot, 'projects', slug);
    const gitOpts = { cwd: projDir, stdio: 'pipe' };
    console.log(`\nRetrying push for ${slug}...`);

    let pushed = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        try { execSync('git remote remove origin', { cwd: projDir, stdio: 'ignore' }); } catch(e){}
        const authRemote = `https://${token}@github.com/bawagideon/${slug}.git`;
        execSync(`git remote add origin ${authRemote}`, { cwd: projDir, stdio: 'ignore' });

        execSync('git -c credential.helper= push -u origin main --force', gitOpts);
        execSync(`git remote set-url origin https://github.com/bawagideon/${slug}.git`, gitOpts);
        console.log(`  🎉 [Attempt ${attempt}] SUCCESS: https://github.com/bawagideon/${slug} is LIVE!`);
        pushed = true;
        break;
      } catch (err) {
        console.error(`  ⚠️ [Attempt ${attempt}] Failed: ${err.message}. Waiting 3s...`);
        await sleep(3000);
      }
    }
  }
}

retryPushes();
