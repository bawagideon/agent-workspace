import { NextResponse } from 'next/server';
import { ProjectDatabase } from '@/lib/projects/ProjectDatabase';
import { StripeProvider, DeterministicMockProvider, FinancialControlPlane, PaymentGateway } from '@gideon/billing';

function getGateway(): PaymentGateway {
  const isStripe = process.env.BILLING_PROVIDER === 'stripe' && !process.env.BILLING_TEST_MODE;
  if (isStripe) {
    return new StripeProvider(process.env.STRIPE_SECRET_KEY || '');
  }
  return new DeterministicMockProvider(process.env.STRIPE_WEBHOOK_SECRET || 'whsec_deterministic_test_secret_for_gideon_phase4');
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const rawBody = await req.text();
    const gateway = getGateway();
    const projectDb = ProjectDatabase.getInstance();
    const fcp = new FinancialControlPlane(gateway, projectDb);

    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_deterministic_test_secret_for_gideon_phase4';

    const result = await fcp.reconcileWebhookEvent(rawBody, signature, secret);

    return NextResponse.json({
      received: true,
      duplicate: result.duplicate,
      providerEventId: result.providerEventId,
      eventType: result.eventType,
      projectId: result.projectId,
      transactionId: result.transactionId
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
