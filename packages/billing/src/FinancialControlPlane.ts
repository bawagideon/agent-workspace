import crypto from 'crypto';
import { ProjectDatabase, ProjectLedgerRecord, SpendReservationRecord } from '../../../apps/hq/src/lib/projects/ProjectDatabase';
import { PaymentGateway } from './PaymentGateway';
import { 
  FinancialProjection, 
  SpendReservation, 
  WebhookIngestResult, 
  FinancialMutationRequest, 
  PaymentState,
  DepositPolicy 
} from './types';

export class FinancialGateError extends Error {
  public readonly code: 'PAYMENT_REQUIRED' | 'INSUFFICIENT_FUNDS' | 'BUDGET_EXCEEDED' | 'PAYMENT_REVERSED' | 'UNAUTHORIZED';

  constructor(code: 'PAYMENT_REQUIRED' | 'INSUFFICIENT_FUNDS' | 'BUDGET_EXCEEDED' | 'PAYMENT_REVERSED' | 'UNAUTHORIZED', message: string) {
    super(message);
    this.name = 'FinancialGateError';
    this.code = code;
  }
}

export class FinancialControlPlane {
  private projectDb: ProjectDatabase;
  private paymentGateway: PaymentGateway;
  private projectMutexes: Map<string, Promise<void>> = new Map();

  constructor(paymentGateway: PaymentGateway, projectDb?: ProjectDatabase) {
    this.paymentGateway = paymentGateway;
    this.projectDb = projectDb || ProjectDatabase.getInstance();
  }

  /**
   * Acquire a local lock for a project to optimize concurrent contention.
   * Concurrency authority remains backed by Supabase DB transactions and OCC revisions.
   */
  private async withProjectLock<T>(projectId: string, fn: () => Promise<T>): Promise<T> {
    const currentLock = this.projectMutexes.get(projectId) || Promise.resolve();
    let release!: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.projectMutexes.set(projectId, nextLock);
    await currentLock;
    try {
      return await fn();
    } finally {
      release();
      if (this.projectMutexes.get(projectId) === nextLock) {
        this.projectMutexes.delete(projectId);
      }
    }
  }

