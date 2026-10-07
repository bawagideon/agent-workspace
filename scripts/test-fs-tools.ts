import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testFsTools() {
  const bridge = new OpenClawBridgeClient();
  await bridge.connect();

  console.log('--- Testing ls tool ---');
  try {
    const lsResult = await bridge.invokeTool('ls', {
      path: 'C:\\Users\\DELL\\agent-workspace\\fixtures\\sample-repos\\sample-app'
    });
    console.log('ls result:', JSON.stringify(lsResult, null, 2));
  } catch (err: any) {
    console.log('ls error:', err.message);
  }

  console.log('\n--- Testing read tool ---');
  try {
    const readResult = await bridge.invokeTool('read', {
      path: 'C:\\Users\\DELL\\agent-workspace\\fixtures\\sample-repos\\sample-app\\package.json'
    });
    console.log('read result:', JSON.stringify(readResult, null, 2));
  } catch (err: any) {
    console.log('read error:', err.message);
  }

  bridge.disconnect();
}

testFsTools().catch(console.error);
