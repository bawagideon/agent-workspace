import { NextResponse } from 'next/server';
import { opportunityIntelligenceEngine } from '@gideon/runtime';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, probeType, prototypeType, operatorNotes } = body;

    switch (action) {
      case 'SENTINEL_REVIEW': {
        const res = opportunityIntelligenceEngine.reviewOpportunityWithSentinel(id);
        return NextResponse.json(res);
      }
      case 'FORGE_INVESTIGATE': {
        const res = opportunityIntelligenceEngine.investigateTechnicalPainWithForge(id, probeType || 'AUDIT_ENDPOINT');
        return NextResponse.json(res);
      }
      case 'FORGE_PROTOTYPE': {
        const res = opportunityIntelligenceEngine.buildMicroPrototype(id, prototypeType || 'MICRO_PROTOTYPE');
        return NextResponse.json(res);
      }
      case 'SENTINEL_VALIDATE': {
        const res = opportunityIntelligenceEngine.validatePrototypeWithSentinel(id);
        return NextResponse.json(res);
      }
      case 'APPROVE_CONTACT': {
        const res = opportunityIntelligenceEngine.approveHumanContact(id, operatorNotes);
        return NextResponse.json(res);
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