  /**
   * Derives real-time financial projection from authoritative ledger transactions
   * and active spend reservations.
   */
  public async getFinancialProjection(projectId: string): Promise<FinancialProjection> {
    const project = await this.projectDb.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const ledger = await this.projectDb.getProjectLedger(projectId);
    const activeReservations = await this.projectDb.getActiveReservations(projectId);

    // 1. Calculate cash received (net of refunds and reversals)
    let grossCashCents = 0;
    let refundedCashCents = 0;
    let reversedCashCents = 0;

    for (const tx of ledger) {
      if (tx.status === 'VOIDED') continue;
      if (tx.transactionType === 'REVENUE') {
        grossCashCents += tx.amountCents;
      } else if (tx.transactionType === 'REFUND') {
        refundedCashCents += tx.amountCents;
      } else if (tx.transactionType === 'PAYMENT_REVERSED') {
        reversedCashCents += tx.amountCents;
      }
    }
    const cashReceivedCents = Math.max(0, grossCashCents - refundedCashCents - reversedCashCents);

    // 2. Calculate settled compute spend
    let settledSpendCents = 0;
    for (const tx of ledger) {
      if (tx.status === 'VOIDED') continue;
      if (tx.transactionType === 'TOKEN_COST' || tx.transactionType === 'RUNNER_COST') {
        settledSpendCents += tx.amountCents;
      }
    }

    // 3. Calculate reserved spend (active, unexpired holds)
    const now = Date.now();
    let reservedSpendCents = 0;
    for (const res of activeReservations) {
      if (res.status === 'ACTIVE' && new Date(res.expiresAt).getTime() > now) {
        reservedSpendCents += res.amountCents;
      }
    }

    // 4. Invariant: Available Balance = cash - settled - reserved
    const availableBalanceCents = cashReceivedCents - settledSpendCents - reservedSpendCents;

    const quotedPriceCents = project.pricingCents || project.quotedPriceCents || 0;
    const budgetCapCents = project.budgetCapCents || 10000;
    const minimumDepositCents = project.minimumDepositCents || 0;
    const depositPercentage = project.depositPercentage || 50.0;

    // Required Deposit Policy: max(minimumDeposit, quotedPrice * depositPercentage)
    const depositRequiredCents = Math.max(
      minimumDepositCents,
      Math.round(quotedPriceCents * (depositPercentage / 100))
    );

    // 5. Payment State Calculation
    let paymentState: PaymentState = 'UNFUNDED';
    let isExecutionAllowed = false;
    let rejectionReason: string | undefined;

    if (reversedCashCents > 0) {
      paymentState = 'PAYMENT_REVERSED';
      isExecutionAllowed = false;
      rejectionReason = 'Payment reversed / chargeback detected. Execution authority revoked.';
    } else if (refundedCashCents > 0 && cashReceivedCents <= 0) {
      paymentState = 'REFUNDED';
      isExecutionAllowed = false;
      rejectionReason = 'Project deposit fully refunded. Execution authority revoked.';
    } else if (settledSpendCents + reservedSpendCents >= budgetCapCents) {
      paymentState = 'BUDGET_EXHAUSTED';
      rejectionReason = `Project budget cap of ${(budgetCapCents / 100).toFixed(2)} reached or exceeded.`;
    } else if (project.category === 'CLIENT_SERVICE' || project.category === 'SAAS') {
      if (quotedPriceCents > 0) {
        if (cashReceivedCents >= depositRequiredCents) {
          paymentState = 'FUNDED';
          if (availableBalanceCents > 0) {
            isExecutionAllowed = true;
          } else {
            rejectionReason = 'Available balance depleted. Additional funding required.';
          }
        } else if (cashReceivedCents > 0) {
          paymentState = 'PARTIALLY_FUNDED';
          rejectionReason = `Required deposit is ${(depositRequiredCents / 100).toFixed(2)}. Only ${(cashReceivedCents / 100).toFixed(2)} received.`;
        } else {
          paymentState = 'UNFUNDED';
          rejectionReason = 'Financial Rule of Iron: No autonomous compute without commercial backing. Verified deposit required.';
        }
      } else {
        // Zero-quote client service (internal or pro-bono)
        paymentState = 'FUNDED';
        isExecutionAllowed = availableBalanceCents >= 0 && (settledSpendCents + reservedSpendCents < budgetCapCents);
      }
    } else {
      // Internal Tool or Automation
      paymentState = 'FUNDED';
      isExecutionAllowed = settledSpendCents + reservedSpendCents < budgetCapCents;
    }

    // Materialize projection onto project record cache
    project.cashReceivedCents = cashReceivedCents;
    project.settledSpendCents = settledSpendCents;
    project.reservedSpendCents = reservedSpendCents;
    project.paymentState = paymentState;
    project.budgetCapCents = budgetCapCents;

    return {
      projectId,
      quotedPriceCents,
      budgetCapCents,
      cashReceivedCents,
      settledSpendCents,
      reservedSpendCents,
      availableBalanceCents,
      paymentState,
      depositRequiredCents,
      isExecutionAllowed,
      rejectionReason,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Atomically reserves spend before dispatching tasks or runner processes.
   * Eliminates the TOCTOU race condition.
   */
  public async reserveSpend(
    projectId: string,
    amountCents: number,
    reason: string,
    options?: { taskId?: string; agentId?: string; ttlSeconds?: number }
  ): Promise<SpendReservation> {
    return this.withProjectLock(projectId, async () => {
      const projection = await this.getFinancialProjection(projectId);
      const project = await this.projectDb.getProjectById(projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);

      // 1. Verify payment status
      if (!projection.isExecutionAllowed) {
        if (projection.paymentState === 'UNFUNDED' || projection.paymentState === 'PARTIALLY_FUNDED') {
          throw new FinancialGateError('PAYMENT_REQUIRED', projection.rejectionReason || 'Project requires verified deposit payment.');
        }
        if (projection.paymentState === 'PAYMENT_REVERSED') {
          throw new FinancialGateError('PAYMENT_REVERSED', projection.rejectionReason || 'Payment reversed. Execution revoked.');
        }
        if (projection.paymentState === 'BUDGET_EXHAUSTED') {
          throw new FinancialGateError('BUDGET_EXCEEDED', projection.rejectionReason || 'Budget cap exceeded.');
        }
        throw new FinancialGateError('PAYMENT_REQUIRED', projection.rejectionReason || 'Execution not permitted.');
      }

      // 2. Verify available balance
      if (projection.availableBalanceCents < amountCents) {
        throw new FinancialGateError(
          'INSUFFICIENT_FUNDS',
          `Insufficient available balance (${(projection.availableBalanceCents / 100).toFixed(2)}) for reservation of ${(amountCents / 100).toFixed(2)}.`
        );
      }

      // 3. Verify budget cap
      if (projection.settledSpendCents + projection.reservedSpendCents + amountCents > projection.budgetCapCents) {
        throw new FinancialGateError(
          'BUDGET_EXCEEDED',
          `Reservation of ${(amountCents / 100).toFixed(2)} exceeds project budget cap of ${(projection.budgetCapCents / 100).toFixed(2)}.`
        );
      }

      // 4. Create and persist reservation
      const reservationId = `res_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const ttl = options?.ttlSeconds || 600; // 10 minutes default
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();

      const reservationRecord: SpendReservationRecord = {
        id: reservationId,
        projectId,
        amountCents,
        status: 'ACTIVE',
        taskId: options?.taskId,
        agentId: options?.agentId,
        reason,
        createdAt: now.toISOString(),
        expiresAt
      };

      await this.projectDb.recordSpendReservation(reservationRecord);

      // Emit SPEND_RESERVED event
      await this.projectDb.saveEvent({
        id: crypto.randomUUID(),
        eventId: `evt_res_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        projectId,
        eventType: 'SPEND_RESERVED',
        actor: options?.agentId || 'system',
        payload: {
          reservationId,
          amountCents,
          reason,
          expiresAt
        },
        createdAt: now.toISOString()
      });

      // Update project revision
      project.reservedSpendCents = (project.reservedSpendCents || 0) + amountCents;
      await this.projectDb.saveProject(project);

      return {
        id: reservationRecord.id,
        projectId: reservationRecord.projectId,
        amountCents: reservationRecord.amountCents,
        status: reservationRecord.status,
        taskId: reservationRecord.taskId,
        agentId: reservationRecord.agentId,
        reason: reservationRecord.reason,
        createdAt: reservationRecord.createdAt,
        expiresAt: reservationRecord.expiresAt
      };
    });
  }

