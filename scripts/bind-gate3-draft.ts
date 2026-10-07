import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { EvidenceExtractor } from '../packages/runtime/src/evidence/EvidenceExtractor';
import { StoryPackGenerator } from '../packages/runtime/src/evidence/StoryPackGenerator';

dotenv.config({ path: 'apps/hq/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function updateGate3() {
  const extractor = new EvidenceExtractor();
  const evidence = extractor.extractFromProject('projects/webhook-billing-bridge');
  const generator = new StoryPackGenerator();
  const pack = generator.generateStoryPack(evidence);

  const postText = pack.narrativePost.fullText;
  const contentHash = pack.narrativePost.contentHash;

  console.log(`Binding Gate 3 to canonical StoryPackGenerator hash: ${contentHash}`);

  const { data: existingGate3 } = await supabase
    .from('hq_approvals')
    .select('id, description')
    .ilike('description', '%Gate 3%')
    .maybeSingle();

  if (existingGate3) {
    const { data: updated, error } = await supabase
      .from('hq_approvals')
      .update({
        description: 'Gate 3 (LinkedIn Broadcast): Authorize publishing verified technical case study on Webhook Billing Bridge (timing-safe HMAC, 20-thread concurrency benchmark, isolated simulator).',
        diff_preview: `[CRYPTOGRAPHIC CONTENT HASH]: ${contentHash}\n\n[LINKEDIN TECHNICAL POST PREVIEW]:\n${postText}`,
        command_preview: `node scripts/execute-linkedin-broadcast.js --hash=${contentHash}`,
        authorization_hash: contentHash,
        status: 'PENDING'
      })
      .eq('id', existingGate3.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Gate 3:', error);
    } else {
      console.log('✅ Gate 3 Cryptographically Bound to Generator Source! ID:', updated.id, 'Hash:', contentHash);
    }
  } else {
    console.warn('⚠️ No existing Gate 3 found in hq_approvals.');
  }
}

updateGate3();
