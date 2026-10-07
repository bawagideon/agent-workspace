import { NextResponse } from 'next/server';
import { ProjectRegistry } from '@/lib/projects/ProjectRegistry';
import { ProjectDatabase } from '@/lib/projects/ProjectDatabase';
import { ProjectContextPackBuilder } from '@gideon/memory';
import { ContextTargetAgent } from '@gideon/shared';

const VALID_AGENTS: ContextTargetAgent[] = ['forge', 'scout', 'sentinel'];

/**
 * GET /api/projects/:id/context?agent=forge|scout|sentinel
 * Inspection-Only endpoint returning deterministic, permission-scoped Context Pack.
 * Strict Invariant: Pure read-only inspection. Zero state mutation.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const rawAgent = url.searchParams.get('agent');
    const agentParam = (rawAgent === null ? 'forge' : rawAgent.trim().toLowerCase()) as ContextTargetAgent;

    // Fail-Closed Target Agent Validation
    if (!VALID_AGENTS.includes(agentParam)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported target agent '${agentParam}'. Permitted agents: ${VALID_AGENTS.join(', ')}.` 
        }, 
        { status: 400 }
      );
    }

    const registry = ProjectRegistry.getInstance();
    const db = ProjectDatabase.getInstance();

    const project = await registry.getProject(id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: `Project '${id}' not found` }, 
        { status: 404 }
      );
    }

    // Build read-only projection
    const builder = new ProjectContextPackBuilder(db);
    const pack = await builder.buildPack(project.id, agentParam);
    const freshness = ProjectContextPackBuilder.verifyFreshness(pack, project.revision);

    // Provenance Traceability Mapping
    const traceability = {
      projectIdentity: { source: 'hq_projects', recordId: project.id, revision: project.revision },
      history: { source: 'hq_project_missions, hq_project_events', eventsCount: pack.history.auditEventCount },
      currentState: { source: 'hq_projects', revision: project.revision, status: project.status },
      decisionRationale: { source: 'hq_projects.metadata.decisionRationale', confidence: pack.decisionRationale.decisionConfidence },
      evidence: { source: '.gideon/evidence, hq_project_test_runs', evidenceCount: pack.evidence.evidenceIds.length },
      constraints: { source: 'hq_projects.metadata.executionProfile', workingDir: pack.constraints.workingDirectory },
      nextAgentBrief: { source: `AgentSecurityPolicy [${agentParam}]`, deliverable: pack.nextAgentBrief.expectedDeliverable },
      inaccessibleInformation: { 
        source: 'SecurityProjectionPipeline (Least Privilege Firewall)', 
        maskedCategories: pack.inaccessibleInformation.inaccessibleCategories 
      },
      verifiedLessons: { source: 'hq_verified_lessons', count: pack.verifiedLessons.length }
    };

    return NextResponse.json({
      success: true,
      pack,
      freshness,
      traceability
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
