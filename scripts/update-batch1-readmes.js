const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');

const projects = [
  { slug: 'leadleak-detector', name: 'LeadLeak Detector & Pipeline Recovery' },
  { slug: 'missed-call-recovery', name: 'Missed-Call Revenue Recovery' },
  { slug: 'lead-response-timer', name: 'Lead Response Timer & SLA Radar' },
  { slug: 'lost-lead-recovery-engine', name: 'Lost Lead Recovery Engine' },
  { slug: 'quote-ghost-detector', name: 'Quote Ghost Detector & Aging Radar' },
  { slug: 'conversion-leak-scanner', name: 'Conversion Leak Scanner' },
  { slug: 'booking-friction-detector', name: 'Booking Friction Detector' },
  { slug: 'abandoned-booking-recovery', name: 'Abandoned Booking Recovery' },
  { slug: 'contact-form-intelligence', name: 'Contact Form Intelligence' },
  { slug: 'lead-qualification-engine', name: 'Lead Qualification Engine' }
];

for (const p of projects) {
  const readmePath = path.join(workspaceRoot, 'projects', p.slug, 'README.md');
  if (!fs.existsSync(readmePath)) {
    console.error(`README not found: ${readmePath}`);
    continue;
  }

  let content = fs.readFileSync(readmePath, 'utf8');

  // Strip any existing "Live Interactive Simulator & Proof" block if present
  content = content.replace(/## 🚀 Live Interactive Simulator & Proof[\s\S]*?---\n/g, '');

  const heroBlock = `## 🚀 Live Interactive Simulator & Proof

[![${p.name} Live Interactive Simulator](assets/screenshot.png)](https://gideonbawa-website.netlify.app/simulators/${p.slug}/)

* 🌐 **Live In-Browser Simulator:** [https://gideonbawa-website.netlify.app/simulators/${p.slug}/](https://gideonbawa-website.netlify.app/simulators/${p.slug}/)
* 💼 **Portfolio Showcase:** [https://gideonbawa-website.netlify.app/#work](https://gideonbawa-website.netlify.app/#work)
* 🛡️ **Verified QA Evidence:** HMAC-SHA256 Signed Contract (\`ev-qa-contract-1791285928367-${p.slug}\`)

---
`;

  // Find where to insert: right after the first `---` divider or after the badges block
  const firstDividerIdx = content.indexOf('\n---\n');
  if (firstDividerIdx !== -1) {
    const before = content.slice(0, firstDividerIdx + 5);
    const after = content.slice(firstDividerIdx + 5);
    content = `${before}\n${heroBlock}\n${after}`;
  } else {
    // Fallback: prepend after title / description
    content = `${content}\n\n${heroBlock}`;
  }

  fs.writeFileSync(readmePath, content, 'utf8');
  console.log(`✅ Updated README for ${p.slug}`);
}

console.log('\nAll 10 project READMEs updated with live links and screenshots!');
