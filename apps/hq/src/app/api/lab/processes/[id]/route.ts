import { NextResponse } from 'next/server';
import { ProcessSupervisor, ProcessOwnershipViolationError } from '@gideon/runner';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const requesterProjectId = url.searchParams.get('projectId') || undefined;

    const supervisor = ProcessSupervisor.getInstance();
    const proc = supervisor.getProcess(id, requesterProjectId);

    if (!proc) {
      return NextResponse.json(
        { success: false, error: `Managed process '${id}' not found.` },
        { status: 404 }
      );
    }

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
        startedAt: proc.startedAt,
        stoppedAt: proc.stoppedAt,
        exitCode: proc.exitCode,
        logCount: proc.logBuffer.length
      }
    });
  } catch (err: any) {
    const status = err instanceof ProcessOwnershipViolationError ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    let requesterProjectId = url.searchParams.get('projectId') || undefined;

    if (!requesterProjectId) {
      try {
        const body = await req.json();
        requesterProjectId = body.projectId;
      } catch {}
    }

    // Ownership Enforcement (Pre-flight Correction 6)
    const supervisor = ProcessSupervisor.getInstance();
    let stopped;
    try {
      stopped = await supervisor.stopProcess(id, requesterProjectId);
    } catch (stopErr: any) {
      if (stopErr.message?.includes('not found')) {
        return NextResponse.json({
          success: true,
          process: {
            id,
            projectId: requesterProjectId || 'unknown',
            status: 'STOPPED',
            stoppedAt: new Date().toISOString()
          },
          alreadyStopped: true
        });
      }
      throw stopErr;
    }

    return NextResponse.json({
      success: true,
      process: {
        id: stopped.id,
        projectId: stopped.projectId,
        status: stopped.status,
        stoppedAt: stopped.stoppedAt
      }
    });
  } catch (err: any) {
    const status = err instanceof ProcessOwnershipViolationError ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
