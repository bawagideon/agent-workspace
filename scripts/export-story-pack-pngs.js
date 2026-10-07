const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function exportSlidesToPng() {
  const storyDir = path.resolve(process.cwd(), 'apps/hq/public/story/webhook-billing-bridge');
  const slides = [1, 2, 3, 4, 5, 6, 7, 8];

  console.log('🖼️ Converting 8 3D Isometric SVG slides to high-resolution PNGs...');

  for (const sNum of slides) {
    const svgPath = path.join(storyDir, `slide-${sNum}.svg`);
    const pngPath = path.join(storyDir, `slide-${sNum}.png`);

    if (fs.existsSync(svgPath)) {
      const svgBuffer = fs.readFileSync(svgPath);
      await sharp(svgBuffer, { density: 300 })
        .resize(1920, 1080, { fit: 'contain', background: { r: 3, g: 7, b: 18, alpha: 1 } })
        .png({ quality: 100 })
        .toFile(pngPath);
      console.log(`  ✓ Exported: slide-${sNum}.png (1920x1080 @ 300 DPI)`);
    }
  }

  console.log('🎉 All 8 slides exported as high-res PNGs in apps/hq/public/story/webhook-billing-bridge/');
}

exportSlidesToPng().catch(console.error);
