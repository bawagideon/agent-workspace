const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(workspaceRoot, 'apps/hq/.env.local'), 'utf8');
const tokenMatch = env.match(/GITHUB_TOKEN\s*=\s*(.+)/);
if (!tokenMatch) {
  console.error('No GITHUB_TOKEN found');
  process.exit(1);
}
const token = tokenMatch[1].trim().replace(/^['"]|['"]$/g, '');

const slugs = [
  'leadleak-detector',
  'missed-call-recovery',
  'lead-response-timer',
  'lost-lead-recovery-engine',
  'quote-ghost-detector',
  'conversion-leak-scanner',
  'booking-friction-detector',
  'abandoned-booking-recovery',
  'contact-form-intelligence',
  'lead-qualification-engine'
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pushUpdates() {
  console.log('Committing and pushing README updates & screenshots to all 10 GitHub repos...\n');

  for (const slug of slugs) {
    const projDir = path.join(workspaceRoot, 'projects', slug);
    console.log(`[${slug}] Staging and committing changes...`);

    execSync('git add .', { cwd: projDir, stdio: 'inherit' });
    try {
      execSync('git commit -m "feat: embed real interactive simulator screenshot and live demo link in README"', { cwd: projDir, stdio: 'inherit' });
    } catch (e) {
      console.log(`  ℹ️ Nothing new to commit for ${slug}`);
    }

    console.log(`[${slug}] Pushing to https://github.com/bawagideon/${slug}...`);
    const authRemote = `https://${token}@github.com/bawagideon/${slug}.git`;

    let pushed = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        execSync(`git remote set-url origin ${authRemote}`, { cwd: projDir, stdio: 'ignore' });
        execSync('git -c credential.helper= push origin main', { cwd: projDir, stdio: 'inherit' });
        console.log(`  🎉 [Attempt ${attempt}] SUCCESS: ${slug} pushed to GitHub!`);
        pushed = true;
        break;
      } catch (err) {
        console.error(`  ⚠️ [Attempt ${attempt}] Push failed for ${slug}: ${err.message}. Retrying in 2s...`);
        await sleep(2000);
      } finally {
        execSync(`git remote set-url origin https://github.com/bawagideon/${slug}.git`, { cwd: projDir, stdio: 'ignore' });
      }
    }

    if (!pushed) {
      console.error(`❌ FAILED to push ${slug} after 3 attempts.`);
    }
  }

  console.log('\nAll 10 project repositories processed!');
}

pushUpdates();
