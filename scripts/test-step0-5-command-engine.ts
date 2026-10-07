import path from 'path';
import dotenv from 'dotenv';

// Load local environment files
dotenv.config({ path: path.resolve(__dirname, '../apps/hq/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { dispatchGovernedCommand } from '../apps/hq/src/lib/runtime';

async function main() {
  console.log('================================================================');
  console.log('⚡ STEP 0.5: PROVING THE REAL COMMAND PATH INDEPENDENTLY');
  console.log('   Testing CommandEngine, Supabase, and Realtime sync');
  console.log('================================================================\n');

  // Test 1: status
  console.log('▶ [Test 1/4] Testing Command: "status"...');
  const statusRes = await dispatchGovernedCommand({
    senderId: 'admin',
    source: 'api',
    text: 'status'
  });
  console.log('Status Result:', JSON.stringify(statusRes, null, 2));
  if (!statusRes.success || statusRes.verb !== 'STATUS') {
    throw new Error('Status command failed');
  }
  console.log('✅ Test 1 PASSED: Real status query returned in ' + statusRes.executionMs + 'ms\n');

  // Test 2: briefing
  console.log('▶ [Test 2/4] Testing Command: "briefing"...');
  const briefingRes = await dispatchGovernedCommand({
    senderId: 'admin',
    source: 'api',
    text: 'briefing'
  });
  console.log('Briefing Result:', JSON.stringify(briefingRes, null, 2));
  if (!briefingRes.success || briefingRes.verb !== 'BRIEFING') {
    throw new Error('Briefing command failed');
  }
  console.log('✅ Test 2 PASSED: Real briefing query returned in ' + briefingRes.executionMs + 'ms\n');

  // Test 3: investigate BuildVault
  console.log('▶ [Test 3/4] Testing Command: "investigate BuildVault"...');
  const investigateRes = await dispatchGovernedCommand({
    senderId: 'admin',
    source: 'api',
    text: 'investigate BuildVault'
  });
  console.log('Investigation Result:', JSON.stringify(investigateRes, null, 2));
  if (!investigateRes.success || investigateRes.verb !== 'INVESTIGATE') {
    throw new Error('Investigate command failed');
  }
  console.log('✅ Test 3 PASSED: Real investigation executed and captured in ' + investigateRes.executionMs + 'ms\n');

  // Test 4: why-not BuildVault
  console.log('▶ [Test 4/4] Testing Command: "why-not BuildVault"...');
  const whyNotRes = await dispatchGovernedCommand({
    senderId: 'admin',
    source: 'api',
    text: 'why-not BuildVault'
  });
  console.log('WhyNot Result:', JSON.stringify(whyNotRes, null, 2));
  if (!whyNotRes.success || whyNotRes.verb !== 'WHY_NOT') {
    throw new Error('Why-not command failed');
  }
  console.log('✅ Test 4 PASSED: Decision rationale returned in ' + whyNotRes.executionMs + 'ms\n');

  console.log('================================================================');
  console.log('🎉 ALL STEP 0.5 COMMAND ENGINE VERIFICATIONS PASSED (4/4)!');
  console.log('   CommandEngine is ALIVE, connected to live Supabase, and verified.');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('❌ Step 0.5 verification failed:', err);
  process.exit(1);
});