  /**
   * Settles actual cost against a reservation and releases any excess hold.
   */
  public async settleSpend(
    reservationId: string,
    actualCostCents: number,
    options?: { tokenCount?: number; agentId?: string; taskId?: string; missionId?: string; description?: string }
  ): Promise<void> {
    const reservation = await this.projectDb.getSpendReservationById(reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }
    if (reservation.status !== 'ACTIVE') {
      throw new Error(`Reservation ${reservationId} cannot be settled: status is ${reservation.status}`);
    }

    const projectId = reservation.projectId;
    await this.withProjectLock(projectId, async () => {
      const now = new Date().toISOString();

      // 1. Record settled compute spend in ledger
      const spendTxId = `tx_spend_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await this.projectDb.recordLedgerTransaction({
        id: spendTxId,
        projectId,
        transactionType: 'TOKEN_COST',
        currency: 'USD',
        amountCents: actualCostCents,
        tokenCount: options?.tokenCount || 0,
        unitCostCents: actualCostCents,
        agentId: options?.agentId || reservation.agentId,
        taskId: options?.taskId || reservation.taskId,
        missionId: options?.missionId,
        status: 'COMMITTED',
        description: options?.description || `Settled spend for ${reservation.reason}`,
        metadata: { reservationId, actualCostCents },
        createdAt: now
      });

      // 2. If hold was larger than actual cost, record release of excess
      const excessHold = Math.max(0, reservation.amountCents - actualCostCents);
      if (excessHold > 0) {
        const releaseTxId = `tx_rel_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        await this.projectDb.recordLedgerTransaction({
          id: releaseTxId,
          projectId,
          transactionType: 'RESERVATION_RELEASE',
          currency: 'USD',
          amountCents: excessHold,
          status: 'COMMITTED',
          description: `Released excess hold from reservation ${reservationId}`,
          metadata: { reservationId, excessHold },
          createdAt: now
        });
      }

      // 3. Mark reservation as SETTLED
      await this.projectDb.updateSpendReservation(reservationId, {
        status: 'SETTLED',
        settledAmountCents: actualCostCents,
        settledAt: now
      });

      // 4. Save audit event
      await this.projectDb.saveEvent({
        id: crypto.randomUUID(),
        eventId: `evt_settle_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        projectId,
        eventType: 'SPEND_SETTLED',
        actor: options?.agentId || 'system',
        payload: {
          reservationId,
          reservedAmountCents: reservation.amountCents,
          actualCostCents,
          excessHold
        },
        createdAt: now
      });

      // 5. Update project aggregates & revision
      const project = await this.projectDb.getProjectById(projectId);
      if (project) {
        project.settledSpendCents = (project.settledSpendCents || 0) + actualCostCents;
        project.buildCostCents = (project.buildCostCents || 0) + actualCostCents;
        project.totalTokensUsed = (project.totalTokensUsed || 0) + (options?.tokenCount || 0);
        project.reservedSpendCents = Math.max(0, (project.reservedSpendCents || 0) - reservation.amountCents);
        await this.projectDb.saveProject(project);
      }
    });
  }

  /**
   * Releases an active reservation without settling spend (e.g. task failed or cancelled).
   */
  public async releaseReservation(reservationId: string, reason = 'Execution cancelled or failed'): Promise<void> {
    const reservation = await this.projectDb.getSpendReservationById(reservationId);
    if (!reservation) return;
    if (reservation.status !== 'ACTIVE') return;

    const projectId = reservation.projectId;
    await this.withProjectLock(projectId, async () => {
      const now = new Date().toISOString();

      await this.projectDb.recordLedgerTransaction({
        id: `tx_rel_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        projectId,
        transactionType: 'RESERVATION_RELEASE',
        currency: 'USD',
        amountCents: reservation.amountCents,
        status: 'COMMITTED',
        description: `Reservation released: ${reason}`,
        metadata: { reservationId, reason },
        createdAt: now
      });

      await this.projectDb.updateSpendReservation(reservationId, {
        status: 'RELEASED',
        settledAt: now
      });

      await this.projectDb.saveEvent({
        id: crypto.randomUUID(),
        eventId: `evt_rel_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        projectId,
        eventType: 'SPEND_RELEASED',
        actor: 'system',
        payload: { reservationId, releasedAmountCents: reservation.amountCents, reason },
        createdAt: now
      });

      const project = await this.projectDb.getProjectById(projectId);
      if (project) {
        project.reservedSpendCents = Math.max(0, (project.reservedSpendCents || 0) - reservation.amountCents);
        await this.projectDb.saveProject(project);
      }
    });
  }

  /**
   * Scans and releases expired active reservations.
   * Invariant: An expired reservation must NEVER silently become settled spend.
   */
  public async expireStaleReservations(): Promise<number> {
    const active = await this.projectDb.getActiveReservations();
    const now = Date.now();
    let expiredCount = 0;

    for (const res of active) {
      if (res.status === 'ACTIVE' && new Date(res.expiresAt).getTime() <= now) {
        await this.projectDb.updateSpendReservation(res.id, {
          status: 'EXPIRED',
          settledAt: new Date().toISOString()
        });

        await this.projectDb.recordLedgerTransaction({
          id: `tx_exp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          projectId: res.projectId,
          transactionType: 'RESERVATION_RELEASE',
          currency: 'USD',
          amountCents: res.amountCents,
          status: 'COMMITTED',
          description: `Reservation hold expired and released safely without settlement: ${res.id}`,
          metadata: { reservationId: res.id },
          createdAt: new Date().toISOString()
        });

        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Transactional webhook ingestion:
   * - Cryptographically verifies webhook signature
   * - Enforces unique provider event constraint
   * - Credits project balance and updates ledger
   */
  public async reconcileWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
    secret?: string
  ): Promise<WebhookIngestResult> {
    const event = await this.paymentGateway.verifyWebhookSignature(rawBody, signature, secret || '');
    const providerEventId = event.id;
    const eventType = event.type;

    // 1. Transactional deduplication
    const recorded = await this.projectDb.recordProcessedProviderEvent({
      providerEventId,
      provider: this.paymentGateway.providerName,
      eventType,
      payload: event.data?.object,
      processedAt: new Date().toISOString()
    });

    if (recorded.duplicate) {
      return {
        received: true,
        duplicate: true,
        providerEventId,
        eventType
      };
    }

    // 2. Handle specific event types
    if (eventType === 'checkout.session.completed') {
      const session = event.data.object;
      const projectId = session.client_reference_id || session.metadata?.projectId;
      if (!projectId) {
        throw new Error('Cross-project isolation violation: checkout.session.completed missing client_reference_id/projectId');
      }

      const project = await this.projectDb.getProjectById(projectId);
      if (!project) {
        throw new Error(`Cross-project isolation violation: Project ${projectId} not found on disk`);
      }

      const amountCents = Number(session.amount_total) || 0;
      const txId = `tx_rev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      await this.projectDb.recordLedgerTransaction({
        id: txId,
        projectId,
        transactionType: 'REVENUE',
        currency: session.currency?.toUpperCase() || 'USD',
        amountCents,
        status: 'COMMITTED',
        description: `Stripe Checkout payment received for ${session.metadata?.commercialAction || 'deposit'}`,
        metadata: {
          providerEventId,
          checkoutSessionId: session.id,
          customerEmail: session.customer_email || session.customer_details?.email
        },
        createdAt: new Date().toISOString()
      });

      await this.projectDb.saveEvent({
        id: crypto.randomUUID(),
        eventId: `evt_pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        projectId,
        eventType: 'PAYMENT_RECEIVED',
        actor: 'stripe',
        payload: {
          providerEventId,
          checkoutSessionId: session.id,
          amountCents,
          currency: session.currency
        },
        createdAt: new Date().toISOString()
      });

      // Refresh projection and sync
      await this.getFinancialProjection(projectId);

      return {
        received: true,
        duplicate: false,
        providerEventId,
        eventType,
        projectId,
        transactionId: txId
      };
    }

