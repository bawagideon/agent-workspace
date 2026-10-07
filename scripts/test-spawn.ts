import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testSpawn() {
  const bridge = new OpenClawBridgeClient();
  await bridge.connect();

  console.log('--- Calling sessions_spawn with empty params ---');
  const res = await bridge.invokeTool('sessions_spawn', {});
  console.log(JSON.stringify(res, null, 2));

  bridge.disconnect();
}

testSpawn().catch(console.error);
