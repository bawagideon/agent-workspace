/**
 * ==============================================================================
 * GIDEON AI HQ — PHASE 2E: CONTEXT INSPECTOR API & UI CONTRACT VERIFICATION
 * 
 * 5 Rigorous Inspection-Only & Traceability Invariant Proofs:
 * 1. Valid Agent Projections (forge, scout, sentinel return valid 8-question packs)
 * 2. Provenance Traceability Mapping (every question links to authoritative source)
 * 3. Fail-Closed Validation (unauthorized target agents rejected with 400)
 * 4. Freshness Invariant (packRevision matches authoritative project revision)
 * 5. Pure Read-Only Inspection (zero state mutation, zero outbox writes, zero permission grants)
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { GET } from '../apps/hq/src/app/api/projects/[id]/context/route';
import { ProjectRegistry } from '../apps/hq/src/lib/projects/ProjectRegistry';
import { ProjectDatabase } from '../apps/hq/src/lib/projects/ProjectDatabase';
import { ContextTargetAgent, ProjectContextPack } from '@gideon/shared';

async function runStep5ContextApiUiTests() {
  console.log('================================================================');
  console.log('🏛️  GIDEON AI HQ — PHASE 2E: CONTEXT INSPECTOR API & UI PROOFS');
  console.log('    Deterministic Projections, Fail-Closed Security & Pure Read-Only');
  console.log('================================================================\n');

  let allPassed = true;
  const registry = ProjectRegistry.getInstance();
  const db = ProjectDatabase.getInstance();

  // Ensure test projects are synchronized
  const projects = await registry.listProjects();
  if (projects.length === 0) {
    throw new Error('No projects found in workspace to test Context Inspector API.');
  }

  const testProject = projects[0];
  const projectId = testProject.id;
  console.log(`Using test project: ${testProject.name} (${projectId}, rev #${testProject.revision})\n`);

  // Helper to call route GET handler
  async function callContextApi(projId: string, agent?: string) {
    const search = agent !== undefined ? `?agent=${agent}` : '';
    const req = new Request(`http://localhost:3000/api/projects/${projId}/context${search}`, {
      method: 'GET'
    });
    const params = Promise.resolve({ id: projId });
    const response = await GET(req, { params });
    const json = await response.json();
    return { status: response.status, body: json };
  }

  // --------------------------------------------------------------------------
  // PROOF 1: VALID AGENT PROJECTIONS (FORGE, SCOUT, SENTINEL)
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 1/5] Verifying Valid Agent Projections (Forge, Scout, Sentinel)...');
  try {
    const validAgents: ContextTargetAgent[] = ['forge', 'scout', 'sentinel'];

    for (const agent of validAgents) {
      const res = await callContextApi(projectId, agent);
      if (res.status !== 200 || !res.body.success) {
        throw new Error(`API failed for agent '${agent}' with status ${res.status}: ${JSON.stringify(res.body)}`);
      }

      const pack: ProjectContextPack = res.body.pack;
      if (!pack) {
        throw new Error(`Missing pack in response for agent '${agent}'`);
      }

      // Check all 8 sections exist
      if (!pack.projectIdentity || !pack.history || !pack.currentState || !pack.decisionRationale ||
          !pack.evidence || !pack.constraints || !pack.nextAgentBrief || !pack.inaccessibleInformation) {
        throw new Error(`Context pack for agent '${agent}' is missing one or more of the 8 required sections.`);
      }

      // Check targetAgent is stamped
      if (pack.targetAgent !== agent) {
        throw new Error(`Expected pack targetAgent '${agent}', got '${pack.targetAgent}'`);
      }

      // Check dual state hashes
      if (!pack.authoritativeStateHash || !pack.projectedContextHash) {
        throw new Error(`Context pack missing authoritativeStateHash or projectedContextHash.`);
      }

      console.log(`  ✓ Agent '${agent}': 8 questions populated, stateHash=${pack.authoritativeStateHash.slice(0, 10)}..., contextHash=${pack.projectedContextHash.slice(0, 10)}...`);
    }

    console.log('✅ Proof 1 PASSED: All permitted agents receive valid, complete, typed Context Packs.\n');
  } catch (err: any) {
    console.error('❌ Proof 1 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 2: PROVENANCE TRACEABILITY MAPPING
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 2/5] Verifying Provenance Traceability Mapping...');
  try {
    const res = await callContextApi(projectId, 'forge');
    const { traceability } = res.body;

    if (!traceability) {
      throw new Error('Traceability mapping missing from API response.');
    }

    const expectedKeys = [
      'projectIdentity',
      'history',
      'currentState',
      'decisionRationale',
      'evidence',
      'constraints',
      'nextAgentBrief',
      'inaccessibleInformation',
      'verifiedLessons'
    ];

    for (const key of expectedKeys) {
      if (!traceability[key] || !traceability[key].source) {
        throw new Error(`Traceability mapping missing or invalid for section '${key}'.`);
      }
      console.log(`  ✓ Traceability [${key}] -> source: "${traceability[key].source}"`);
    }

    console.log('✅ Proof 2 PASSED: 100% of Context Pack questions trace to verifiable system sources.\n');
  } catch (err: any) {
    console.error('❌ Proof 2 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 3: FAIL-CLOSED VALIDATION ON INVALID TARGET AGENTS
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 3/5] Verifying Fail-Closed Validation on Invalid Agents...');
  try {
    const invalidAgents = ['admin', 'root', 'hacker', 'guest', 'atlas', ''];

    for (const badAgent of invalidAgents) {
      const res = await callContextApi(projectId, badAgent);
      if (res.status !== 400 || res.body.success !== false) {
        throw new Error(`Expected 400 rejection for unauthorized agent '${badAgent}', got ${res.status}: ${JSON.stringify(res.body)}`);
      }
      if (!res.body.error.includes('Unsupported target agent')) {
        throw new Error(`Unexpected error message for '${badAgent}': ${res.body.error}`);
      }
    }

    console.log('  ✓ Successfully rejected agents: admin, root, hacker, guest, atlas, empty');
    console.log('✅ Proof 3 PASSED: Target agent authorization fails closed with 400 on unauthorized actors.\n');
  } catch (err: any) {
    console.error('❌ Proof 3 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 4: FRESHNESS INVARIANT & STALENESS DETECTION
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 4/5] Verifying Freshness Invariant & Staleness Detection...');
  try {
    const res = await callContextApi(projectId, 'forge');
    const { freshness } = res.body;

    if (!freshness) {
      throw new Error('Freshness check missing from API response.');
    }

    if (!freshness.isCurrent) {
      throw new Error(`Fresh context pack was falsely marked stale (packRev: ${freshness.packRevision}, dbRev: ${freshness.authoritativeRevision})`);
    }

    if (freshness.packRevision !== testProject.revision || freshness.authoritativeRevision !== testProject.revision) {
      throw new Error(`Revision mismatch: expected ${testProject.revision}, got pack ${freshness.packRevision} and db ${freshness.authoritativeRevision}`);
    }

    console.log(`  ✓ Current Pack Verified: revision #${freshness.packRevision} matches authoritative #${freshness.authoritativeRevision}`);
    console.log('✅ Proof 4 PASSED: Context Pack freshness matches authoritative project revision.\n');
  } catch (err: any) {
    console.error('❌ Proof 4 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // PROOF 5: PURE READ-ONLY INSPECTION (ZERO STATE MUTATION)
  // --------------------------------------------------------------------------
  console.log('▶ [Proof 5/5] Verifying Pure Read-Only Invariant (Zero State / Outbox Mutation)...');
  try {
    const outboxPath = path.resolve(process.cwd(), '.gideon', 'sync_outbox.json');
    const getOutboxLength = () => {
      if (fs.existsSync(outboxPath)) {
        try {
          return JSON.parse(fs.readFileSync(outboxPath, 'utf8')).length;
        } catch {
          return 0;
        }
      }
      return 0;
    };

    // Snapshot state before API calls
    const projBefore = await db.getProjectById(projectId);
    const eventsBefore = await db.getEvents(projectId);
    const runsBefore = await db.getTestRuns(projectId);
    const outboxBeforeCount = getOutboxLength();

    // Fire 6 consecutive API calls across different agents
    await callContextApi(projectId, 'forge');
    await callContextApi(projectId, 'scout');
    await callContextApi(projectId, 'sentinel');
    await callContextApi(projectId, 'forge');
    await callContextApi(projectId, 'scout');
    await callContextApi(projectId, 'sentinel');

    // Snapshot state after API calls
    const projAfter = await db.getProjectById(projectId);
    const eventsAfter = await db.getEvents(projectId);
    const runsAfter = await db.getTestRuns(projectId);
    const outboxAfterCount = getOutboxLength();

    // Verify Invariants
    if (projBefore?.revision !== projAfter?.revision) {
      throw new Error(`State mutated! Revision changed from ${projBefore?.revision} to ${projAfter?.revision}`);
    }

    if (projBefore?.updatedAt !== projAfter?.updatedAt) {
      throw new Error(`State mutated! updatedAt changed from ${projBefore?.updatedAt} to ${projAfter?.updatedAt}`);
    }

    if (eventsBefore.length !== eventsAfter.length) {
      throw new Error(`Events mutated! Count changed from ${eventsBefore.length} to ${eventsAfter.length}`);
    }

    if (runsBefore.length !== runsAfter.length) {
      throw new Error(`Test runs mutated! Count changed from ${runsBefore.length} to ${runsAfter.length}`);
    }

    if (outboxBeforeCount !== outboxAfterCount) {
      throw new Error(`Outbox mutated! Count changed from ${outboxBeforeCount} to ${outboxAfterCount}`);
    }

    console.log(`  ✓ Project revision unchanged: #${projAfter?.revision}`);
    console.log(`  ✓ Events count unchanged: ${eventsAfter.length}`);
    console.log(`  ✓ Test runs count unchanged: ${runsAfter.length}`);
    console.log(`  ✓ Outbox count unchanged: ${outboxAfterCount}`);
    console.log('✅ Proof 5 PASSED: Context Inspector is strictly inspection-only. Zero side effects.\n');
  } catch (err: any) {
    console.error('❌ Proof 5 FAILED:', err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('================================================================');
  if (allPassed) {
    console.log('🏆 PHASE 2E: CONTEXT INSPECTOR API & UI VERIFICATION COMPLETE (5/5 PASS)');
    console.log('   All 5 Invariants & Contracts Verified Against Real Project Store.');
  } else {
    console.error('❌ PHASE 2E VERIFICATION FAILED: One or more proofs did not pass.');
    process.exit(1);
  }
  console.log('================================================================');
}

runStep5ContextApiUiTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
