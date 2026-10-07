import { AcceptanceConfidence } from '@gideon/shared';

export interface AcceptanceEvaluationResult {
  confidence: 'EXPLICIT' | 'CONDITIONAL' | 'AMBIGUOUS' | 'REJECTION';
  isFormalAcceptance: boolean;
  canAdvanceToAccepted: boolean;
  reason: string;
  rationale: string;
  score: number;
}

export class AcceptanceConfidenceEvaluator {
  public evaluate(sanitizedText: string, isVerifiedSender: boolean = true): AcceptanceEvaluationResult {
    return AcceptanceConfidenceEvaluator.evaluate(sanitizedText, isVerifiedSender);
  }

  public static evaluate(sanitizedText: string, isVerifiedSender: boolean = true): AcceptanceEvaluationResult {
    if (!isVerifiedSender) {
      return {
        confidence: 'REJECTION',
        isFormalAcceptance: false,
        canAdvanceToAccepted: false,
        reason: 'Sender is unverified. Unverified contacts strictly cannot establish acceptance.',
        rationale: 'Sender is unverified. Unverified contacts strictly cannot establish acceptance.',
        score: 0.0
      };
    }

    // Prompt Injection Check
    if (/override|ignore all|root_admin/i.test(sanitizedText)) {
      return {
        confidence: 'AMBIGUOUS',
        isFormalAcceptance: false,
        canAdvanceToAccepted: false,
        reason: 'Prompt injection signature detected. State mutation blocked.',
        rationale: 'Prompt injection signature detected. State mutation blocked.',
        score: 0.0
      };
    }

    const lower = sanitizedText.toLowerCase();

    // 1. Explicit Rejection
    if (lower.includes('reject') || lower.includes('not accept') || lower.includes('does not work at all')) {
      return {
        confidence: 'REJECTION',
        isFormalAcceptance: false,
        canAdvanceToAccepted: false,
        reason: 'Client explicitly rejected the deliverable.',
        rationale: 'Client explicitly rejected the deliverable.',
        score: 0.0
      };
    }

    // 2. Conditional Acceptance
    if (
      lower.includes('provided that') ||
      lower.includes('on the condition') ||
      lower.includes('accept if') ||
      lower.includes('fix the two pending')
    ) {
      return {
        confidence: 'CONDITIONAL',
        isFormalAcceptance: false,
        canAdvanceToAccepted: false,
        reason: 'Acceptance is conditional upon additional remediation.',
        rationale: 'Acceptance is conditional upon additional remediation.',
        score: 0.5
      };
    }

    // 3. Ambiguous Praise (Dangerous False Positives - Invariant 5)
    const vaguePraisePatterns = [
      /looks great/i,
      /looks good/i,
      /awesome job/i,
      /nice work/i,
      /pretty good/i,
      /love it/i,
      /cool/i,
      /thanks/i
    ];

    if (vaguePraisePatterns.some(p => p.test(sanitizedText)) && !lower.includes('unconditionally') && !lower.includes('formally accept')) {
      return {
        confidence: 'AMBIGUOUS',
        isFormalAcceptance: false,
        canAdvanceToAccepted: false,
        reason: 'Vague praise detected. Ambiguous praise cannot advance commercial state to CLIENT_ACCEPTED.',
        rationale: 'Vague praise detected. Ambiguous praise cannot advance commercial state to CLIENT_ACCEPTED.',
        score: 0.3
      };
    }

    // 4. Explicit Formal Acceptance
    const formalPatterns = [
      /accept the deliverable unconditionally/i,
      /formally accept/i,
      /i accept (the )?milestone/i,
      /acceptance criteria (are )?satisfied/i
    ];

    if (formalPatterns.some(p => p.test(sanitizedText))) {
      return {
        confidence: 'EXPLICIT',
        isFormalAcceptance: true,
        canAdvanceToAccepted: true,
        reason: 'Client provided explicit, unconditional acceptance.',
        rationale: 'Client provided explicit, unconditional acceptance.',
        score: 1.0
      };
    }

    return {
      confidence: 'AMBIGUOUS',
      isFormalAcceptance: false,
      canAdvanceToAccepted: false,
      reason: 'No formal acceptance detected.',
      rationale: 'No formal acceptance detected.',
      score: 0.1
    };
  }
}
