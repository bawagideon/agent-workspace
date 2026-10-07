import Stripe from 'stripe';
import { PaymentGateway, VerifiedStripeEvent } from './PaymentGateway';
import { CheckoutSessionRequest, CheckoutSessionResult } from './types';

export class StripeProvider implements PaymentGateway {
  readonly providerName = 'stripe';
  private stripe: Stripe;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('StripeProvider initialization failed: API key is required');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16' as any,
    });
  }

  async createCheckoutSession(
    req: CheckoutSessionRequest,
    amountCents: number,
    projectTitle: string
  ): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `${projectTitle} (${req.commercialAction})`,
              description: `Gideon AI Project Deposit - ${req.projectId}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: req.clientEmail,
      client_reference_id: req.projectId,
      metadata: {
        projectId: req.projectId,
        commercialAction: req.commercialAction,
      },
      success_url: req.successUrl || 'http://localhost:3000/lab?payment=success',
      cancel_url: req.cancelUrl || 'http://localhost:3000/lab?payment=cancelled',
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url || '',
      projectId: req.projectId,
      amountCents,
      currency: 'USD',
    };
  }

  async verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string,
    toleranceSeconds = 300
  ): Promise<VerifiedStripeEvent> {
    if (!secret || !signature) {
      throw new Error('Missing stripe-signature or webhook secret');
    }
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      secret,
      toleranceSeconds
    );
    return event as VerifiedStripeEvent;
  }
}
