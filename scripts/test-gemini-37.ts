import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testGemini37() {
  const bridge = new OpenClawBridgeClient();
  const sessionKey = `agent:main:test-37-${Date.now()}`;
  console.log('Testing gemini-3.7-flash...');

  const result = await bridge.dispatchAgent({
    sessionKey,
    prompt: 'Respond with exactly: GEMINI_37_ONLINE',
    model: 'google/gemini-3.7-flash',
    thinking: 'low',
    timeoutSeconds: 45
  });

  console.log('Result OK:', result.ok);
  console.log('Error:', result.error);
  console.log('Reply:', result.reply?.substring(0, 100));
}

testGemini37().catch(console.error);
