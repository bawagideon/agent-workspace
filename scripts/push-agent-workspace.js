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

const gitOpts = { cwd: workspaceRoot, stdio: 'pipe' };

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('1. Checking status...');
  const status = execSync('git status --short', { cwd: workspaceRoot }).toString().trim();
  if (status) {
    console.log('Staging and committing working changes...');
    execSync('git add .', { cwd: workspaceRoot });
    try {
      execSync('git commit -m "chore: synchronize workspace state"', { cwd: workspaceRoot });
    } catch (e) {}
  }

  console.log('2. Pushing to origin main...');
  let pushed = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const authRemote = `https://${token}@github.com/bawagideon/agent-workspace.git`;
      execSync(`git remote set-url origin ${authRemote}`, { cwd: workspaceRoot });
      const out = execSync('git -c credential.helper= push origin main', gitOpts);
      console.log('Push stdout:', out.toString());
      console.log('🎉 PUSH SUCCESSFUL!');
      pushed = true;
      break;
    } catch (err) {
      console.error(`Attempt ${attempt} error:`, err.message);
      if (err.stdout) console.error('Stdout:', err.stdout.toString());
      if (err.stderr) console.error('Stderr:', err.stderr.toString());
      await sleep(2000);
    } finally {
      execSync('git remote set-url origin https://github.com/bawagideon/agent-workspace.git', { cwd: workspaceRoot });
    }
  }

  const headCommit = execSync('git rev-parse HEAD', { cwd: workspaceRoot }).toString().trim();
  console.log(`HEAD commit is now: ${headCommit}`);
  if (!pushed) {
    process.exit(1);
  }
}

run();
