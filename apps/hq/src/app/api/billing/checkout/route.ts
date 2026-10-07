import { NextResponse } from 'next/server';
import { ProjectDatabase } from '@/lib/projects/ProjectDatabase';
import { StripeProvider, DeterministicMockProvider, PaymentGateway } from '@gideon/billing';

function getGateway(): PaymentGateway {
  const isStripe = process.env.BILLING_PROVIDER === 'stripe' && !process.env.BILLING_TEST_MODE;
  if (isStripe) {
    return new StripeProvider(process.env.STRIPE_SECRET_KEY || '');
  }
  return new DeterministicMockProvider(process.env.STRIPE_WEBHOOK_SECRET || 'whsec_deterministic_test_secret_for_gideon_phase4');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, commercialAction = 'DEPOSIT', clientEmail, successUrl, cancelUrl } = body;

    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId is required' }, { status: 400 });
    }

    // Security Check: Server-Authoritative pricing. Rejects client-supplied amounts!
    if (body.amountCents !== undefined || body.price !== undefined) {
      return NextResponse.json(
        { success: false, error: 'Security Violation: Client-supplied pricing is forbidden. Amounts are derived from authoritative commercial terms.' },
        { status: 400 }
      );
    }

    const projectDb = ProjectDatabase.getInstance();
    const project = await projectDb.getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: `Project not found: ${projectId}` }, { status: 404 });
    }

    const quotedPrice = project.pricingCents || 0;
    const minimumDeposit = project.minimumDepositCents || 0;
    const depositPct = project.depositPercentage || 50.0;
    const depositRequired = Math.max(minimumDeposit, Math.round(quotedPrice * (depositPct / 100)));

    const amountCents = commercialAction === 'FULL_PAYMENT' ? quotedPrice : depositRequired;

    const gateway = getGateway();
    const session = await gateway.createCheckoutSession(
      {
        projectId,
        commercialAction,
        clientEmail,
        successUrl,
        cancelUrl
      },
      amountCents,
      project.name
    );

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      sessionUrl: session.sessionUrl,
      projectId,
      amountCents,
      currency: session.currency
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
