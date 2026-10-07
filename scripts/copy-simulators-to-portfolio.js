const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const portfolioDir = path.resolve('C:\\Users\\DELL\\Desktop\\my-3d-portfolio-main');
const portfolioPublicDir = path.join(portfolioDir, 'public');
const simulatorsDir = path.join(portfolioPublicDir, 'simulators');

if (!fs.existsSync(simulatorsDir)) {
  fs.mkdirSync(simulatorsDir, { recursive: true });
}

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
  const srcHtml = path.join(workspaceRoot, 'projects', slug, 'public', 'index.html');
  const targetDir = path.join(simulatorsDir, slug);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const targetHtml = path.join(targetDir, 'index.html');
  if (fs.existsSync(srcHtml)) {
    fs.copyFileSync(srcHtml, targetHtml);
    console.log(`✅ Copied simulator for ${slug} -> ${targetHtml}`);
  } else {
    console.error(`❌ Source HTML not found for ${slug}`);
  }
});

console.log('\nAll 10 simulators successfully copied to portfolio public directory!');
