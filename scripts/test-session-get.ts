import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testSessionGet() {
  const bridge = new OpenClawBridgeClient();
  await bridge.connect();

  console.log('--- SESSIONS GET ---');
  const session = await bridge.callRpc('sessions.get', { key: 'agent:main:main' });
  console.log(JSON.stringify(session, null, 2));

  bridge.disconnect();
}

testSessionGet().catch(console.error);
