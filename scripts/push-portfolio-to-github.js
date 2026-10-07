const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const portfolioDir = path.resolve('C:\\Users\\DELL\\Desktop\\my-3d-portfolio-main');

const env = fs.readFileSync(path.join(workspaceRoot, 'apps/hq/.env.local'), 'utf8');
const tokenMatch = env.match(/GITHUB_TOKEN\s*=\s*(.+)/);
if (!tokenMatch) {
  console.error('No GITHUB_TOKEN found');
  process.exit(1);
}
const token = tokenMatch[1].trim().replace(/^['"]|['"]$/g, '');

console.log('🚀 Step 1: Adding changes to git in portfolio directory...');
execSync('git add src/data/projects.generated.js public/simulators src/assets/leadleak-detector.png src/assets/ai-guardrails-engine.png', { cwd: portfolioDir, stdio: 'inherit' });

try {
  execSync('git commit -m "feat(commercial): deploy Batch 1 commercial weapons catalog (#01 - #10) with interactive simulators"', { cwd: portfolioDir, stdio: 'inherit' });
  console.log('✅ Committed changes successfully.');
} catch (e) {
  console.log('ℹ️ No new changes to commit or working tree clean.');
}

console.log('🚀 Step 2: Configuring authenticated remote and pushing to origin main...');
const authRemote = `https://${token}@github.com/bawagideon/my-3d-portfolio-main.git`;

try {
  execSync(`git remote set-url origin ${authRemote}`, { cwd: portfolioDir, stdio: 'ignore' });
  execSync('git -c credential.helper= push origin main', { cwd: portfolioDir, stdio: 'inherit' });
  console.log('🎉 SUCCESS: Pushed my-3d-portfolio-main to GitHub! Netlify build triggered.');
} catch (err) {
  console.error('❌ Push error:', err.message);
} finally {
  // Always clean remote URL so token is never saved
  execSync('git remote set-url origin https://github.com/bawagideon/my-3d-portfolio-main.git', { cwd: portfolioDir, stdio: 'ignore' });
  console.log('🔒 Cleaned remote URL to prevent token persistence.');
}
