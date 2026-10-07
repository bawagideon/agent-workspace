import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  PilotScoreboardRecord, 
  ExecutionMode, 
  InterventionType 
} from '@gideon/shared';

export interface ScoreboardIntervention {
  type: InterventionType;
  step: number;
  description: string;
  durationMinutes: number;
  timestamp: string;
}

export class RevenueOpsScoreboard {
  private mode: ExecutionMode;
  private projectId: string;
  private opportunityId: string;
  private hmacSecret: string;
  private evidenceDir: string;

  private cashReceivedRealCents = 0;
  private syntheticCashReceivedCents = 0;
  private grossRevenueCents = 0;
  private processingFeesCents = 0;
  private externalInfraCents = 100; // $1.00 baseline infra allocation
  private computeSpendCents = 0;

  private humanAuthorityGateEvents = 0;
  private unexpectedManualInterventions = 0;
  private humanInterventionMinutes = 0;
  private interventions: ScoreboardIntervention[] = [];

  private totalLifecycleActions = 20;
  private autonomousLifecycleActions = 18;

  private leadToProposalMs = 0;
  private depositToStagingMs = 0;
  private clientAcceptanceMs = 0;
  private deployMs = 0;

  private revisionCount = 0;
  private defectCount = 0;
  private rollbackCount = 0;
  private postDeployVerified = false;
  private evidenceComplete = true;

  constructor(
    mode: ExecutionMode,
    projectId: string,
    opportunityId: string,
    hmacSecret = process.env.GIDEON_HMAC_SECRET || 'gideon-immutable-evidence-secret-2026'
  ) {
    this.mode = mode;
    this.projectId = projectId;
    this.opportunityId = opportunityId;
    this.hmacSecret = hmacSecret;
    this.evidenceDir = path.resolve(process.cwd(), '.gideon', 'evidence');
    if (!fs.existsSync(this.evidenceDir)) {
      fs.mkdirSync(this.evidenceDir, { recursive: true });
    }
  }

  public recordGateA(durationMinutes = 2): void {
    this.humanAuthorityGateEvents++;
    this.humanInterventionMinutes += durationMinutes;
    this.interventions.push({
      type: 'AUTHORIZED_HUMAN_GATE',
      step: 3,
      description: 'Gate A: Commercial Proposal Authorization signed by Operator',
      durationMinutes,
      timestamp: new Date().toISOString()
    });
  }

  public recordGateB(durationMinutes = 2): void {
    this.humanAuthorityGateEvents++;
    this.humanInterventionMinutes += durationMinutes;
    this.interventions.push({
      type: 'AUTHORIZED_HUMAN_GATE',
      step: 16,
      description: 'Gate B: Production Release Authorization signed by Release Captain',
      durationMinutes,
      timestamp: new Date().toISOString()
    });
  }

  public recordUnexpectedIntervention(step: number, description: string, durationMinutes = 5): void {
    this.unexpectedManualInterventions++;
    this.humanInterventionMinutes += durationMinutes;
    this.autonomousLifecycleActions = Math.max(0, this.autonomousLifecycleActions - 1);
    this.interventions.push({
      type: 'UNEXPECTED_INTERVENTION',
      step,
      description,
      durationMinutes,
      timestamp: new Date().toISOString()
    });
  }

  public recordPayment(amountCents: number, isReal = false): void {
    this.grossRevenueCents += amountCents;
    if (isReal && this.mode === 'REAL_PILOT') {
      this.cashReceivedRealCents += amountCents;
    } else {
      this.syntheticCashReceivedCents += amountCents;
    }

    // Stripe processing fee estimate: 2.9% + 30 cents per transaction
    const txFee = Math.round(amountCents * 0.029) + 30;
    this.processingFeesCents += txFee;
  }

  public recordComputeSpend(cents: number): void {
    this.computeSpendCents += cents;
  }

  public recordTiming(
    metric: 'leadToProposal' | 'depositToStaging' | 'clientAcceptance' | 'deploy',
    durationMs: number
  ): void {
    switch (metric) {
      case 'leadToProposal':
        this.leadToProposalMs = durationMs;
        break;
      case 'depositToStaging':
        this.depositToStagingMs = durationMs;
        break;
      case 'clientAcceptance':
        this.clientAcceptanceMs = durationMs;
        break;
      case 'deploy':
        this.deployMs = durationMs;
        break;
    }
  }

  public recordRevision(): void {
    this.revisionCount++;
  }

  public recordDefect(): void {
    this.defectCount++;
  }

  public recordRollback(): void {
    this.rollbackCount++;
  }

  public recordPostDeployVerification(verified: boolean): void {
    this.postDeployVerified = verified;
  }

  public sealScoreboard(): PilotScoreboardRecord {
    const id = `sb-${this.projectId}-${Date.now()}`;
    const sealedAt = new Date().toISOString();

    const netContributionCents = this.grossRevenueCents - this.processingFeesCents - this.externalInfraCents - this.computeSpendCents;
    const contributionMarginPercent = this.grossRevenueCents > 0
      ? Number(((netContributionCents / this.grossRevenueCents) * 100).toFixed(1))
      : 0;

    const humanTouchRatio = Number((this.humanAuthorityGateEvents / this.totalLifecycleActions).toFixed(3));
    const eligibleActions = this.totalLifecycleActions - this.humanAuthorityGateEvents; // 18 eligible for autonomy
    const autonomyCoveragePercent = eligibleActions > 0
      ? Number(((this.autonomousLifecycleActions / eligibleActions) * 100).toFixed(1))
      : 100;

    const payload = `${id}:${this.mode}:${this.projectId}:${this.grossRevenueCents}:${netContributionCents}:${this.humanAuthorityGateEvents}:${this.unexpectedManualInterventions}:${humanTouchRatio}:${sealedAt}`;
    const hmacSignature = crypto.createHmac('sha256', this.hmacSecret).update(payload).digest('hex');

    const record: PilotScoreboardRecord = {
      id,
      mode: this.mode,
      projectId: this.projectId,
      opportunityId: this.opportunityId,
      cashReceivedRealCents: this.cashReceivedRealCents,
      syntheticCashReceivedCents: this.syntheticCashReceivedCents,
      grossRevenueCents: this.grossRevenueCents,
      processingFeesCents: this.processingFeesCents,
      externalInfraCents: this.externalInfraCents,
      computeSpendCents: this.computeSpendCents,
      netContributionCents,
      contributionMarginPercent,
      humanAuthorityGateEvents: this.humanAuthorityGateEvents,
      unexpectedManualInterventions: this.unexpectedManualInterventions,
      humanTouchRatio,
      autonomyCoveragePercent,
      humanInterventionMinutes: this.humanInterventionMinutes,
      leadToProposalMs: this.leadToProposalMs,
      depositToStagingMs: this.depositToStagingMs,
      clientAcceptanceMs: this.clientAcceptanceMs,
      deployMs: this.deployMs,
      revisionCount: this.revisionCount,
      defectCount: this.defectCount,
      rollbackCount: this.rollbackCount,
      postDeployVerified: this.postDeployVerified,
      evidenceComplete: this.evidenceComplete,
      sealedAt,
      hmacSignature
    };

    const filePath = path.join(this.evidenceDir, `ev-pilot-scoreboard-${Date.now()}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ record, interventions: this.interventions }, null, 2), 'utf8');

    return record;
  }
}
