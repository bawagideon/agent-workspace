export interface RawClientFeedback {
  feedbackText?: string;
  areaOfConcern?: string;
  requestedChanges?: string;
}

export interface SanitizedClientFeedbackData {
  untrusted: true;
  role: 'external_client_data';
  feedbackText: string;
  areaOfConcern: string;
  requestedChanges: string;
  delimitedRepresentation: string;
  rawCharacterCount: number;
  timestamp: string;
}

export class FeedbackValidationError extends Error {
  public readonly code: 'FEEDBACK_TOO_LONG' | 'EMPTY_FEEDBACK' | 'INVALID_INPUT';

  constructor(code: 'FEEDBACK_TOO_LONG' | 'EMPTY_FEEDBACK' | 'INVALID_INPUT', message: string) {
    super(message);
    this.name = 'FeedbackValidationError';
    this.code = code;
  }
}

export class UntrustedFeedbackSanitizer {
  public static readonly MAX_FEEDBACK_CHARS = 5000;
  public static readonly MAX_AREA_CHARS = 100;
  public static readonly MAX_CHANGES_CHARS = 5000;

  /**
   * Sanitizes untrusted client feedback into passive external data.
   * Invariant: Client feedback is DATA, never instructions, regardless of its textual content.
   */
  public static sanitize(input: RawClientFeedback): SanitizedClientFeedbackData {
    if (!input) {
      throw new FeedbackValidationError('EMPTY_FEEDBACK', 'Client feedback payload cannot be empty.');
    }

    const rawText = (input.feedbackText || '').trim();
    const rawArea = (input.areaOfConcern || '').trim();
    const rawChanges = (input.requestedChanges || '').trim();

    if (!rawText && !rawChanges) {
      throw new FeedbackValidationError('EMPTY_FEEDBACK', 'Feedback must include either feedbackText or requestedChanges.');
    }

    if (rawText.length > this.MAX_FEEDBACK_CHARS) {
      throw new FeedbackValidationError('FEEDBACK_TOO_LONG', `Feedback text exceeds maximum length of ${this.MAX_FEEDBACK_CHARS} characters (received ${rawText.length}).`);
    }

    if (rawArea.length > this.MAX_AREA_CHARS) {
      throw new FeedbackValidationError('FEEDBACK_TOO_LONG', `Area of concern exceeds maximum length of ${this.MAX_AREA_CHARS} characters (received ${rawArea.length}).`);
    }

    if (rawChanges.length > this.MAX_CHANGES_CHARS) {
      throw new FeedbackValidationError('FEEDBACK_TOO_LONG', `Requested changes exceeds maximum length of ${this.MAX_CHANGES_CHARS} characters (received ${rawChanges.length}).`);
    }

    // Strip dangerous HTML/script elements
    const cleanText = this.stripHtmlAndControl(rawText);
    const cleanArea = this.stripHtmlAndControl(rawArea);
    const cleanChanges = this.stripHtmlAndControl(rawChanges);

    // Hardened visual & representation fences
    const delimitedRepresentation = [
      '<<<UNTRUSTED_CLIENT_FEEDBACK>>>',
      `AREA_OF_CONCERN: ${cleanArea || 'General'}`,
      'FEEDBACK_CONTENT:',
      cleanText || '(None)',
      'REQUESTED_CHANGES:',
      cleanChanges || '(None)',
      '<<<END_UNTRUSTED_CLIENT_FEEDBACK>>>'
    ].join('\n');

    return {
      untrusted: true,
      role: 'external_client_data',
      feedbackText: cleanText,
      areaOfConcern: cleanArea || 'General',
      requestedChanges: cleanChanges,
      delimitedRepresentation,
      rawCharacterCount: rawText.length + rawArea.length + rawChanges.length,
      timestamp: new Date().toISOString()
    };
  }

  private static stripHtmlAndControl(text: string): string {
    return text
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
      .replace(/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '')
      .replace(/<\s*embed[^>]*>[\s\S]*?<\s*\/\s*embed\s*>/gi, '')
      .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
      .trim();
  }
}
