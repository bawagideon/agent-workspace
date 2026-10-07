import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function testToolCallingInTurn() {
  console.log('=== Testing OpenClaw Live Agent Tool Calling ===\n');

  const bridge = new OpenClawBridgeClient();
  const sessionKey = `agent:main:forge-tool-test-${Date.now()}`;
  console.log(`Target Session Key: ${sessionKey}`);

  const targetFile = 'C:\\Users\\DELL\\agent-workspace\\fixtures\\sample-repos\\sample-app\\package.json';
  const prompt = `You are Forge, the engineering agent.
Please read the package.json file located at "${targetFile}" using your file read tool.
Extract and output the exact "name" and "version" fields found in that file.`;

  console.log('Dispatching agent with prompt requesting tool invocation...');
  const result = await bridge.dispatchAgent({
    sessionKey,
    prompt,
    model: 'google/gemini-3.5-flash',
    thinking: 'low',
    timeoutSeconds: 90
  });

  console.log('\n--- Result ---');
  console.log('OK:', result.ok);
  console.log('RunId:', result.runId);
  console.log('Reply:\n', result.reply);

  const meta = result.raw?.result?.meta?.agentMeta;
  if (meta) {
    console.log('\n--- Telemetry & Tool Evidence ---');
    console.log('Model:', meta.model);
    console.log('Successful Tools:', meta.terminalReceipt?.successfulToolNames);
    console.log('Usage:', JSON.stringify(meta.usage));
    console.log('Cost USD:', meta.costUsd);
  }
}

testToolCallingInTurn().catch(console.error);
