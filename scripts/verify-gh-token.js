const fs = require('fs');

const envContent = fs.readFileSync('apps/hq/.env.local', 'utf8');
const match = envContent.match(/GITHUB_TOKEN\s*=\s*(.+)/);
if (!match) {
  console.log('No GITHUB_TOKEN line matched in apps/hq/.env.local');
  process.exit(1);
}

const token = match[1].trim().replace(/^['"]|['"]$/g, '');

fetch('https://api.github.com/user', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Gideon-HQ'
  }
})
.then(res => res.json())
.then(user => {
  if (user.login) {
    console.log(`✅ GitHub Token Authenticated! User: ${user.login} (${user.name || 'Gideon Bawa'}), Repos: ${user.public_repos}`);
  } else {
    console.error('❌ GitHub API Error:', user);
  }
})
.catch(err => {
  console.error('❌ Network Error:', err.message);
});
