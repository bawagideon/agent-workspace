import { NextResponse } from 'next/server';
import { opportunityDossierAdapter } from '@/lib/OpportunityDossierAdapter';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await opportunityDossierAdapter.createBuildMission(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      missionId: result.missionId,
      message: `Build Mission successfully provisioned for ${id}. Redirect to Loop 1 Build Studio.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
