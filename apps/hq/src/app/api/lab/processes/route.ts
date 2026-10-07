import path from 'path';
import { NextResponse } from 'next/server';
import { ProcessSupervisor } from '@gideon/runner';
import { ProjectRegistry } from '@/lib/projects/ProjectRegistry';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const supervisor = ProcessSupervisor.getInstance();

    let list = supervisor.listProcesses();
    if (projectId) {
      list = list.filter(p => p.projectId === projectId);
    }

    const sanitized = list.map(p => ({
      id: p.id,
      projectId: p.projectId,
      port: p.port,
      pid: p.pid,
      executionTarget: p.executionTarget,
      status: p.status,
      health: p.health,
      startedAt: p.startedAt,
      stoppedAt: p.stoppedAt,
      exitCode: p.exitCode,
      logCount: p.logBuffer.length
    }));

    return NextResponse.json({ success: true, processes: sanitized });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, executionTarget = 'dev' } = body;

    // Fail-Closed Validation (Invariant 5: Governed Execution Target)
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'projectId is required and must be a string.' },
        { status: 400 }
      );
    }

    if (!['dev', 'build', 'test'].includes(executionTarget)) {
      return NextResponse.json(
        { success: false, error: "executionTarget must be 'dev', 'build', or 'test'." },
        { status: 400 }
      );
    }

    // Prohibit arbitrary command strings from API callers (Pre-flight Correction 5)
    if ('command' in body) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Arbitrary command execution is forbidden. Provide 'executionTarget' to run approved profile commands." 
        },
        { status: 403 }
      );
    }

    const registry = ProjectRegistry.getInstance();
    const project = await registry.getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: `Project '${projectId}' not found in registry.` },
        { status: 404 }
      );
    }

    const profile = project.metadata?.executionProfile;
    if (!profile) {
      return NextResponse.json(
        { success: false, error: `Project '${projectId}' has no approved execution profile.` },
        { status: 400 }
      );
    }

    const supervisor = ProcessSupervisor.getInstance();
    const proc = await supervisor.startProcess({
      projectId,
      executionTarget,
      profile,
      workspaceRoot: process.env.WORKSPACE_ROOT || path.resolve(process.cwd(), '../..')
    });

    return NextResponse.json({
      success: true,
      process: {
        id: proc.id,
        projectId: proc.projectId,
        port: proc.port,
        pid: proc.pid,
        executionTarget: proc.executionTarget,
        status: proc.status,
        health: proc.health,
        startedAt: proc.startedAt
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
