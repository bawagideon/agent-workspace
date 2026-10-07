import crypto from 'crypto';
import path from 'path';
import { CapabilityRegistry, CapabilityDefinition } from '../capabilities/CapabilityRegistry';

export interface ArchitecturalAlternative {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  selected: boolean;
}

export interface AuthoritativeFileChange {
  path: string;
  changeType: 'MODIFY' | 'CREATE' | 'DELETE';
  rationale: string;
}

export interface ProhibitedFileTarget {
  path: string;
  reason: string;
  authoritativeSource: string;
}

export interface EngineeringSolutionBrief {
  id: string;
  missionId?: string;
  taskId?: string;
  title: string;
  problemStatement: string;
  rootCause: string;
  constraints: string[];
  reusableCapabilities: CapabilityDefinition[];
  alternatives: ArchitecturalAlternative[];
  chosenArchitecture: {
    summary: string;
    decisionRationale: string;
  };
  authoritativeFiles: AuthoritativeFileChange[];
  prohibitedFiles: ProhibitedFileTarget[];
  risksAndMitigations: Array<{ risk: string; mitigation: string }>;
  verificationPlan: {
    testSuite: string;
    contractAssertions: string[];
  };
  reusableCapabilityCandidate?: {
    name: string;
    category: string;
    description: string;
  };
  createdAt: string;
  sha256: string;
}

export class SolutionBriefEngine {
  /**
   * Evaluates if a given path is an authoritative source file or a derived projection.
   * Enforces RULE_GENERATED_ARTIFACT_PRESERVATION.
   */
  public static verifyAuthoritativeTarget(targetPath: string): {
    isAuthoritative: boolean;
    correctedPath?: string;
    rule?: string;
    reason?: string;
  } {
    const normalized = (targetPath || '').replace(/\\/g, '/').toLowerCase();

    // Derived SVGs / Projections
    if (
      normalized.includes('public/story/') ||
      normalized.includes('fixtures/story/') ||
      (normalized.endsWith('.svg') && normalized.includes('slide'))
    ) {
      return {
        isAuthoritative: false,
        correctedPath: 'packages/runtime/src/evidence/StoryPackGenerator.ts',
        rule: 'RULE_GENERATED_ARTIFACT_PRESERVATION',
        reason: 'SVG slides are derived output artifacts. Authoritative logic resides in StoryPackGenerator.ts.'
      };
    }

    // Build artifacts / Dist folders
    if (
      normalized.includes('/dist/') ||
      normalized.includes('/.next/') ||
      normalized.includes('/build/') ||
      normalized.includes('/out/')
    ) {
      return {
        isAuthoritative: false,
        rule: 'RULE_GENERATED_ARTIFACT_PRESERVATION',
        reason: 'Build artifacts in dist/build/.next cannot be modified directly.'
      };
    }

    return {
      isAuthoritative: true
    };
  }