    if (eventType === 'charge.refunded' || eventType === 'payment_intent.payment_failed') {
      const obj = event.data.object;
      const projectId = obj.metadata?.projectId;
      if (projectId) {
        const amountCents = Number(obj.amount_refunded || obj.amount) || 0;
        await this.handlePaymentReversal(
          providerEventId,
          projectId,
          amountCents,
          eventType === 'charge.refunded' ? 'REFUND' : 'PAYMENT_REVERSED',
          'Payment reversal or refund via webhook'
        );
      }
      return {
        received: true,
        duplicate: false,
        providerEventId,
        eventType,
        projectId
      };
    }

    return {
      received: true,
      duplicate: false,
      providerEventId,
      eventType
    };
  }

  /**
   * Processes a refund or payment reversal, immediately revoking execution authority
   * if the deficit warrants.
   */
  public async handlePaymentReversal(
    providerEventId: string,
    projectId: string,
    amountCents: number,
    type: 'REFUND' | 'PAYMENT_REVERSED',
    reason = 'Payment refunded or chargeback received'
  ): Promise<void> {
    const isDup = await this.projectDb.hasProcessedProviderEvent(providerEventId);
    if (isDup) return;

    await this.projectDb.recordProcessedProviderEvent({
      providerEventId,
      provider: this.paymentGateway.providerName,
      eventType: type === 'REFUND' ? 'charge.refunded' : 'payment_reversed',
      projectId,
      processedAt: new Date().toISOString()
    });

    const txId = `tx_rev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await this.projectDb.recordLedgerTransaction({
      id: txId,
      projectId,
      transactionType: type,
      currency: 'USD',
      amountCents,
      status: 'COMMITTED',
      description: `${type}: ${reason}`,
      metadata: { providerEventId, reason },
      createdAt: new Date().toISOString()
    });

    await this.projectDb.saveEvent({
      id: crypto.randomUUID(),
      eventId: `evt_rev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      projectId,
      eventType: type === 'REFUND' ? 'PAYMENT_REFUNDED' : 'PAYMENT_REVERSED',
      actor: 'stripe',
      payload: { providerEventId, amountCents, reason },
      createdAt: new Date().toISOString()
    });

    // Recompute projection to adjust status
    await this.getFinancialProjection(projectId);
  }

  /**
   * Governed human-only mutation of financial terms.
   * Agents attempting to call this are rejected fail-closed.
   */
  public async mutateFinancialTerms(req: FinancialMutationRequest): Promise<void> {
    // Human authority gate
    if (req.actorRole === 'AGENT') {
      throw new FinancialGateError(
        'UNAUTHORIZED',
        'Agent Financial Mutation Rejected: Agents cannot alter commercial budgets or pricing terms. Human authorization required.'
      );
    }

    const project = await this.projectDb.getProjectById(req.projectId);
    if (!project) {
      throw new Error(`Project not found: ${req.projectId}`);
    }

    if (req.expectedRevision !== undefined && project.revision !== req.expectedRevision) {
      throw new Error(
        `Concurrency Conflict: Expected revision ${req.expectedRevision}, but found ${project.revision}.`
      );
    }

    const oldValue = (project as any)[req.field];
    (project as any)[req.field] = req.newValue;

    await this.projectDb.saveEvent({
      id: crypto.randomUUID(),
      eventId: `evt_mut_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      projectId: req.projectId,
      eventType: 'FINANCIAL_TERMS_MUTATED',
      actor: req.actor,
      payload: {
        field: req.field,
        oldValue,
        newValue: req.newValue,
        reason: req.reason,
        actorRole: req.actorRole
      },
      createdAt: new Date().toISOString()
    });

    await this.projectDb.saveProject(project);
    await this.getFinancialProjection(req.projectId);
  }

  /**
   * Recomputes projection directly from raw append-only ledger and active reservations.
   * Used for reconciliation proofs and verification audits.
   */
  public async recomputeFinancialProjection(projectId: string): Promise<FinancialProjection> {
    return this.getFinancialProjection(projectId);
  }
}
