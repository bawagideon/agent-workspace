import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function inspectToolAvailability() {
  const bridge = new OpenClawBridgeClient();
  await bridge.connect();

  const catalog = await bridge.listTools();
  console.log('Catalog properties:', Object.keys(catalog));
  if (catalog.profiles) {
    console.log('Profiles:', JSON.stringify(catalog.profiles, null, 2));
  }

  // Let's check which tools are directly invocable
  const allToolIds: string[] = [];
  for (const group of catalog.groups || []) {
    for (const tool of group.tools || []) {
      allToolIds.push(tool.id);
    }
  }
  console.log(`Total tool definitions in catalog: ${allToolIds.length}`);

  // Test invoking each with an empty object to see which are "available" vs "not_found"
  console.log('\nProbing tool availability...');
  for (const id of allToolIds) {
    try {
      const res = await bridge.invokeTool(id, {});
      const status = res.ok ? 'OK' : res.error?.code || 'ERR';
      if (status !== 'not_found') {
        console.log(`  [AVAILABLE] ${id} -> status: ${status} (msg: ${res.error?.message || 'success'})`);
      }
    } catch (e: any) {
      // ignore
    }
  }

  bridge.disconnect();
}

inspectToolAvailability().catch(console.error);
