import { NextResponse } from 'next/server';
import { ProjectDatabase } from '@/lib/projects/ProjectDatabase';
import { DeterministicMockProvider, StripeProvider, FinancialControlPlane } from '@gideon/billing';

function getFcp(): FinancialControlPlane {
  const isStripe = process.env.BILLING_PROVIDER === 'stripe' && !process.env.BILLING_TEST_MODE;
  const gateway = isStripe
    ? new StripeProvider(process.env.STRIPE_SECRET_KEY || '')
    : new DeterministicMockProvider(process.env.STRIPE_WEBHOOK_SECRET || 'whsec_deterministic_test_secret_for_gideon_phase4');
  return new FinancialControlPlane(gateway, ProjectDatabase.getInstance());
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const fcp = getFcp();
    const projection = await fcp.getFinancialProjection(id);
    const ledger = await ProjectDatabase.getInstance().getProjectLedger(id);
    const reservations = await ProjectDatabase.getInstance().getActiveReservations(id);

    return NextResponse.json({
      success: true,
      projection,
      ledger: ledger.slice(0, 25),
      activeReservations: reservations
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 404 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { actor, actorRole, field, newValue, reason, expectedRevision } = body;

    if (!actor || !actorRole || !field || newValue === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required mutation fields' }, { status: 400 });
    }

    const fcp = getFcp();
    await fcp.mutateFinancialTerms({
      projectId: id,
      actor,
      actorRole,
      field,
      newValue: Number(newValue),
      reason: reason || 'Human terms update',
      expectedRevision: expectedRevision !== undefined ? Number(expectedRevision) : undefined
    });

    const projection = await fcp.getFinancialProjection(id);
    return NextResponse.json({ success: true, projection });
  } catch (err: any) {
    const status = err.name === 'FinancialGateError' && err.code === 'UNAUTHORIZED' ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
