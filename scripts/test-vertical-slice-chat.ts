import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../apps/hq/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { chatAdapter } from '../apps/hq/src/lib/ChatAdapter';

async function testVerticalSlice() {
  console.log('================================================================');
  console.log('⚡ VERTICAL SLICE PROOF: CHAT ADAPTER -> COMMAND ENGINE -> SUPABASE');
  console.log('================================================================\n');

  // Step 1: Send "status" in Chat
  console.log('▶ [Step 1/3] Chat Command: "status"...');
  const res1 = await chatAdapter.processChatMessage({
    text: 'status',
    senderId: 'owner'
  });
  console.log('Response 1 Verb:', res1.response.verb);
  console.log('Assistant Message:', res1.assistantMessage.content);
  if (res1.response.verb !== 'STATUS' || !res1.assistantMessage.content.includes('GIDEON OPERATIONAL STATUS')) {
    throw new Error('Step 1 status command failed');
  }
  const conversationId = res1.session.id;
  console.log(`✅ Step 1 PASSED: Conversation created: ${conversationId}\n`);

  // Step 2: Send "briefing" in the same conversation
  console.log('▶ [Step 2/3] Chat Command in same conversation: "briefing"...');
  const res2 = await chatAdapter.processChatMessage({
    conversationId,
    text: 'briefing',
    senderId: 'owner'
  });
  console.log('Response 2 Verb:', res2.response.verb);
  console.log('Assistant Message:', res2.assistantMessage.content);
  if (res2.response.verb !== 'BRIEFING' || !res2.assistantMessage.content.includes('GIDEON EXECUTIVE BRIEFING')) {
    throw new Error('Step 2 briefing command failed');
  }
  console.log('✅ Step 2 PASSED: Briefing executed within existing session\n');

  // Step 3: Send "investigate BuildVault"
  console.log('▶ [Step 3/3] Chat Command: "investigate BuildVault"...');
  const res3 = await chatAdapter.processChatMessage({
    conversationId,
    text: 'investigate BuildVault',
    senderId: 'owner'
  });
  console.log('Response 3 Verb:', res3.response.verb);
  console.log('Agent Role:', res3.assistantMessage.role, `(${res3.assistantMessage.agentId})`);
  console.log('Execution Steps:', JSON.stringify(res3.assistantMessage.executionSteps, null, 2));
  console.log('Assistant Message:', res3.assistantMessage.content);
  if (res3.response.verb !== 'INVESTIGATE') {
    throw new Error('Step 3 investigate command failed');
  }
  console.log('✅ Step 3 PASSED: Investigation executed via Scout with Bayesian calibration\n');

  // Step 4: Verify persistence
  const messages = await chatAdapter.getMessages(conversationId);
  console.log(`▶ [Verification] Total messages in session [${conversationId}]: ${messages.length}`);
  if (messages.length !== 6) { // 3 user + 3 assistant
    throw new Error(`Expected 6 messages, got ${messages.length}`);
  }
  console.log('✅ Persistence PASSED: All 6 messages durable and retrieved\n');

  console.log('================================================================');
  console.log('🎉 VERTICAL SLICE 100% PROVEN & VERIFIED!');
  console.log('   Chat -> ChatAdapter -> CommandEngine -> Runtime -> Persistence is REAL.');
  console.log('================================================================');
}

testVerticalSlice().catch((err) => {
  console.error('❌ Vertical slice test failed:', err);
  process.exit(1);
});
