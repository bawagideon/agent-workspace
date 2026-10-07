const fs = require('fs');

const envContent = fs.readFileSync('apps/hq/.env.local', 'utf8');
const match = envContent.match(/GITHUB_TOKEN\s*=\s*(.+)/);
const token = match[1].trim().replace(/^['"]|['"]$/g, '');

fetch('https://api.github.com/repos/bawagideon/bawagideon', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Gideon-HQ'
  }
})
.then(async r => {
  console.log('HTTP Status:', r.status);
  const data = await r.json();
  if (r.status === 200) {
    console.log('Repo bawagideon/bawagideon exists! Default branch:', data.default_branch);
  } else if (r.status === 404) {
    console.log('Repo bawagideon/bawagideon DOES NOT EXIST YET (404 Not Found). Gideon can create it!');
  } else {
    console.log('GitHub response:', data);
  }
})
.catch(err => console.error(err));
