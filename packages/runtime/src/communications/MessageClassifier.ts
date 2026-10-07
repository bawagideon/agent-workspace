import { MessageClassification } from '@gideon/shared';

export interface ClassificationResult {
  category: MessageClassification;
  classification: MessageClassification;
  reason: string;
  rationale: string;
  confidence: number;
}

export class MessageClassifier {
  public classify(sanitizedText: string): ClassificationResult {
    return MessageClassifier.classify(sanitizedText);
  }

  public static classify(sanitizedText: string): ClassificationResult {
    const lower = sanitizedText.toLowerCase();

    // 1. Hostile Prompt Injection Defense Check
    const injectionPatterns = [
      /ignore (all )?previous instructions/i,
      /you are now in/i,
      /change (the )?price to/i,
      /mark (the )?project accepted/i,
      /reveal (internal|secret|token|key|password)/i,
      /bypass (policy|rule|approval)/i,
      /critical_system_override/i,
      /root_admin/i
    ];

    if (injectionPatterns.some(p => p.test(sanitizedText))) {
      return {
        category: 'UNTRUSTED_EXTERNAL',
        classification: 'UNTRUSTED_EXTERNAL',
        reason: 'Hostile prompt injection signature detected. Classified as untrusted passive data.',
        rationale: 'Hostile prompt injection signature detected. Classified as untrusted passive data.',
        confidence: 0.99
      };
    }

    // 2. Acceptance Intent
    if (
      lower.includes('accept the deliverable') ||
      lower.includes('accept the milestone') ||
      lower.includes('formally accept') ||
      lower.includes('ready to deploy') ||
      lower.includes('ready to move forward')
    ) {
      return {
        category: 'ACCEPTANCE',
        classification: 'ACCEPTANCE',
        reason: 'Client expressed explicit intent to accept.',
        rationale: 'Client expressed explicit intent to accept.',
        confidence: 0.92
      };
    }

    // 3. Rework Intent (Bugs, errors, defects, misalignments)
    if (
      lower.includes('misaligned') ||
      lower.includes('fails with error') ||
      lower.includes('broken') ||
      lower.includes('defect') ||
      lower.includes('fix the bug') ||
      lower.includes('styling issue')
    ) {
      return {
        category: 'REWORK' as any,
        classification: 'OBJECTION',
        reason: 'Client reported defect or bug requiring rework within scope.',
        rationale: 'Client reported defect or bug requiring rework within scope.',
        confidence: 0.90
      };
    }

    // 4. Change Request Intent
    if (
      lower.includes('can you also') ||
      lower.includes('can we add') ||
      lower.includes('like to add') ||
      lower.includes('need another feature') ||
      lower.includes('integrate with') ||
      lower.includes('slack') ||
      lower.includes('oauth') ||
      lower.includes('change the scope')
    ) {
      return {
        category: 'CHANGE_REQUEST',
        classification: 'CHANGE_REQUEST',
        reason: 'Client requested capabilities or alterations to the agreed scope.',
        rationale: 'Client requested capabilities or alterations to the agreed scope.',
        confidence: 0.92
      };
    }

    // 5. Question
    if (
      lower.includes('how does') ||
      lower.includes('what happens if') ||
      lower.includes('does it support') ||
      lower.includes('how do you') ||
      lower.includes('?')
    ) {
      return {
        category: 'QUESTION',
        classification: 'QUESTION',
        reason: 'Client asking an operational or technical question.',
        rationale: 'Client asking an operational or technical question.',
        confidence: 0.88
      };
    }

    // Default
    return {
      category: 'INFORMATIONAL',
      classification: 'INFORMATIONAL',
      reason: 'General feedback, acknowledgment, or conversational message.',
      rationale: 'General feedback, acknowledgment, or conversational message.',
      confidence: 0.75
    };
  }
}
