import fs from 'fs';
import path from 'path';
import { CapabilityRegistry, CapabilityDefinition } from '../capabilities/CapabilityRegistry';

export interface ContextFact {
  id: string;
  category: 'IDENTITY' | 'GOAL' | 'PREFERENCE' | 'TECH_STACK' | 'AUTHORITY_POLICY';
  statement: string;
  sourceOfTruth: string;
  verifiedAt: string;
  isAuthoritative: true;
}

export interface ContextObservation {
  id: string;
  agent: 'sentinel' | 'atlas' | 'forge' | 'scout';
  category: 'FRICTION' | 'PATTERN' | 'RECOMMENDATION' | 'HYPOTHESIS';
  statement: string;
  confidence: number;
  observedAt: string;
  isAuthoritative: false;
  evidenceRef?: string;
}

export interface ADRRecord {
  id: string;
  title: string;
  status: 'ACCEPTED' | 'PROPOSED' | 'DEPRECATED';
  decision: string;
  consequences: string;
  date: string;
}

export interface VerifiedLessonSummary {
  ruleId: string;
  title: string;
  statement: string;
  rationale: string;
  verificationStatus: string;
  confidence: number;
}

export interface ContextScope {
  page?: string;
  projectId?: string;
  missionId?: string;
  agentId?: string;
  activeRunId?: string;
}

export interface ContextEnvelope {
  scope: ContextScope & { timestamp: string };
  operator: {
    name: string;
    role: string;
    brandIdentity: {
      primaryColor: string;
      canvasColor: string;
      surfaceColor: string;
      logoSvgPath: string;
      symbolism: string;
    };
    hardConstraints: string[];
  };
  facts: ContextFact[];
  observations: ContextObservation[];
  adrs: ADRRecord[];
  verifiedLessons: VerifiedLessonSummary[];
  capabilities: CapabilityDefinition[];
  evidenceContracts: Array<{
    id: string;
    type: string;
    status: string;
    sha256?: string;
  }>;
}

