import { 
  OpportunityRecord, 
  OpportunityRecommendation, 
  RejectionReason 
} from '@gideon/shared';

export interface ScoreBreakdown {
  expectedValueCents: number;
  expectedHumanHourReturnCents: number;
  probabilityOfWinning: number;
  riskAdjustedMarginPercent: number;
  estimatedAICostCents: number;
  estimatedInfraCostCents: number;
  estimatedHumanMinutes: number;
  technicalDifficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  customerValue: number;
  repeatPotential: number;
  confidence: number;
  recommendation: OpportunityRecommendation;
  rejectionReason?: RejectionReason;
  unknowns: string[];
}

export class OpportunityScorer {
  /**
   * Deterministically evaluates an opportunity across multi-dimensional criteria.
   * Zero LLM hallucination risk: pure mathematical and rule-based evaluation.
   */
  public scoreOpportunity(opp: OpportunityRecord): ScoreBreakdown {
    const revenue = opp.estimatedValueCents || 25000;
    const recurring = opp.estimatedRecurringRevenueCents || 0;
    const title = opp.title.toLowerCase();
    const desc = (opp.description || '').toLowerCase();
    const skills = opp.targetSkills.map((s) => s.toLowerCase());

    // 1. Technical Difficulty Assessment
    let technicalDifficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    if (title.includes('fix') || title.includes('script') || title.includes('landing') || skills.includes('css')) {
      technicalDifficulty = 'LOW';
    } else if (title.includes('architecture') || title.includes('compiler') || title.includes('kernel') || desc.includes('reverse engineer')) {
      technicalDifficulty = 'CRITICAL';
    } else if (title.includes('api') || title.includes('dashboard') || title.includes('bot') || title.includes('integration')) {
      technicalDifficulty = 'MEDIUM';
    } else if (title.includes('cve') || title.includes('security') || title.includes('distributed') || title.includes('blockchain')) {
      technicalDifficulty = 'HIGH';
    }

    // 2. Competition Assessment
    let competition: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (opp.source === 'UPWORK' && (title.includes('wordpress') || title.includes('logo') || title.includes('data entry'))) {
      competition = 'HIGH';
    } else if (opp.source === 'HUMAN' || opp.source === 'INTERNAL' || title.includes('micro-saas')) {
      competition = 'LOW';
    }

    // 3. Repeat & Recurring Potential
    let repeatPotential = 30;
    if (recurring > 0 || opp.type === 'PRODUCT' || opp.type === 'SAAS' || title.includes('micro-saas')) {
      repeatPotential = 90;
    } else if (opp.type === 'TEMPLATE' || opp.type === 'API_SERVICE' || title.includes('automation')) {
      repeatPotential = 70;
    } else if (opp.type === 'BOUNTY' || title.includes('fix')) {
      repeatPotential = 20;
    }

    // 4. Customer Value Score (0-100)
    let customerValue = 60;
    if (revenue >= 100000) customerValue = 90;
    else if (revenue >= 50000) customerValue = 80;
    else if (revenue < 10000) customerValue = 40;

    // 5. Cost Estimation
    // AI inference cost: ~$0.50 - $2.00 in tokens
    const estimatedAICostCents = technicalDifficulty === 'LOW' ? 25 : technicalDifficulty === 'MEDIUM' ? 75 : 200;
    const estimatedInfraCostCents = 50; // Sandbox compute & tools
    const totalAICostCents = estimatedAICostCents + estimatedInfraCostCents;

    // Human time needed for review / steering
    const estimatedHumanMinutes = technicalDifficulty === 'LOW' ? 10 : technicalDifficulty === 'MEDIUM' ? 25 : 60;

    // 6. Probability of Winning / Success Calculation
    let probabilityOfWinning = 0.65;
    if (competition === 'HIGH') probabilityOfWinning -= 0.25;
    if (competition === 'LOW') probabilityOfWinning += 0.20;
    if (technicalDifficulty === 'CRITICAL') probabilityOfWinning -= 0.30;
    if (technicalDifficulty === 'LOW') probabilityOfWinning += 0.15;
    if (opp.source === 'HUMAN') probabilityOfWinning += 0.10;

    // Clamp probability between 0.10 and 0.95
    probabilityOfWinning = Math.max(0.10, Math.min(0.95, probabilityOfWinning));

    // 7. Expected Value & Margin Calculus
    // EV = (Probability * Revenue) - Total AI Cost
    const expectedValueCents = Math.round(probabilityOfWinning * revenue - totalAICostCents);
    const riskAdjustedMarginPercent = Math.round(((revenue - totalAICostCents) / revenue) * 100);

    // Human-Hour Return = Expected Value / (Human Hours)
    const humanHours = Math.max(0.1, estimatedHumanMinutes / 60);
    const expectedHumanHourReturnCents = Math.round(expectedValueCents / humanHours);

    // 8. Confidence Assessment
    let confidence = 0.50;
    if (opp.evidence && opp.evidence.length > 0) {
      confidence += opp.evidence.length * 0.10;
    }
    if (opp.source === 'INTERNAL' && opp.metadata?.clusteredFromOppIds) {
      confidence = 0.80; // High confidence for multi-signal clusters
    }
    confidence = Math.min(0.95, Math.max(0.20, confidence));

    // 9. Unknowns Formulated
    const unknowns: string[] = [];
    if (competition === 'HIGH') unknowns.push('Price undercutting & saturation risks from existing vendors');
    if (confidence < 0.60) unknowns.push('Actual buyer willingness to pay at estimated pricing tier');
    if (technicalDifficulty === 'HIGH' || technicalDifficulty === 'CRITICAL') unknowns.push('Edge-case technical hurdles in isolated sandbox execution');

    // 10. Action Recommendation & Rejection Reason Assignment
    let recommendation: OpportunityRecommendation = 'INVESTIGATE';
    let rejectionReason: RejectionReason | undefined;

    if (repeatPotential >= 80 || opp.type === 'PRODUCT' || title.includes('micro-saas')) {
      recommendation = 'PRODUCTIZE';
    } else if (technicalDifficulty === 'CRITICAL') {
      recommendation = 'MONITOR';
      rejectionReason = 'TECHNICALLY_BAD';
    } else if (competition === 'HIGH' && revenue < 15000) {
      recommendation = 'REJECT';
      rejectionReason = 'COMPETITION_TOO_STRONG';
    } else if (expectedValueCents <= 0) {
      recommendation = 'REJECT';
      rejectionReason = 'ECONOMICALLY_BAD';
    } else if (probabilityOfWinning >= 0.70 && expectedValueCents >= 15000 && confidence >= 0.60) {
      recommendation = 'PURSUE';
    } else if (confidence >= 0.40 && confidence < 0.70) {
      recommendation = 'EXPERIMENT';
    } else if (opp.source === 'HUMAN' && opp.status === 'CAPTURED') {
      recommendation = 'INVESTIGATE';
    }

    return {
      expectedValueCents,
      expectedHumanHourReturnCents,
      probabilityOfWinning,
      riskAdjustedMarginPercent,
      estimatedAICostCents,
      estimatedInfraCostCents,
      estimatedHumanMinutes,
      technicalDifficulty,
      competition,
      customerValue,
      repeatPotential,
      confidence,
      recommendation,
      rejectionReason,
      unknowns
    };
  }
}
