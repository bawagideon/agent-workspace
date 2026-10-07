const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const envPaths = [
  path.resolve(process.cwd(), 'apps/hq/.env.local'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(__dirname, '../apps/hq/.env.local')
];
for (const ep of envPaths) {
  if (fs.existsSync(ep)) {
    require('dotenv').config({ path: ep });
    break;
  }
}

async function executeProfilePush() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found in environment.');
    process.exit(1);
  }

  console.log('🚀 Step 1: Checking if bawagideon/bawagideon exists on GitHub...');
  const checkRes = await fetch('https://api.github.com/repos/bawagideon/bawagideon', {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'Gideon-HQ' }
  });

  if (checkRes.status === 404) {
    console.log('📦 Step 2: Creating public repository bawagideon/bawagideon via GitHub API...');
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Gideon-HQ'
      },
      body: JSON.stringify({
        name: 'bawagideon',
        description: 'Special public GitHub profile repository for Gideon Bawa with verified architectural evidence',
        private: false,
        auto_init: false
      })
    });

    const repoData = await createRes.json();
    if (!repoData.id) {
      console.error('❌ Failed to create repo:', repoData);
      process.exit(1);
    }
    console.log('✅ Repository created successfully:', repoData.html_url);
  } else {
    console.log('ℹ️ Repository bawagideon/bawagideon already exists.');
  }

  console.log('📝 Step 3: Initializing local repository for bawagideon/bawagideon...');
  const repoCandidates = [
    path.resolve(process.cwd(), 'fixtures/profile/bawagideon'),
    path.resolve(__dirname, '../fixtures/profile/bawagideon'),
    path.resolve(process.cwd(), '../../fixtures/profile/bawagideon')
  ];
  let repoDir = repoCandidates.find(d => fs.existsSync(d)) || repoCandidates[0];
  if (!fs.existsSync(repoDir)) {
    fs.mkdirSync(repoDir, { recursive: true });
  }

  const gitOpts = { cwd: repoDir, stdio: 'pipe' };
  try {
    if (!fs.existsSync(path.join(repoDir, '.git'))) {
      execSync('git init', gitOpts);
      execSync('git branch -M main', gitOpts);
    }

    execSync('git add README.md', gitOpts);
    try {
      execSync('git commit -m "feat(profile): initial evidence-backed profile overview with verified benchmarks"', gitOpts);
    } catch (e) {
      // Clean working tree is acceptable
    }

    try {
      execSync('git remote remove origin', { cwd: repoDir, stdio: 'ignore' });
    } catch {}

    const authRemote = `https://${token}@github.com/bawagideon/bawagideon.git`;
    execSync(`git remote add origin ${authRemote}`, { cwd: repoDir, stdio: 'ignore' });

    console.log('🚀 Step 4: Pushing README.md to GitHub main...');
    execSync('git -c credential.helper= push -u origin main --force', gitOpts);

    // Clean remote to avoid persisting token
    execSync('git remote set-url origin https://github.com/bawagideon/bawagideon.git', gitOpts);

    console.log('🎉 SUCCESS: Profile README is live at https://github.com/bawagideon');
  } catch (err) {
    console.error('❌ Git execution error:', err.message);
    process.exit(1);
  }
}

executeProfilePush();
