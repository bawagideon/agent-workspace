import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testScopedSession() {
  console.log('=== Testing OpenClaw Scoped Session Key Routing ===\n');

  const bridge = new OpenClawBridgeClient();
  const sessionKey = `agent:main:forge-worker-${Date.now()}`;
  console.log(`Target Session Key: ${sessionKey}`);

  const prompt = `You are Forge, a specialized engineering worker in the Gideon AI workforce. 
Confirm you are operational. State your agent persona and describe what task you are ready to execute.`;

  console.log('Dispatching via OpenClaw bridge with model override google/gemini-2.5-flash...');
  const result = await bridge.dispatchAgent({
    sessionKey,
    prompt,
    model: 'google/gemini-2.5-flash',
    thinking: 'low',
    timeoutSeconds: 60
  });

  console.log('\n--- Dispatch Result ---');
  console.log('OK:', result.ok);
  console.log('RunId:', result.runId);
  console.log('SessionKey:', result.sessionKey);
  console.log('Error:', result.error);
  console.log('Reply:\n', result.reply);
  console.log('Raw result:\n', JSON.stringify(result.raw, null, 2));

  // Now let's query the session from the Gateway via RPC
  console.log('\n--- Inspecting Session via Gateway RPC ---');
  await bridge.connect();
  try {
    const sessionData = await bridge.callRpc('sessions.get', { key: sessionKey });
    console.log('Session metadata:');
    console.log(`  Key: ${sessionData.session?.key || sessionKey}`);
    console.log(`  Input tokens: ${sessionData.session?.inputTokens}`);
    console.log(`  Output tokens: ${sessionData.session?.outputTokens}`);
    console.log(`  Total tokens: ${sessionData.session?.totalTokens}`);
    console.log(`  Estimated Cost: $${sessionData.session?.estimatedCostUsd}`);
  } catch (err: any) {
    console.log('Could not get session via RPC:', err.message);
  }
  bridge.disconnect();
}

testScopedSession().catch(console.error);