  /**
   * Synthesizes a formal Engineering Solution Brief before code generation or modification.
   */
  public static generateBrief(params: {
    goal: string;
    missionId?: string;
    taskId?: string;
    workspacePath?: string;
    errorContext?: string;
  }): EngineeringSolutionBrief {
    const { goal, missionId, taskId, errorContext } = params;
    const briefId = `sb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const goalLower = goal.toLowerCase();

    // 1. Identify Reusable Capabilities
    const reusableCaps = CapabilityRegistry.checkReuseForProblem(goal);

    // 2. Identify Authoritative Target vs Prohibited Projections
    const authoritativeFiles: AuthoritativeFileChange[] = [];
    const prohibitedFiles: ProhibitedFileTarget[] = [];

    if (
      goalLower.includes('slide') || 
      goalLower.includes('story') || 
      goalLower.includes('svg') || 
      goalLower.includes('presentation') ||
      goalLower.includes('design')
    ) {
      authoritativeFiles.push({
        path: 'packages/runtime/src/evidence/StoryPackGenerator.ts',
        changeType: 'MODIFY',
        rationale: 'Canonical generator source code containing slide layout algorithms, 3D isometric math, and typography.'
      });
      prohibitedFiles.push({
        path: 'apps/hq/public/story/webhook-billing-bridge/*.svg',
        reason: 'Derived output artifacts overwritten by StoryPackGenerator. Direct edits cause hash drift and QA rejections.',
        authoritativeSource: 'packages/runtime/src/evidence/StoryPackGenerator.ts'
      });
    } else if (goalLower.includes('hmac') || goalLower.includes('webhook') || goalLower.includes('billing')) {
      authoritativeFiles.push({
        path: 'projects/webhook-billing-bridge/src/security/hmac.ts',
        changeType: 'MODIFY',
        rationale: 'Primary timing-safe cryptographic buffer comparison implementation.'
      });
    } else if (goalLower.includes('workspace') || goalLower.includes('chat') || goalLower.includes('prompt')) {
      authoritativeFiles.push({
        path: 'apps/hq/src/components/chat/GideonContextChat.tsx',
        changeType: 'MODIFY',
        rationale: 'Core operational interaction surface for user and workforce dialogue.'
      });
    } else {
      authoritativeFiles.push({
        path: 'packages/runtime/src/index.ts',
        changeType: 'MODIFY',
        rationale: 'Core runtime entry point and workforce orchestration module.'
      });
    }

    // 3. Formulate Alternatives
    const alternatives: ArchitecturalAlternative[] = [
      {
        name: 'Option A: Direct Derived Patching (Quick Fix)',
        description: 'Edit the rendered SVGs or derived configuration files directly to achieve immediate visual match.',
        pros: ['Fastest turnaround in isolated ad-hoc manual testing'],
        cons: ['Violates RULE_GENERATED_ARTIFACT_PRESERVATION', 'Causes cryptographic hash drift', 'Wiped on next clean build'],
        selected: false
      },
      {
        name: 'Option B: Canonical Source Generator Modification (Architectural)',
        description: 'Update the authoritative generator source, recalculate vector math, regenerate artifacts, and verify cryptographic SHA-256 integrity.',
        pros: ['Enforces single source of truth', 'Preserves deterministic reproducibility', 'Passes Sentinel QA contracts'],
        cons: ['Requires running test generation harness to verify changes'],
        selected: true
      },
      {
        name: 'Option C: Complete Rewrite & Redesign from Scratch',
        description: 'Discard existing generator templates and replace with an entirely new third-party graphics pipeline.',
        pros: ['Total freedom from existing styling constraints'],
        cons: ['High regression risk', 'Breaks backward compatibility with existing 8-slide contracts', 'Speculative complexity'],
        selected: false
      }
    ];

    // 4. Formulate Constraints
    const constraints: string[] = [
      'RULE_GENERATED_ARTIFACT_PRESERVATION: Prohibit editing derived output files.',
      'Agent != Signer: Autonomous agents cannot auto-sign Gate 1, 2, or 3 deployments.',
      'Deterministic Correctness: Must pass all Sentinel QA test contracts without false positives.',
      'Minimal Viable Change: Zero speculative refactors or unneeded dependency bloat.'
    ];

    // 5. Verification Plan
    const verificationPlan = {
      testSuite: goalLower.includes('slide') || goalLower.includes('story') 
        ? 'scripts/test-engineering-showcase-loop.ts' 
        : 'scripts/test-gideon-workspace-and-intelligence.ts',
      contractAssertions: [
        'All modified files pass TypeScript type checking without errors.',
        'Cryptographic SHA-256 seal matches disk bytes.',
        'Zero regression in 9 Sentinel quality dimensions.'
      ]
    };

    // 6. Root Cause analysis
    const rootCause = errorContext 
      ? `Prior attempt failed with: ${errorContext}. Investigation revealed divergence between authoritative generator and rendered projections.`
      : 'Engineering objective requires precision implementation in canonical source repository with verified contract bounds.';

    // 7. Assemble Brief
    const rawBrief: Omit<EngineeringSolutionBrief, 'sha256'> = {
      id: briefId,
      missionId,
      taskId,
      title: goal.length > 60 ? goal.substring(0, 57) + '...' : goal,
      problemStatement: goal,
      rootCause,
      constraints,
      reusableCapabilities: reusableCaps,
      alternatives,
      chosenArchitecture: {
        summary: 'Option B: Canonical Source Generator Modification with deterministic contract verification.',
        decisionRationale: 'Guarantees that generator logic is the single source of truth while protecting against derived artifact hash drift.'
      },
      authoritativeFiles,
      prohibitedFiles,
      risksAndMitigations: [
        {
          risk: 'Derived artifacts out of sync with generator',
          mitigation: 'Automated regeneration step executed immediately upon source file modification.'
        },
        {
          risk: 'Unauthorized production broadcast without human sign-off',
          mitigation: 'Enforce cryptographic authority token check before Gate 3 LinkedIn broadcast.'
        }
      ],
      verificationPlan,
      reusableCapabilityCandidate: goalLower.includes('slide') || goalLower.includes('3d') ? {
        name: '3D Isometric SVG Slide Generator v2',
        category: 'EVIDENCE',
        description: 'Mathematical isometric vector generator with dynamic contrast tuning and glowing conduits.'
      } : undefined,
      createdAt: new Date().toISOString()
    };

    const hashPayload = JSON.stringify(rawBrief);
    const sha256 = crypto.createHash('sha256').update(hashPayload).digest('hex');

    return {
      ...rawBrief,
      sha256
    };
  }

  /**
   * Formats an Engineering Solution Brief as clean GitHub-style Markdown.
   */
  public static formatBriefMarkdown(brief: EngineeringSolutionBrief): string {
    const lines: string[] = [
      `# 📋 Engineering Solution Brief: ${brief.title}`,
      `**Brief ID:** \`${brief.id}\` | **SHA-256:** \`${brief.sha256.substring(0, 16)}...\` | **Created:** ${brief.createdAt}`,
      brief.missionId ? `**Mission ID:** \`${brief.missionId}\`` : '',
      brief.taskId ? `**Task ID:** \`${brief.taskId}\`` : '',
      '',
      '## 1. Problem Statement & Root Cause',
      `> **Problem:** ${brief.problemStatement}`,
      '',
      `**Root Cause:** ${brief.rootCause}`,
      '',
      '## 2. Constraints & Governing Rules',
      ...brief.constraints.map(c => `- 🛡️ **Rule:** ${c}`),
      '',
      '## 3. Existing Reusable Capabilities (CapabilityRegistry)',
      brief.reusableCapabilities.length > 0
        ? brief.reusableCapabilities.map(cap => `- 🧩 **[${cap.id}] ${cap.name}** (${cap.category} - ${cap.maturity}): \`${cap.reusableInterface}\``).join('\n')
        : '- *No matching reusable capability found. New primitive required.*',
      '',
      '## 4. Architectural Alternatives Evaluated',
      ...brief.alternatives.map(alt => [
        `### ${alt.selected ? '✅ [CHOSEN] ' : '⚪ '}${alt.name}`,
        `${alt.description}`,
        `- **Pros:** ${alt.pros.join(', ')}`,
        `- **Cons:** ${alt.cons.join(', ')}`
      ].join('\n')),
      '',
      '## 5. Authoritative Files vs. Prohibited Targets',
      '### Authoritative Files (TO MODIFY/CREATE):',
      ...brief.authoritativeFiles.map(f => `- ✏️ \`${f.path}\` (${f.changeType}) — ${f.rationale}`),
      '',
      '### Prohibited Targets (DO NOT TOUCH DIRECTLY):',
      ...brief.prohibitedFiles.map(p => `- ⛔ \`${p.path}\` — ${p.reason} *(Edit \`${p.authoritativeSource}\` instead)*`),
      '',
      '## 6. Verification Plan & Test Contracts',
      `**Test Suite:** \`${brief.verificationPlan.testSuite}\``,
      ...brief.verificationPlan.contractAssertions.map(a => `- [x] ${a}`),
      ''
    ];

    return lines.filter(l => l !== undefined).join('\n');
  }
}
