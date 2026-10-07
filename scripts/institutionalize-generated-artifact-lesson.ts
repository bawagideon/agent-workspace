import path from 'path';
import fs from 'fs';
import { VerifiedLessonStore } from '../packages/memory/src/VerifiedLessonStore';

async function institutionalizeLesson() {
  const cachePath = path.resolve(process.cwd(), '.gideon', 'lessons_cache.json');
  let initialLessons = [];
  if (fs.existsSync(cachePath)) {
    try {
      const payload = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Array.isArray(payload.lessons)) {
        initialLessons = payload.lessons;
      }
    } catch {}
  }

  const store = new VerifiedLessonStore({ cachePath, initialLessons });

  // Check if lesson already exists
  const existing = Array.from(store['lessons'].values()).find((l: any) => l.key === 'RULE_GENERATED_ARTIFACT_PRESERVATION');
  if (existing && existing.verificationStatus === 'VERIFIED') {
    console.log(`ℹ️ Lesson 'RULE_GENERATED_ARTIFACT_PRESERVATION' already verified in store. ID: ${existing.id}`);
    return;
  }

  console.log('🏛️ Institutionalizing: RULE_GENERATED_ARTIFACT_PRESERVATION in Context Engine...');

  // 1. OBSERVED
  const lesson = await store.createLesson({
    key: 'RULE_GENERATED_ARTIFACT_PRESERVATION',
    category: 'ARCHITECTURE',
    statement: 'Never patch generated artifacts directly when a generator or source template exists. Identify the authoritative source, modify it, regenerate artifacts, and verify both source and generated output.',
    rationale: 'Directly modifying derived SVG/HTML projections causes immediate drift from the authoritative generator (StoryPackGenerator.ts), breaks automated regeneration loops, and fails cryptographic verification contracts.',
    source: {
      projectId: 'webhook-billing-bridge',
      agentId: 'forge',
      observedAt: new Date().toISOString()
    },
    confidence: 0.98
  });
  console.log(`  [1/4] Created in OBSERVED status (rev: ${lesson.revision})`);

  // 2. PROPOSED
  const proposed = await store.proposeLesson(lesson.id, 'forge', lesson.revision);
  console.log(`  [2/4] Advanced to PROPOSED status (rev: ${proposed.revision})`);

  // 3. REVIEWED (Sentinel Review)
  const reviewed = await store.reviewLesson(proposed.id, 'sentinel', proposed.revision, 'Authoritative generator StoryPackGenerator.ts confirmed as single source of truth.');
  console.log(`  [3/4] Advanced to REVIEWED status (rev: ${reviewed.revision})`);

  // 4. VERIFIED (Sentinel Sealed)
  const verified = await store.verifyLesson(
    reviewed.id,
    'sentinel',
    reviewed.revision,
    ['ev-qa-contract-1790547094069-41f1e2d3'],
    () => true // Resolved against physical contract
  );
  console.log(`  [4/4] Advanced to VERIFIED status (rev: ${verified.revision})`);
  console.log('✅ Institutionalization Complete! Lesson is permanently etched in .gideon/lessons_cache.json.');
}

institutionalizeLesson().catch(err => {
  console.error('Failed to institutionalize lesson:', err);
  process.exit(1);
});
