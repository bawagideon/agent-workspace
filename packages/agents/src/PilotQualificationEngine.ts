import { OpportunityRecord, PilotQualificationContract, AcceptanceContract } from '@gideon/shared';

export interface PilotQualificationOptions {
  expectedPriceCents?: number;
  expectedDepositCents?: number;
  estimatedComputeCostCents?: number;
  maximumComputeBudgetCents?: number;
  expectedHumanMinutes?: number;
  scopeBoundary?: string[];
  acceptanceCriteria?: Partial<AcceptanceContract>;
  deploymentTarget?: string;
  rollbackPlan?: string;
}

export class PilotQualificationEngine {
  /**
   * Qualifies an opportunity for autonomous execution against Phase 6 commercial standards.
   */
  public qualify(
    opportunity: OpportunityRecord,
    options: PilotQualificationOptions = {}
  ): PilotQualificationContract {
    const expectedPriceCents = options.expectedPriceCents ?? opportunity.estimatedValueCents ?? 50000;
    const expectedDepositCents = options.expectedDepositCents ?? Math.round(expectedPriceCents * 0.5);
    const estimatedComputeCostCents = options.estimatedComputeCostCents ?? 35; // $0.35
    const maximumComputeBudgetCents = options.maximumComputeBudgetCents ?? 300; // $3.00
    const expectedHumanMinutes = options.expectedHumanMinutes ?? 10;
    const deploymentTarget = options.deploymentTarget ?? 'docker-node24-isolated';
    const rollbackPlan = options.rollbackPlan ?? 'instant-container-stop-and-restore';

    const scopeBoundary = options.scopeBoundary ?? [
      'Standalone Node/TypeScript HTTP microservice',
      'Stripe webhook ingestion with cryptographic HMAC-SHA256 signature verification',
      'Event routing to Discord and Slack notification webhooks',
      'In-memory / persistent idempotency table preventing duplicate alerts',
      'Public /health endpoint and internal-only protected /metrics endpoint',
      'Zero external network egress during staging build/test runs',
      'Zero production credentials inside staging runner environment'
    ];

    const acceptanceCriteria: AcceptanceContract = {
      functional: options.acceptanceCriteria?.functional ?? [
        'POST /webhook/stripe processes valid Stripe webhook payload with status 200',
        'Signed webhook events dispatch formatted embeds to configured alert endpoints',
        'Malformed JSON or invalid signature requests return 400 Bad Request',
        'GET /health returns minimal liveness JSON { status: "ok" }'
      ],
      security: options.acceptanceCriteria?.security ?? [
        'Stripe webhook signature validation strictly enforced with HMAC-SHA256',
        'Timestamp replay window enforced (<300s tolerance)',
        'GET /metrics requires x-internal-auth header (rejects unauthenticated 401)',
        'Zero API keys, secrets, or internal filepaths leaked in HTTP responses or runner logs'
      ],
      reliability: options.acceptanceCriteria?.reliability ?? [
        'Idempotent event processing: Duplicate delivery returns { received: true, duplicate: true } with 0 re-sends',
        'Process crash recovery and uncaught exception safety without process crash',
        'Timeout protection on outgoing notifications'
      ],
      delivery: options.acceptanceCriteria?.delivery ?? [
        'Production TypeScript build compiles cleanly (exit code 0)',
        'Unit test suite passes 100% in subprocess runner',
        'Build Lab runner leases port from pool (4100-4199) with sanitized environment',
        'Client portal staging preview verified with frame-ancestors self CSP'
      ]
    };

    // Qualification Rules
    const reasons: string[] = [];

    if (expectedPriceCents < 25000) {
      reasons.push(`Price ($${(expectedPriceCents / 100).toFixed(2)}) below minimum viable commercial threshold of $250.00.`);
    }

    if (expectedDepositCents < Math.round(expectedPriceCents * 0.4)) {
      reasons.push(`Deposit ($${(expectedDepositCents / 100).toFixed(2)}) is less than 40% of quoted price.`);
    }

    if (maximumComputeBudgetCents > 500) {
      reasons.push(`Maximum compute budget ($${(maximumComputeBudgetCents / 100).toFixed(2)}) exceeds $5.00 pilot ceiling.`);
    }

    if (expectedHumanMinutes > 30) {
      reasons.push(`Expected human time (${expectedHumanMinutes}m) exceeds 30m autonomy envelope.`);
    }

    // Contribution Margin Check:
    // Estimated Stripe fee: 2.9% + 0.30 per tx (x2 tx = deposit + final)
    const estimatedStripeFeeCents = Math.round(expectedPriceCents * 0.029) + 60;
    const estimatedInfraCents = 100; // $1.00
    const netContributionCents = expectedPriceCents - estimatedStripeFeeCents - estimatedInfraCents - estimatedComputeCostCents;
    const contributionMarginPercent = (netContributionCents / expectedPriceCents) * 100;

    if (contributionMarginPercent < 80) {
      reasons.push(`Estimated contribution margin (${contributionMarginPercent.toFixed(1)}%) is below 80% threshold.`);
    }

    // Verify all 4 acceptance pillars are non-empty
    if (!acceptanceCriteria.functional.length || !acceptanceCriteria.security.length || 
        !acceptanceCriteria.reliability.length || !acceptanceCriteria.delivery.length) {
      reasons.push('Acceptance criteria must include non-empty functional, security, reliability, and delivery pillars.');
    }

    const isEligible = reasons.length === 0;

    return {
      opportunityId: opportunity.id,
      expectedPriceCents,
      expectedDepositCents,
      estimatedComputeCostCents,
      maximumComputeBudgetCents,
      expectedHumanMinutes,
      scopeBoundary,
      acceptanceCriteria,
      deploymentTarget,
      rollbackPlan,
      economicVerdict: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
      reason: isEligible 
        ? `Qualified: Quoted $${(expectedPriceCents / 100).toFixed(2)} with ${contributionMarginPercent.toFixed(1)}% contribution margin, $${(maximumComputeBudgetCents / 100).toFixed(2)} spend cap, and complete 4-pillar contract.`
        : `Disqualified: ${reasons.join(' ')}`,
      qualifiedAt: new Date().toISOString()
    };
  }
}
