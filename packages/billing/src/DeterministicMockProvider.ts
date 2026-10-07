import crypto from 'crypto';
import { PaymentGateway, VerifiedStripeEvent } from './PaymentGateway';
import { CheckoutSessionRequest, CheckoutSessionResult } from './types';

export class DeterministicMockProvider implements PaymentGateway {
  readonly providerName = 'mock';
  private testSecret: string;

  constructor(testSecret = 'whsec_deterministic_test_secret_for_gideon_phase4') {
    this.testSecret = testSecret;
  }

  async createCheckoutSession(
    req: CheckoutSessionRequest,
    amountCents: number,
    projectTitle: string
  ): Promise<CheckoutSessionResult> {
    const sessionId = `cs_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      sessionId,
      sessionUrl: `https://checkout.stripe.mock/pay/${sessionId}?project=${req.projectId}&amount=${amountCents}`,
      projectId: req.projectId,
      amountCents,
      currency: 'USD',
    };
  }

  /**
   * Generates a signed webhook payload adhering to the standard Stripe signature format
   * (t=timestamp,v1=signature) for deterministic offline and CI verification.
   */
  generateSignedPayload(
    event: { id: string; type: string; data: { object: any } },
    secret = this.testSecret,
    timestamp = Math.floor(Date.now() / 1000)
  ): { rawBody: string; signatureHeader: string } {
    const rawBody = JSON.stringify(event);
    const signaturePayload = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('sha256', secret).update(signaturePayload, 'utf8').digest('hex');
    const signatureHeader = `t=${timestamp},v1=${hmac}`;
    return { rawBody, signatureHeader };
  }

  async verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret = this.testSecret,
    toleranceSeconds = 300
  ): Promise<VerifiedStripeEvent> {
    if (!signature) {
      throw new Error('No stripe-signature header value was provided.');
    }
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // Parse header: t=1234567890,v1=abcdef...
    const parts = signature.split(',').reduce((acc: Record<string, string>, item) => {
      const [k, v] = item.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const timestamp = parseInt(parts.t, 10);
    const expectedSig = parts.v1;

    if (!timestamp || !expectedSig) {
      throw new Error('Unable to extract timestamp and signatures from header');
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      throw new Error(`Timestamp outside the tolerance zone (diff: ${Math.abs(now - timestamp)}s > ${toleranceSeconds}s)`);
    }

    const computedHmac = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${bodyStr}`, 'utf8')
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(computedHmac), Buffer.from(expectedSig))) {
      throw new Error('No signatures found matching the expected signature for payload');
    }

    return JSON.parse(bodyStr) as VerifiedStripeEvent;
  }
}
