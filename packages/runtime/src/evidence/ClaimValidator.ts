import fs from 'fs';
import path from 'path';
import { EngineeringEvidence, EngineeringClaim, ClaimStatus } from '@gideon/shared';

export interface ClaimValidationResult {
  isValid: boolean;
  claimsCount: number;
  verifiedCount: number;
  blockedCount: number;
  staleCount: number;
  blockedReasons: string[];
  errors: string[];
}

export class ClaimValidator {
  /**
   * Known senior-credibility red flags that must be BLOCKED if encountered without proof.
   */
  private static FORBIDDEN_HALLUCINATIONS = [
    /scaled to (millions|billions)/i,
    /handles (thousands|millions|50,000|100,000) (req|requests)/i,
    /led a team of/i,
    /production traffic of [0-9]+/i,
    /zero latency/i,
    /used by [0-9]+ (clients|users|enterprises)/i,
    /revolutionary|groundbreaking|miraculous|military-grade|quantum|effortless 100x|millions of users/i
  ];

  private evidenceDir: string;

  constructor(customEvidenceDir?: string) {
    if (customEvidenceDir) {
      this.evidenceDir = customEvidenceDir;
    } else {
      let current = process.cwd();
      let candidate = path.resolve(current, '.gideon', 'evidence');
      while (!fs.existsSync(candidate) && path.dirname(current) !== current) {
        current = path.dirname(current);
        candidate = path.resolve(current, '.gideon', 'evidence');
      }
      this.evidenceDir = fs.existsSync(candidate) ? candidate : path.resolve(process.cwd(), '.gideon', 'evidence');
    }
  }

  /**
   * Validates all engineering claims associated with a project evidence projection.
   * Checks evidence artifact existence, claim status, and metric consistency.
   */
  public validateProjectClaims(evidence: EngineeringEvidence): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const claim of evidence.claims) {
      // 1. Check if evidence file exists
      const ref = claim.evidencePath || claim.evidenceRef;
      if (ref) {
        const fileByName = path.join(this.evidenceDir, ref.endsWith('.json') ? ref : `${ref}.json`);
        const fileExists = fs.existsSync(fileByName) || (fs.existsSync(this.evidenceDir) && fs.readdirSync(this.evidenceDir).some(f => f.includes(ref)));
        if (!fileExists) {
          claim.status = 'BLOCKED';
          claim.contradictionReason = `Evidence '${ref}' does not exist on disk.`;
          errors.push(`EVIDENCE_NOT_FOUND: Evidence artifact '${ref}' not found in ${this.evidenceDir}`);
        }
      }

      // 2. Check for metric inflation in statement (e.g. "50 passing integration tests")
      const testMatch = claim.statement.match(/(\d+)\s*(passing\s+)?(automated\s+)?(unit|integration\s+)?(test|assertion)/i);
      if (testMatch) {
        const claimedCount = parseInt(testMatch[1], 10);
        if (claimedCount > evidence.verification.testsPassed) {
          claim.status = 'CONTRADICTED';
          claim.contradictionReason = `Statement claims ${claimedCount} passing tests, but evidence proves only ${evidence.verification.testsPassed}.`;
          errors.push(`METRIC_INFLATION: Statement claims ${claimedCount} passing tests, but verified evidence records ${evidence.verification.testsPassed}.`);
        }
      }

      // 3. Status checks
      if (claim.status === 'STALE') {
        errors.push(`CLAIM_STALE: Claim '${claim.id}' is stale and needs re-verification.`);
      } else if (claim.status === 'CONTRADICTED') {
        errors.push(`CLAIM_CONTRADICTED: Claim '${claim.id}' is contradicted: ${claim.contradictionReason || 'Metrics mismatch'}.`);
      } else if (claim.status === 'BLOCKED') {
        errors.push(`CLAIM_BLOCKED: Claim '${claim.id}' is blocked: ${claim.contradictionReason || 'Failed verification'}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates text content (e.g. LinkedIn post, Case Study, README) against claims and evidence.
   */
  public validateContent(text: string, claims: EngineeringClaim[], evidence: EngineeringEvidence): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Scan for forbidden unverified hype words
    for (const pattern of ClaimValidator.FORBIDDEN_HALLUCINATIONS) {
      if (pattern.test(text)) {
        errors.push(`FORBIDDEN_HYPE_WORDS: Detected forbidden buzzword/hype pattern "${pattern.source}".`);
      }
    }

    // 2. Check test count claims in text
    const testMatch = text.match(/(\d+)\s*(passing\s+)?(automated\s+)?(unit|integration\s+)?(test|assertion)/i);
    if (testMatch) {
      const claimedCount = parseInt(testMatch[1], 10);
      if (claimedCount > evidence.verification.testsPassed) {
        errors.push(`METRIC_INFLATION: Content claims ${claimedCount} passing tests, but verified evidence records ${evidence.verification.testsPassed}.`);
      }
    }

    // 3. Validate claims
    const claimRes = this.validateProjectClaims(evidence);
    if (!claimRes.isValid) {
      errors.push(...claimRes.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Backward-compatible static validator.
   */
  public static validateText(text: string, evidence: EngineeringEvidence): ClaimValidationResult {
    const validator = new ClaimValidator();
    const contentRes = validator.validateContent(text, evidence.claims, evidence);

    let verifiedCount = 0;
    let blockedCount = 0;
    let staleCount = 0;

    for (const claim of evidence.claims) {
      if (claim.status === 'VERIFIED') verifiedCount++;
      else if (claim.status === 'STALE') staleCount++;
      else blockedCount++;
    }

    return {
      isValid: contentRes.isValid,
      claimsCount: evidence.claims.length,
      verifiedCount,
      blockedCount,
      staleCount,
      blockedReasons: contentRes.errors,
      errors: contentRes.errors
    };
  }

  /**
   * Evaluates drift between current physical code and sealed evidence.
   */
  public static detectDrift(evidence: EngineeringEvidence, currentTestCount: number): ClaimStatus {
    if (currentTestCount < evidence.verification.testsPassed) {
      return 'CONTRADICTED';
    }
    const daysSinceEvaluation = (Date.now() - new Date(evidence.verification.evaluatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEvaluation > 90) {
      return 'STALE';
    }
    return 'VERIFIED';
  }
}
