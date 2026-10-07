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

const gitOpts = { cwd: workspaceRoot, stdio: 'inherit' };

console.log('1. Staging changes...');
execSync('git add .', gitOpts);

console.log('2. Committing changes...');
try {
  execSync('git commit -m "feat(commercial): complete Batch 1 commercial catalog (#01 - #10) with verified evidence and simulators"', gitOpts);
} catch (e) {
  console.log('Nothing new to commit or commit failed:', e.message);
}

console.log('3. Pushing to origin main...');
try {
  const authRemote = `https://${token}@github.com/bawagideon/agent-workspace.git`;
  execSync(`git remote set-url origin ${authRemote}`, gitOpts);
  execSync('git -c credential.helper= push origin main', gitOpts);
  console.log('🎉 PUSH SUCCESSFUL!');
} catch (err) {
  console.error('Push error:', err.message);
} finally {
  execSync('git remote set-url origin https://github.com/bawagideon/agent-workspace.git', gitOpts);
  console.log('Sanitized origin remote URL.');
}

const headCommit = execSync('git rev-parse HEAD', { cwd: workspaceRoot }).toString().trim();
console.log(`HEAD commit is now: ${headCommit}`);
