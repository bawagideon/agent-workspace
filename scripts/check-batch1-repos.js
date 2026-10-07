const fs = require('fs');
const { execSync } = require('child_process');

const env = fs.readFileSync('apps/hq/.env.local', 'utf8');
const tokenMatch = env.match(/GITHUB_TOKEN\s*=\s*(.+)/);
if (!tokenMatch) {
  console.error('No GITHUB_TOKEN in apps/hq/.env.local');
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

slugs.forEach(slug => {
  try {
    const cmd = `curl.exe -s -H "Authorization: Bearer ${token}" -H "User-Agent: Gideon-HQ" https://api.github.com/repos/bawagideon/${slug}`;
    const res = JSON.parse(execSync(cmd).toString());
    if (res.id) {
      console.log(`✅ ${slug}: EXISTS (html_url: ${res.html_url})`);
    } else {
      console.log(`❌ ${slug}: NOT FOUND (${res.message})`);
    }
  } catch (err) {
    console.error(`Error checking ${slug}:`, err.message);
  }
});
