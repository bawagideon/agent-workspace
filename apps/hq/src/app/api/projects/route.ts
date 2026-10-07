import { NextResponse } from 'next/server';
import { ProjectRegistry } from '@/lib/projects/ProjectRegistry';
import { ProjectDatabase } from '@/lib/projects/ProjectDatabase';

export async function GET() {
  try {
    const registry = ProjectRegistry.getInstance();
    const projects = await registry.listProjects();

    const summary = {
      totalProjects: projects.length,
      healthyCount: projects.filter(p => p.healthStatus === 'HEALTHY').length,
      totalBuildCostCents: projects.reduce((acc, p) => acc + (p.buildCostCents || 0), 0),
      totalValueCents: projects.reduce((acc, p) => acc + (p.pricingCents || 0), 0)
    };

    return NextResponse.json({
      success: true,
      projects,
      summary
    });
  } catch (err: any) {
    console.error('[API /api/projects] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = ProjectDatabase.getInstance();

    if (!body.name || !body.slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    const projectId = `proj_${body.slug.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const newProject = {
      id: projectId,
      slug: body.slug,
      name: body.name,
      category: body.category || 'SAAS',
      status: 'DISCOVERY' as const,
      workspacePath: `projects/${body.slug}`,
      repository: body.repository || 'bawagideon/agent-workspace',
      currentVersion: 'v0.1.0',
      revision: 0,
      businessObjective: body.businessObjective || '',
      targetCustomer: body.targetCustomer || '',
      problemSolved: body.problemSolved || '',
      pricingCents: body.pricingCents || 50000,
      currency: body.currency || 'USD',
      buildCostCents: 0,
      totalTokensUsed: 0,
      healthStatus: 'HEALTHY' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await db.saveProject(newProject);
    await db.logEvent({
      projectId: saved.id,
      eventType: 'PROJECT_CREATED',
      actor: body.actor || 'human',
      payload: { name: saved.name, slug: saved.slug }
    });

    return NextResponse.json({ success: true, project: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
