import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function inspectSpawnSchema() {
  const bridge = new OpenClawBridgeClient();
  await bridge.connect();

  const catalog = await bridge.listTools();
  for (const group of catalog.groups || []) {
    for (const tool of group.tools || []) {
      if (tool.id === 'sessions_spawn' || tool.id === 'subagents') {
        console.log(`\nTool: ${tool.id}`);
        console.log(JSON.stringify(tool, null, 2));
      }
    }
  }

  bridge.disconnect();
}

inspectSpawnSchema().catch(console.error);
