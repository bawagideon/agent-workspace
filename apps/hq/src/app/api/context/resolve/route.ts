import { NextRequest, NextResponse } from 'next/server';
import { ContextResolver } from '@gideon/runtime';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const missionId = searchParams.get('missionId') || undefined;
    const agentId = searchParams.get('agentId') || undefined;

    const envelope = await ContextResolver.compileEnvelope({
      page,
      projectId,
      missionId,
      agentId
    });

    return NextResponse.json({
      success: true,
      envelope
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
