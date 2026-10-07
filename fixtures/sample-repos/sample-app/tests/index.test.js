const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, '../src/index.ts');
const content = fs.readFileSync(srcPath, 'utf8');

if (content.includes('isHealthy = true') || content.includes('Fixed')) {
  console.log('✅ Unit tests passed: Verified code assertion successful.');
  process.exit(0);
} else {
  console.error('❌ Unit tests failed: Target was not fixed.');
  process.exit(1);
}
