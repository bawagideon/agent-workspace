import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testToolsCatalogDetails() {
  const bridge = new OpenClawBridgeClient();
  await bridge.connect();

  const catalog = await bridge.listTools();
  console.log('--- ALL TOOLS IN CATALOG ---');
  for (const group of catalog.groups || []) {
    console.log(`\nGroup: ${group.label || group.id} (${group.id})`);
    for (const tool of group.tools || []) {
      console.log(`  - ${tool.id}: ${tool.description}`);
    }
  }

  // Let's test invoking a tool via RPC:
  console.log('\n--- TESTING RPC tools.invoke ---');
  try {
    const res = await bridge.invokeTool('agents_list', {});
    console.log('agents_list result:', JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.log('agents_list error:', err.message);
  }

  bridge.disconnect();
}

testToolsCatalogDetails().catch(console.error);