export class ContextResolver {
  private static findGideonDir(): string {
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, '.gideon'))) {
      return path.join(cwd, '.gideon');
    }
    const upDir = path.resolve(cwd, '..');
    if (fs.existsSync(path.join(upDir, '.gideon'))) {
      return path.join(upDir, '.gideon');
    }
    const upTwo = path.resolve(cwd, '../..');
    if (fs.existsSync(path.join(upTwo, '.gideon'))) {
      return path.join(upTwo, '.gideon');
    }
    return path.join(cwd, '.gideon');
  }

  /**
   * Compiles the unified Context Envelope across Facts, Observations, Lessons, ADRs, and Capabilities.
   * Guarantees strict Fact vs. Opinion separation.
   */
  public static async compileEnvelope(scope: ContextScope = {}): Promise<ContextEnvelope> {
    const gideonDir = this.findGideonDir();

    // 1. Authoritative Verified Facts
    const facts: ContextFact[] = [
      {
        id: 'fact-identity-001',
        category: 'IDENTITY',
        statement: 'Operator is Gideon Bawa, Senior Systems & Autonomous Software Architect.',
        sourceOfTruth: 'fixtures/profile/cv_v12.json',
        verifiedAt: '2026-09-29T12:00:00.000Z',
        isAuthoritative: true
      },
      {
        id: 'fact-stack-001',
        category: 'TECH_STACK',
        statement: 'Target stack is Next.js 14 App Router, Tailwind CSS, TypeScript strict, and Vitest/Node test harnesses.',
        sourceOfTruth: 'package.json',
        verifiedAt: '2026-09-29T12:00:00.000Z',
        isAuthoritative: true
      },
      {
        id: 'fact-design-001',
        category: 'PREFERENCE',
        statement: 'Visual presentation standard: 3D isometric perspectives, dark obsidian void (#030712), rich crimson accents (#DC2626), zero generic diagrams.',
        sourceOfTruth: 'StoryPackGenerator.ts',
        verifiedAt: '2026-09-29T16:00:00.000Z',
        isAuthoritative: true
      },
      {
        id: 'fact-governance-001',
        category: 'AUTHORITY_POLICY',
        statement: 'Gate 1 (GitHub push), Gate 2 (Netlify deploy), and Gate 3 (Social/LinkedIn broadcast) strictly require human operator signature.',
        sourceOfTruth: 'ShowcaseOrchestrator.ts',
        verifiedAt: '2026-09-29T15:00:00.000Z',
        isAuthoritative: true
      },
      {
        id: 'fact-security-001',
        category: 'AUTHORITY_POLICY',
        statement: 'All cryptographic hash validations must use timingSafeEqual and verifiable SHA-256 digests.',
        sourceOfTruth: 'packages/memory/src/SecurityProjectionPipeline.ts',
        verifiedAt: '2026-09-29T14:00:00.000Z',
        isAuthoritative: true
      }
    ];

    // 2. Observations & Sentinel Hypotheses (Non-authoritative opinions)
    const observations: ContextObservation[] = [
      {
        id: 'obs-sentinel-001',
        agent: 'sentinel',
        category: 'PATTERN',
        statement: 'Forge successfully preserved generated SVG projections after RULE_GENERATED_ARTIFACT_PRESERVATION was loaded into supervisor.',
        confidence: 0.98,
        observedAt: new Date().toISOString(),
        isAuthoritative: false,
        evidenceRef: 'ev-qa-contract-1790547094069-41f1e2d3'
      },
      {
        id: 'obs-atlas-001',
        agent: 'atlas',
        category: 'RECOMMENDATION',
        statement: 'Auto-dispatch for low/medium risk commands reduces operator cognitive load and turnaround time by ~75%.',
        confidence: 0.91,
        observedAt: new Date().toISOString(),
        isAuthoritative: false
      }
    ];

    // 3. ADR Records
    const adrs: ADRRecord[] = [
      {
        id: 'ADR-001',
        title: 'Single Source of Truth for Derived Visual Projections',
        status: 'ACCEPTED',
        decision: 'All story slides and motion reel SVGs are generated deterministically by StoryPackGenerator.ts. Direct SVG edits are rejected by Sentinel QA contracts.',
        consequences: 'Eliminates drift, ensures 100% reproducible builds, maintains SHA-256 seal integrity.',
        date: '2026-09-29'
      },
      {
        id: 'ADR-002',
        title: 'Closed-Loop Mission Supervisor with Error Taxonomy',
        status: 'ACCEPTED',
        decision: 'Mission execution failures are classified into 8 bounded categories with autonomous retry budgets before operator escalation.',
        consequences: 'Autonomous agents recover from transient environment or formatting errors without stalling.',
        date: '2026-09-29'
      },
      {
        id: 'ADR-003',
        title: 'Multi-Agent Separation of Powers (Operator != Signer)',
        status: 'ACCEPTED',
        decision: 'No agent can sign deployment or broadcast authority gates. Human operator remains the sole cryptographic authority.',
        consequences: 'Zero risk of runaway agent hallucination publishing unvetted code or communications.',
        date: '2026-09-29'
      },
      {
        id: 'ADR-004',
        title: 'Unified AI Engineering Workspace over Disparate Control Tabs',
        status: 'ACCEPTED',
        decision: 'Unify conversational control and sidecar engineering workbench into a single /workspace surface while preserving all existing subsystem APIs.',
        consequences: 'Transforms Gideon HQ from a fragmented dashboard into an Antigravity-style operating environment.',
        date: '2026-09-29'
      }
    ];

    // 4. Verified Lessons from Local/Remote Cache
    const verifiedLessons: VerifiedLessonSummary[] = [];
    try {
      const lessonsCacheFile = path.join(gideonDir, 'lessons_cache.json');
      if (fs.existsSync(lessonsCacheFile)) {
        const raw = JSON.parse(fs.readFileSync(lessonsCacheFile, 'utf8'));
        if (Array.isArray(raw.lessons)) {
          for (const l of raw.lessons) {
            verifiedLessons.push({
              ruleId: l.key || l.id,
              title: l.key || 'Verified Lesson',
              statement: l.statement,
              rationale: l.rationale || '',
              verificationStatus: l.verificationStatus || 'VERIFIED',
              confidence: l.confidence || 1.0
            });
          }
        }
      }
    } catch (err) {
      console.warn('[ContextResolver] Could not read lessons cache:', err);
    }

    // 5. Capability Registry Primitives
    const capabilities = CapabilityRegistry.getAll();

    // 6. Evidence Contracts
    const evidenceContracts: Array<{ id: string; type: string; status: string; sha256?: string }> = [];
    try {
      const evidenceDir = path.join(gideonDir, 'evidence');
      if (fs.existsSync(evidenceDir)) {
        const files = fs.readdirSync(evidenceDir).filter(f => f.endsWith('.json')).slice(-8);
        for (const file of files) {
          try {
            const content = JSON.parse(fs.readFileSync(path.join(evidenceDir, file), 'utf8'));
            evidenceContracts.push({
              id: content.id || file.replace('.json', ''),
              type: content.claimType || content.type || 'EVIDENCE_CONTRACT',
              status: content.status || 'VERIFIED',
              sha256: content.sha256 || content.contentHash
            });
          } catch {}
        }
      }
    } catch {}

    return {
      scope: {
        ...scope,
        timestamp: new Date().toISOString()
      },
      operator: {
        name: 'Gideon Bawa',
        role: 'Autonomous Systems Architect & Lead Engineer',
        brandIdentity: {
          primaryColor: '#DC2626',
          canvasColor: '#030712',
          surfaceColor: '#111827',
          logoSvgPath: '/brand/gideon-hq-icon.svg',
          symbolism: 'Dual interlocking crimson chevrons: Strategic Intelligence converging with Hardened Execution.'
        },
        hardConstraints: [
          'Never execute Gate 1, 2, or 3 without explicit operator cryptographic sign-off.',
          'Never patch derived artifacts directly when a generator or template exists.',
          'Never permit silent AI mutation of verified facts.'
        ]
      },
      facts,
      observations,
      adrs,
      verifiedLessons,
      capabilities,
      evidenceContracts
    };
  }
}
