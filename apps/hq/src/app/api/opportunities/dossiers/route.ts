import { NextResponse } from 'next/server';
import { opportunityDossierAdapter, OpportunityLifecycle } from '@/lib/OpportunityDossierAdapter';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lifecycle = searchParams.get('lifecycle') as OpportunityLifecycle | null;
    const signalType = searchParams.get('signalType');
    const locationQuery = searchParams.get('location');
    const search = searchParams.get('search');

    const dossiers = opportunityDossierAdapter.getAll({
      lifecycle: lifecycle || undefined,
      signalType: signalType || undefined,
      locationQuery: locationQuery || undefined,
      search: search || undefined
    });

    return NextResponse.json({
      success: true,
      total: dossiers.length,
      dossiers
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newId = `opp-${Date.now().toString(36)}`;
    const newDossier = {
      id: newId,
      business: {
        name: body.businessName || body.title || 'Discovered Lead',
        industry: body.industry || 'Professional Services',
        location: body.location || 'Global / Remote',
        website: body.website || undefined,
        sourceUrls: body.sourceUrl ? [body.sourceUrl] : []
      },
      discovery: {
        discoveredAt: new Date().toISOString(),
        discoverySource: body.source || 'HUMAN_INPUT',
        discoveryReason: body.description || body.discoveryReason || 'Operator captured lead for Scout technical audit.',
        signalType: body.signalType || 'MANUAL_PROCESS'
      },
      evidence: [
        {
          type: 'WEBSITE' as const,
          sourceUrl: body.website,
          observation: body.description || 'Initial opportunity captured by operator.',
          verifiedAt: new Date().toISOString(),
          confidence: 0.6
        }
      ],
      pain: {
        hypothesis: body.description || 'Workflow friction or booking funnel drop-off identified.',
        evidenceBackedFacts: [],
        confidence: 50
      },
      diagnosis: {
        website: [],
        ux: [],
        conversion: [],
        performance: [],
        automation: []
      },
      solution: {
        productName: `${body.businessName || 'Client'} Custom Solution`,
        objective: 'Streamline client acquisition and conversion pipeline.',
        features: ['Automated inquiry intake', 'Instant quote calculation', 'Direct confirmation routing'],
        architecture: ['Next.js 14', 'TypeScript', 'Serverless Edge API'],
        integrations: ['Stripe Billing', 'Twilio SMS', 'Email Gateway'],
        acceptanceCriteria: ['Passes Sentinel QA audit', 'Zero submission drops']
      },
      economics: {
        estimatedBuildHours: 20,
        estimatedCostUSD: 100,
        proposedPriceUSD: Number(body.estimatedPrice) || 2500,
        priceRangeUSD: [2000, 3200] as [number, number],
        depositRequirementUSD: Math.round((Number(body.estimatedPrice) || 2500) * 0.5),
        pricingAssumptions: ['Standard deployment', 'Single domain setup'],
        confidence: 70,
        pricingRationale: 'Derived from average high-ticket service automation benchmarks.'
      },
      lifecycle: 'DISCOVERED' as const
    };

    const saved = opportunityDossierAdapter.addDossier(newDossier);
    return NextResponse.json({ success: true, dossier: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

