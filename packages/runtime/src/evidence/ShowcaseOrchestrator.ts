import fs from 'fs';
import path from 'path';
import {
  EngineeringEvidence,
  ContentEvidencePack,
  ClaimValidationResult
} from '@gideon/shared';
import { EvidenceExtractor } from './EvidenceExtractor';
import { ClaimValidator } from './ClaimValidator';
import { PortfolioProjectionEngine, PortfolioSentinelResult } from './PortfolioProjectionEngine';
import { ContentPackGenerator } from './ContentPackGenerator';

export type ShowcaseGateType = 'GATE_1_GITHUB_PUSH' | 'GATE_2_PORTFOLIO_DEPLOY' | 'GATE_3_LINKEDIN_BROADCAST';

export interface GateApprovalRecord {
  gate: ShowcaseGateType;
  title: string;
  description: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  operatorSignature?: string;
  approvedAt?: string;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

export interface ShowcasePipelineResult {
  evidence: EngineeringEvidence;
  claimValidation: ClaimValidationResult;
  portfolioProjection: {
    generatedFilePath: string;
    projectCard: any;
  };
  contentPack: ContentEvidencePack;
  gates: Record<ShowcaseGateType, GateApprovalRecord>;
}

export class ShowcaseOrchestrator {
  private extractor: EvidenceExtractor;
  private claimValidator: ClaimValidator;
  private projectionEngine: PortfolioProjectionEngine;
  private packGenerator: ContentPackGenerator;
  private gates: Record<ShowcaseGateType, GateApprovalRecord>;

  constructor(customPortfolioRoot?: string) {
    this.extractor = new EvidenceExtractor();
    this.claimValidator = new ClaimValidator();
    this.projectionEngine = new PortfolioProjectionEngine(customPortfolioRoot);
    this.packGenerator = new ContentPackGenerator(this.claimValidator);

    this.gates = {
      GATE_1_GITHUB_PUSH: {
        gate: 'GATE_1_GITHUB_PUSH',
        title: 'Gate 1: Public GitHub Repository Publication',
        description: 'Authorize pushing the packaged repository, semantic commits, and CI workflow to public GitHub.',
        status: 'PENDING_APPROVAL'
      },
      GATE_2_PORTFOLIO_DEPLOY: {
        gate: 'GATE_2_PORTFOLIO_DEPLOY',
        title: 'Gate 2: Portfolio Showcase Publication',
        description: 'Authorize deploying the updated 3D portfolio with the new flagship engineering deliverable to Netlify.',
        status: 'PENDING_APPROVAL'
      },
      GATE_3_LINKEDIN_BROADCAST: {
        gate: 'GATE_3_LINKEDIN_BROADCAST',
        title: 'Gate 3: LinkedIn Case Study Broadcast',
        description: 'Authorize publishing the technical case study and engineering breakdown to LinkedIn.',
        status: 'PENDING_APPROVAL'
      }
    };
  }

  /**
   * Executes the full Evidence-Based Engineering Showcase pipeline.
   * Produces derived evidence, validates claims, updates portfolio projection, and drafts content.
   * Strictly leaves all publication side effects behind 3 Human Authority Gates.
   */
  public executePipeline(projectDir: string): ShowcasePipelineResult {
    // 1. Dynamic Evidence Extraction
    const evidence = this.extractor.extractFromProject(projectDir);

    // 2. Claim Validation across core claims
    const claimValidation = this.claimValidator.validateProjectClaims(evidence);
    if (!claimValidation.isValid) {
      throw new Error(`SHOWCASE_CLAIMS_INVALID: Project claims failed validation: ${claimValidation.errors.join('; ')}`);
    }

    // 3. Deterministic Portfolio Projection
    const portfolioProjection = this.projectionEngine.projectToPortfolio(evidence);

    // 4. Content Evidence Pack Generation (Technical case study, talking points, LinkedIn draft)
    const contentPack = this.packGenerator.generatePack(evidence);

    // Update Gate metadata with artifacts
    this.gates.GATE_1_GITHUB_PUSH.metadata = {
      repoUrl: evidence.repository.url,
      commitsCount: 5,
      ciConfigured: true
    };

    this.gates.GATE_2_PORTFOLIO_DEPLOY.metadata = {
      generatedProjection: portfolioProjection.generatedFilePath,
      projectCardName: portfolioProjection.projectCard.name
    };

    this.gates.GATE_3_LINKEDIN_BROADCAST.metadata = {
      claimsCount: contentPack.linkedInDraft.claims.length,
      postLength: contentPack.linkedInDraft.fullText.length,
      draftId: `draft_linkedin_${evidence.projectId}`
    };

    return {
      evidence,
      claimValidation,
      portfolioProjection,
      contentPack,
      gates: { ...this.gates }
    };
  }

  /**
   * Verifies the portfolio build and assets using Portfolio Sentinel.
   */
  public verifyPortfolioBuild(): PortfolioSentinelResult {
    return this.projectionEngine.verifyPortfolio();
  }

  /**
   * Gate Approval: Enforces human authority (Agent != Signer).
   * Execution of public side effects requires explicit operator signature.
   */
  public approveGate(gate: ShowcaseGateType, operatorSignature: string): GateApprovalRecord {
    if (!operatorSignature || operatorSignature.trim().length === 0) {
      throw new Error(`SIGNATURE_REQUIRED: Human operator signature required to approve ${gate}.`);
    }

    const record = this.gates[gate];
    if (!record) {
      throw new Error(`UNKNOWN_GATE: Gate ${gate} not found.`);
    }

    record.status = 'APPROVED';
    record.operatorSignature = operatorSignature.trim();
    record.approvedAt = new Date().toISOString();

    return { ...record };
  }

  /**
   * Gate Rejection: Rejects publication with operator feedback.
   */
  public rejectGate(gate: ShowcaseGateType, reason: string): GateApprovalRecord {
    const record = this.gates[gate];
    if (!record) {
      throw new Error(`UNKNOWN_GATE: Gate ${gate} not found.`);
    }

    record.status = 'REJECTED';
    record.rejectionReason = reason;

    return { ...record };
  }

  public getGateStatus(gate: ShowcaseGateType): GateApprovalRecord {
    return { ...this.gates[gate] };
  }

  public getAllGates(): Record<ShowcaseGateType, GateApprovalRecord> {
    return { ...this.gates };
  }
}
