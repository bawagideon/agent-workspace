import { NextResponse } from 'next/server';
import { loopMissionAdapter } from '@/lib/LoopMissionAdapter';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, title, objective, riskLevel } = body;

    if (!projectId || !title || !objective) {
      return NextResponse.json(
        { success: false, error: 'projectId, title, and objective are required fields.' },
        { status: 400 }
      );
    }

    const pipeline = await loopMissionAdapter.createProjectPipeline({
      projectId,
      title,
      objective,
      riskLevel: riskLevel || 'MEDIUM'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully provisioned 3-loop pipeline for project ${pipeline.projectSlug}`,
      pipeline
    });
  } catch (err: any) {
    console.error('Failed to create project pipeline:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error creating project pipeline' },
      { status: 500 }
    );
  }
}
