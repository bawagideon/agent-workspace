import { CheckoutSessionRequest, CheckoutSessionResult } from './types';

export interface VerifiedStripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface PaymentGateway {
  readonly providerName: string;
  createCheckoutSession(
    req: CheckoutSessionRequest,
    amountCents: number,
    projectTitle: string
  ): Promise<CheckoutSessionResult>;
  verifyWebhookSignature(
    rawBody: string | Buffer,
    signature: string,
    secret: string,
    toleranceSeconds?: number
  ): Promise<VerifiedStripeEvent>;
}
