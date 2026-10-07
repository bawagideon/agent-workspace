const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const portfolioRoot = path.resolve('C:\\Users\\DELL\\Desktop\\my-3d-portfolio-main');
const workspaceRoot = path.resolve(__dirname, '..');

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

const portfolioSimulatorsDir = path.join(portfolioRoot, 'src/assets/simulators');
fs.mkdirSync(portfolioSimulatorsDir, { recursive: true });

async function capture() {
  console.log('Capturing real screenshots for Batch 1 simulators...\n');

  for (const slug of slugs) {
    const htmlPath = path.join(portfolioRoot, 'public/simulators', slug, 'index.html');
    const localUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
    const targetPortfolioPng = path.join(portfolioSimulatorsDir, `${slug}.png`);

    const projAssetsDir = path.join(workspaceRoot, 'projects', slug, 'assets');
    fs.mkdirSync(projAssetsDir, { recursive: true });
    const targetProjPng = path.join(projAssetsDir, 'screenshot.png');

    console.log(`[${slug}] Screenshotting from ${localUrl}...`);

    const args = [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      `--screenshot=${targetPortfolioPng}`,
      '--window-size=1280,800',
      localUrl
    ];

    const res = spawnSync(edgePath, args, { stdio: 'pipe' });
    if (res.status !== 0 || !fs.existsSync(targetPortfolioPng)) {
      console.error(`  ❌ Failed for ${slug}: ${res.stderr ? res.stderr.toString() : 'Unknown error'}`);
      continue;
    }

    const size = fs.statSync(targetPortfolioPng).size;
    console.log(`  ✅ Captured: ${targetPortfolioPng} (${(size / 1024).toFixed(1)} KB)`);

    // Copy to project assets
    fs.copyFileSync(targetPortfolioPng, targetProjPng);
    console.log(`  ✅ Synced to: ${targetProjPng}`);
  }

  console.log('\nAll 10 simulator screenshots captured and synced successfully!');
}

capture();
