import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function inspectDetails() {
  const bridge = new OpenClawBridgeClient();
  await bridge.connect();

  console.log('--- AGENTS LIST ---');
  const agents = await bridge.callRpc('agents.list', {});
  console.log(JSON.stringify(agents, null, 2));

  console.log('\n--- SESSIONS LIST ---');
  const sessions = await bridge.callRpc('sessions.list', {});
  console.log(JSON.stringify(sessions, null, 2));

  console.log('\n--- MODELS LIST ---');
  const models = await bridge.callRpc('models.list', {});
  console.log(JSON.stringify(models, null, 2));

  bridge.disconnect();
}

inspectDetails().catch(console.error);
