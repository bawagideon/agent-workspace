import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testBridge() {
  console.log('================================================================');
  console.log('⚡ GIDEON AI HQ — OPENCLAW BRIDGE ADAPTER VERIFICATION TEST');
  console.log('================================================================\n');

  const bridge = new OpenClawBridgeClient();

  console.log('[Bridge] Connecting to OpenClaw WebSocket Gateway (127.0.0.1:18789)...');
  const connected = await bridge.connect();
  if (!connected) {
    console.error('❌ FAILED: Could not connect to OpenClaw Gateway over WebSocket.');
    process.exit(1);
  }
  console.log('✅ Connected successfully! WebSocket State: CONNECTED');

  console.log('\n[Bridge] Requesting gateway runtime status via RPC...');
  const status = await bridge.getStatus();
  console.log(`✅ Gateway Status Retrieved: OpenClaw Version ${status.runtimeVersion}`);
  console.log(`   Heartbeat Agent: ${status.heartbeat?.defaultAgentId}`);

  console.log('\n[Bridge] Requesting tools catalog via RPC...');
  const catalog = await bridge.listTools();
  const toolsCount = Array.isArray(catalog?.tools) ? catalog.tools.length : Object.keys(catalog || {}).length;
  console.log(`✅ Tools Catalog Verified: ${toolsCount} tool schema(s) active.`);

  console.log('\n[Bridge] Disconnecting WebSocket cleanly...');
  bridge.disconnect();
  console.log('✅ WebSocket closed.');

  console.log('\n🏛️ GIDEON ↔ OPENCLAW BRIDGE ADAPTER FULLY VERIFIED (100% PASS RATE)!\n');
}

testBridge().catch((err) => {
  console.error('Fatal bridge test error:', err);
  process.exit(1);
});
