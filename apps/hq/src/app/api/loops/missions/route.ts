import { NextResponse } from 'next/server';
import { loopMissionAdapter, MissionLoop } from '@/lib/LoopMissionAdapter';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const loop = searchParams.get('loop') as MissionLoop | null;
    const missionId = searchParams.get('missionId');

    if (missionId) {
      const mission = await loopMissionAdapter.getMissionById(missionId);
      if (!mission) {
        return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, mission });
    }

    const missions = await loopMissionAdapter.getMissions(loop || undefined);
    return NextResponse.json({ success: true, missions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { loop, title, objective, projectId, workforce, riskLevel, constraints } = body;

    if (!loop || !title || !objective) {
      return NextResponse.json(
        { success: false, error: 'loop, title, and objective are required fields.' },
        { status: 400 }
      );
    }

    const mission = await loopMissionAdapter.createMission({
      loop,
      title,
      objective,
      projectId,
      workforce,
      riskLevel,
      constraints
    });

    return NextResponse.json({ success: true, mission });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
