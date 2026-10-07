import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testSessionStatus() {
  const bridge = new OpenClawBridgeClient();
  await bridge.connect();

  console.log('--- Calling session_status tool ---');
  const res = await bridge.invokeTool('session_status', {});
  console.log(JSON.stringify(res, null, 2));

  console.log('\n--- Calling subagents tool ---');
  const sub = await bridge.invokeTool('subagents', {});
  console.log(JSON.stringify(sub, null, 2));

  bridge.disconnect();
}

testSessionStatus().catch(console.error);
