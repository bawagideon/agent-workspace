import { NextResponse } from 'next/server';
import { opportunityDossierAdapter, OpportunityLifecycle, EvidenceItem } from '@/lib/OpportunityDossierAdapter';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dossier = opportunityDossierAdapter.getById(id);

    if (!dossier) {
      return NextResponse.json({ success: false, error: 'Dossier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, dossier });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { lifecycle, evidence } = body;

    let updated = opportunityDossierAdapter.getById(id);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Dossier not found' }, { status: 404 });
    }

    if (lifecycle) {
      updated = opportunityDossierAdapter.updateLifecycle(id, lifecycle as OpportunityLifecycle) || updated;
    }

    if (evidence) {
      updated = opportunityDossierAdapter.addEvidence(id, evidence as EvidenceItem) || updated;
    }

    return NextResponse.json({ success: true, dossier: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
