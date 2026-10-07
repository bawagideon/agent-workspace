const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const portfolioRoot = path.resolve('C:\\Users\\DELL\\Desktop\\my-3d-portfolio-main');
const workspaceRoot = path.resolve(__dirname, '..');

const slugs = [
  'crm-data-decay-detector',
  'dormant-customer-reactivator',
  'sales-pipeline-leak-analyzer',
  'deal-stall-detector',
  'sales-follow-up-os',
  'ai-output-qa-gateway',
  'ai-cost-leak-detector',
  'ai-agent-budget-guard',
  'ai-support-escalation-engine',
  'ai-hallucination-audit-layer'
];

const portfolioSimulatorsDir = path.join(portfolioRoot, 'src/assets/simulators');
fs.mkdirSync(portfolioSimulatorsDir, { recursive: true });

async function processBatch4() {
  console.log('Copying Batch 4 HTML sandboxes & capturing screenshots...\n');

  for (const slug of slugs) {
    // 1. Copy simulator HTML to portfolio public/simulators/<slug>/index.html
    const srcHtml = path.join(workspaceRoot, 'projects', slug, 'public/index.html');
    const targetSimDir = path.join(portfolioRoot, 'public/simulators', slug);
    fs.mkdirSync(targetSimDir, { recursive: true });
    const targetSimHtml = path.join(targetSimDir, 'index.html');
    fs.copyFileSync(srcHtml, targetSimHtml);
    console.log(`[${slug}] Copied HTML sandbox to ${targetSimHtml}`);

    // 2. Capture screenshot via Edge
    const localUrl = `file:///${targetSimHtml.replace(/\\/g, '/')}`;
    const targetPortfolioPng = path.join(portfolioSimulatorsDir, `${slug}.png`);
    const targetProjPng = path.join(workspaceRoot, 'projects', slug, 'assets/screenshot.png');

    const args = [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      `--screenshot=${targetPortfolioPng}`,
      '--window-size=1280,800',
      localUrl
    ];

    const res = spawnSync(edgePath, args, { stdio: 'pipe' });
    if (res.status === 0 && fs.existsSync(targetPortfolioPng)) {
      const size = fs.statSync(targetPortfolioPng).size;
      console.log(`  ✅ Captured: ${targetPortfolioPng} (${(size / 1024).toFixed(1)} KB)`);
      fs.copyFileSync(targetPortfolioPng, targetProjPng);
    } else {
      console.error(`  ❌ Failed screenshot for ${slug}`);
    }
  }

  console.log('\n✅ All Batch 4 sandboxes deployed and screenshots captured!');
}

processBatch4();
