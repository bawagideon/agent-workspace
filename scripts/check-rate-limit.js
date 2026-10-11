const fs = require('fs');
const env = fs.readFileSync('apps/hq/.env.local', 'utf8');
const token = env.match(/GITHUB_TOKEN\s*=\s*(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');

fetch('https://api.github.com/rate_limit', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'User-Agent': 'Gideon-HQ'
  }
})
.then(r => r.json())
.then(d => {
  console.log('Core limit:', d.rate);
  if (d.resources) {
    console.log('Resources:', d.resources);
  }
})
.catch(e => console.error('Error:', e.message));
