import { NextResponse } from 'next/server';
import { ProjectRegistry } from '@/lib/projects/ProjectRegistry';
import { ProjectDatabase } from '@/lib/projects/ProjectDatabase';
import { ProjectStateMachine } from '@/lib/projects/ProjectStateMachine';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const registry = ProjectRegistry.getInstance();
    const db = ProjectDatabase.getInstance();

    const project = await registry.getProject(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const events = await db.getEvents(project.id);
    const testRuns = await db.getTestRuns(project.id);

    return NextResponse.json({
      success: true,
      project,
      events,
      testRuns
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = ProjectDatabase.getInstance();

    const project = await db.getProjectById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Status transitions MUST pass through the authoritative ProjectStateMachine
    if (body.status && body.status !== project.status) {
      const transitioned = await ProjectStateMachine.transition(
        project.id,
        body.status,
        body.actor || 'human',
        body.reason
      );
      return NextResponse.json({ success: true, project: transitioned });
    }

    // Field-level governed updates with optimistic concurrency check
    const expectedRevision = typeof body.expectedRevision === 'number' ? body.expectedRevision : project.revision;

    if (body.name) project.name = body.name;
    if (body.businessObjective) project.businessObjective = body.businessObjective;
    if (body.targetCustomer) project.targetCustomer = body.targetCustomer;
    if (body.problemSolved) project.problemSolved = body.problemSolved;
    if (typeof body.pricingCents === 'number') project.pricingCents = body.pricingCents;
    if (body.currency) project.currency = body.currency;
    if (body.healthStatus) project.healthStatus = body.healthStatus;

    const saved = await db.saveProject(project, expectedRevision);
    await db.logEvent({
      projectId: saved.id,
      eventType: 'REQUIREMENTS_UPDATED',
      actor: body.actor || 'human',
      payload: { updatedFields: Object.keys(body) }
    });

    return NextResponse.json({ success: true, project: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
