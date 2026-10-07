import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function auditRuntime() {
  console.log('=== OpenClaw Gateway Runtime Audit ===\n');
  const bridge = new OpenClawBridgeClient();

  const ok = await bridge.connect();
  if (!ok) {
    console.error('Failed to connect to OpenClaw WebSocket Gateway');
    process.exit(1);
  }
  console.log('✅ WebSocket Connected');

  console.log('\n--- 1. Gateway Status ---');
  const status = await bridge.getStatus();
  console.log(JSON.stringify(status, null, 2));

  console.log('\n--- 2. Tools Catalog ---');
  const catalog = await bridge.listTools();
  console.log(JSON.stringify(catalog, null, 2));

  console.log('\n--- 3. Testing Potential RPC Methods ---');
  const testMethods = [
    'agents.list',
    'sessions.list',
    'sessions.get',
    'session.status',
    'openclaw.status',
    'models.list'
  ];

  for (const method of testMethods) {
    try {
      const res = await bridge.callRpc(method, {}, 3000);
      console.log(`[RPC SUCCESS] ${method}:`, JSON.stringify(res).substring(0, 150));
    } catch (err: any) {
      console.log(`[RPC REJECTED/NOT FOUND] ${method}: ${err.message}`);
    }
  }

  bridge.disconnect();
  console.log('\n=== Runtime Audit Complete ===');
}

auditRuntime().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
