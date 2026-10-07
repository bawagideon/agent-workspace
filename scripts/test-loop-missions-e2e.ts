import assert from 'assert';
import { loopMissionAdapter } from '../apps/hq/src/lib/LoopMissionAdapter';

async function runLoopMissionsTest() {
  console.log('================================================================');
  console.log('  TEST: Gideon 3 Core Loops E2E Operational Suite               ');
  console.log('  Testing loopMissionAdapter, API Endpoints, and Studio Isolation');
  console.log('================================================================');

  // 1. Test loopMissionAdapter direct methods
  console.log('▶ [1/6] Testing loopMissionAdapter In-Memory & File Invariants...');
  const allMissions = await loopMissionAdapter.getMissions();
  assert(Array.isArray(allMissions), 'All missions should be an array');
  assert(allMissions.length >= 3, 'Should have at least 3 initial seeded missions');
  console.log(`  ✓ Loaded ${allMissions.length} loop missions total.`);

  // 2. Test Loop Isolation
  console.log('▶ [2/6] Verifying Loop Isolation (BUILD vs PUBLISH vs OPPORTUNITIES)...');
  const buildMissions = await loopMissionAdapter.getMissions('BUILD');
  const publishMissions = await loopMissionAdapter.getMissions('PUBLISH');
  const oppMissions = await loopMissionAdapter.getMissions('OPPORTUNITIES');

  assert(buildMissions.every(m => m.loop === 'BUILD'), 'All build missions must have loop === BUILD');
  assert(publishMissions.every(m => m.loop === 'PUBLISH'), 'All publish missions must have loop === PUBLISH');
  assert(oppMissions.every(m => m.loop === 'OPPORTUNITIES'), 'All opportunity missions must have loop === OPPORTUNITIES');

  console.log(`  ✓ BUILD Missions: ${buildMissions.length}`);
  console.log(`  ✓ PUBLISH Missions: ${publishMissions.length}`);
  console.log(`  ✓ OPPORTUNITIES Missions: ${oppMissions.length}`);

  // 3. Test getMissionById
  console.log('▶ [3/6] Verifying getMissionById deep linking lookup...');
  const defaultBuild = await loopMissionAdapter.getMissionById('build-fintech-idempotency');
  assert(defaultBuild, 'Default build mission should exist');
  assert.strictEqual(defaultBuild.loop, 'BUILD');
  assert.strictEqual(defaultBuild.projectId, 'stripe-client-workflow');
  console.log(`  ✓ Deep link target 'build-fintech-idempotency' resolved correctly.`);

  // 4. Test programmatic mission creation
  console.log('▶ [4/6] Testing Mission Creation & DAG Isolation...');
  const testMission = await loopMissionAdapter.createMission({
    loop: 'BUILD',
    title: 'Automated E2E Verification Harness',
    objective: 'Verify that loop isolation guarantees 0 collision',
    projectId: 'b2b-automation-service',
    riskLevel: 'LOW',
    constraints: 'Automated test suite only',
    workforce: ['forge', 'sentinel']
  });

  assert(testMission.id.startsWith('bui-'), 'ID should start with bui- prefix');
  assert.strictEqual(testMission.loop, 'BUILD');
  assert(testMission.conversationId.startsWith('conv-bui-'), 'Conversation ID should be isolated');
  assert.strictEqual(testMission.status, 'RUNNING');
  assert(testMission.workforce.includes('forge') && testMission.workforce.includes('sentinel'));

  const fetched = await loopMissionAdapter.getMissionById(testMission.id);
  assert(fetched, 'Newly created mission must be retrievable immediately');
  assert.strictEqual(fetched.title, testMission.title);
  console.log(`  ✓ Successfully created and verified mission: ${testMission.id}`);

  // 5. Test Live HTTP API Endpoints
  console.log('▶ [5/6] Testing Live Next.js HTTP API Route (/api/loops/missions)...');
  try {
    const apiRes = await fetch('http://localhost:3000/api/loops/missions?loop=BUILD');
    assert.strictEqual(apiRes.status, 200, 'API should return 200 OK');
    const apiData = await apiRes.json();
    assert(apiData.success, 'API response should be success');
    assert(Array.isArray(apiData.missions), 'API should return missions array');
    console.log(`  ✓ GET /api/loops/missions?loop=BUILD returned 200 OK with ${apiData.missions.length} missions.`);

    const singleRes = await fetch('http://localhost:3000/api/loops/missions?missionId=build-fintech-idempotency');
    assert.strictEqual(singleRes.status, 200);
    const singleData = await singleRes.json();
    assert(singleData.success && singleData.mission);
    assert.strictEqual(singleData.mission.id, 'build-fintech-idempotency');
    console.log(`  ✓ GET /api/loops/missions?missionId=... returned 200 OK.`);
  } catch (err: any) {
    console.warn(`  ⚠️ Live Next.js server test error: ${err.message}`);
    throw err;
  }

  // 6. Test Loop Studio Route Availability
  console.log('▶ [6/6] Verifying Studio Page HTTP 200 Availability...');
  const studioRoutes = ['/loops', '/loops/build', '/loops/publish', '/loops/opportunities'];
  for (const route of studioRoutes) {
    const res = await fetch(`http://localhost:3000${route}`);
    assert.strictEqual(res.status, 200, `Route ${route} should return 200`);
    console.log(`  ✓ ${route} -> 200 OK`);
  }

  console.log('================================================================');
  console.log('  ALL LOOP MISSION E2E INVARIANTS VERIFIED: 100% PASS');
  console.log('================================================================');
}

runLoopMissionsTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
