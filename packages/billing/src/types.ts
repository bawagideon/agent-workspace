export type PaymentState =
  | 'UNFUNDED'
  | 'PARTIALLY_FUNDED'
  | 'FUNDED'
  | 'EXECUTION_SUSPENDED'
  | 'BUDGET_EXHAUSTED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PAYMENT_REVERSED';

export type TransactionType =
  | 'REVENUE'
  | 'SPEND_RESERVATION'
  | 'TOKEN_COST'
  | 'RUNNER_COST'
  | 'RESERVATION_RELEASE'
  | 'REFUND'
  | 'PAYMENT_REVERSED'
  | 'ADJUSTMENT';

export interface DepositPolicy {
  minimumDepositCents: number;
  depositPercentage: number; // e.g. 50.0 for 50%
}

export interface FinancialProjection {
  projectId: string;
  quotedPriceCents: number;
  budgetCapCents: number;
  cashReceivedCents: number;
  settledSpendCents: number;
  reservedSpendCents: number;
  availableBalanceCents: number;
  paymentState: PaymentState;
  depositRequiredCents: number;
  isExecutionAllowed: boolean;
  rejectionReason?: string;
  updatedAt: string;
}

export interface SpendReservation {
  id: string;
  projectId: string;
  amountCents: number;
  status: 'ACTIVE' | 'SETTLED' | 'RELEASED' | 'EXPIRED';
  taskId?: string;
  agentId?: string;
  reason: string;
  createdAt: string;
  expiresAt: string;
  settledAt?: string;
  settledAmountCents?: number;
}

export interface CheckoutSessionRequest {
  projectId: string;
  commercialAction: 'DEPOSIT' | 'FULL_PAYMENT' | 'MILESTONE';
  clientEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  sessionUrl: string;
  projectId: string;
  amountCents: number;
  currency: string;
}

export interface ProcessedProviderEvent {
  providerEventId: string;
  provider: string;
  eventType: string;
  projectId?: string;
  processedAt: string;
  payload?: any;
}

export interface WebhookIngestResult {
  received: boolean;
  duplicate: boolean;
  providerEventId: string;
  eventType: string;
  projectId?: string;
  transactionId?: string;
}

export interface FinancialMutationRequest {
  projectId: string;
  actor: string;
  actorRole: 'HUMAN_ADMIN' | 'HUMAN_OPERATOR' | 'AGENT';
  field: 'budgetCapCents' | 'quotedPriceCents' | 'minimumDepositCents' | 'depositPercentage';
  newValue: number;
  reason: string;
  expectedRevision?: number;
}

export interface LedgerRecord {
  id: string;
  projectId: string;
  transactionType: TransactionType;
  currency: string;
  amountCents: number;
  tokenCount?: number;
  unitCostCents?: number;
  agentId?: string;
  taskId?: string;
  missionId?: string;
  status: 'COMMITTED' | 'PENDING' | 'VOIDED';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
