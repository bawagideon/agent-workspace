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
    const tailLines = parseInt(url.searchParams.get('tail') || '100', 10);

    const supervisor = ProcessSupervisor.getInstance();
    const proc = supervisor.getProcess(id);
    if (!proc) {
      return NextResponse.json({ success: false, error: `Process '${id}' not found.` }, { status: 404 });
    }

    // If requesterProjectId is provided, only enforce strict ownership if it matches or allow internal HQ query
    const targetProjectId = (requesterProjectId && requesterProjectId === proc.projectId) ? requesterProjectId : undefined;
    const logs = supervisor.getLogs(id, targetProjectId, tailLines);

    return NextResponse.json({
      success: true,
      processId: id,
      logs
    });
  } catch (err: any) {
    const status = err instanceof ProcessOwnershipViolationError ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
