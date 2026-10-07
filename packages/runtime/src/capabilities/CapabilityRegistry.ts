export interface CapabilityDefinition {
  id: string;
  name: string;
  category: 'SECURITY' | 'IDEMPOTENCY' | 'EVIDENCE' | 'COMMERCE' | 'ORCHESTRATION' | 'GOVERNANCE';
  originatingProject: string;
  sourcePath: string;
  description: string;
  reusableInterface: string;
  verifiedContractId?: string;
  status: 'ACTIVE' | 'EXPERIMENTAL' | 'DEPRECATED';
  maturity: 'EXPERIMENTAL' | 'PROVEN' | 'CORE';
  version: string;
  testContracts: string[];
  consumers: string[];
  dependencies: string[];
  keywords: string[];
}

export class CapabilityRegistry {
  private static capabilities: CapabilityDefinition[] = [
    {
      id: 'cap-hmac-timing-safe',
      name: 'Timing-Safe Buffer HMAC',
      category: 'SECURITY',
      originatingProject: 'webhook-billing-bridge',
      sourcePath: 'projects/webhook-billing-bridge/src/security/hmac.ts',
      description: 'Constant-time cryptographic digest comparison mitigating timing side-channel attacks against webhook signatures.',
      reusableInterface: 'verifyHmac(payload: Buffer, signature: string, secret: string): boolean',
      status: 'ACTIVE',
      maturity: 'CORE',
      version: '1.2.0',
      verifiedContractId: 'ev-qa-contract-1790494152855-97bed37d',
      testContracts: ['scripts/test-phase4-commerce-billing.ts', 'scripts/test-sentinel-adversarial.ts'],
      consumers: ['webhook-billing-bridge', 'b2b-automation-service', 'CommandEngine'],
      dependencies: [],
      keywords: ['hmac', 'crypto', 'timing', 'signature', 'security', 'constant-time', 'webhook']
    },
    {
      id: 'cap-anti-replay-ttl',
      name: 'Anti-Replay Timestamp Decay',
      category: 'SECURITY',
      originatingProject: 'webhook-billing-bridge',
      sourcePath: 'projects/webhook-billing-bridge/src/security/antiReplay.ts',
      description: 'Enforces maximum allowable event age (300s default) to prevent replay of captured webhook payloads.',
      reusableInterface: 'assertTimestampFresh(epochSeconds: number, maxAgeMs?: number): void',
      status: 'ACTIVE',
      maturity: 'CORE',
      version: '1.1.0',
      verifiedContractId: 'ev-qa-contract-1790494218709-da743d59',
      testContracts: ['scripts/test-sentinel-adversarial.ts'],
      consumers: ['webhook-billing-bridge', 'stripe-client-workflow'],
      dependencies: [],
      keywords: ['replay', 'timestamp', 'ttl', 'decay', 'freshness', 'anti-replay']
    },
    {
      id: 'cap-atomic-idempotency',
      name: 'Atomic Idempotency Mutex',
      category: 'IDEMPOTENCY',
      originatingProject: 'webhook-billing-bridge',
      sourcePath: 'projects/webhook-billing-bridge/src/storage/idempotency.ts',
      description: 'Distributed concurrency-safe lock preventing duplicate credit allocation or double-billing on repeated delivery.',
      reusableInterface: 'acquireIdempotencyLock(eventId: string, ttlMs: number): Promise<boolean>',
      status: 'ACTIVE',
      maturity: 'CORE',
      version: '2.0.1',
      verifiedContractId: 'ev-qa-contract-1790494558627-9cf7345d',
      testContracts: ['scripts/test-phase4-commerce-billing.ts'],
      consumers: ['webhook-billing-bridge', 'CommandEngine', 'b2b-automation-service'],
      dependencies: [],
      keywords: ['idempotency', 'mutex', 'lock', 'atomic', 'duplicate', 'double-billing']
    },
    {
      id: 'cap-quarantine-uncertainty',
      name: 'Uncertainty Quarantine State',
      category: 'GOVERNANCE',
      originatingProject: 'webhook-billing-bridge',
      sourcePath: 'projects/webhook-billing-bridge/src/handlers/quarantine.ts',
      description: 'Isolates ambiguous webhook events into a secure quarantine queue without failing the caller or dropping payload.',
      reusableInterface: 'quarantineEvent(eventId: string, reason: string, rawPayload: any): Promise<void>',
      status: 'ACTIVE',
      maturity: 'PROVEN',
      version: '1.0.0',
      verifiedContractId: 'ev-qa-contract-1790494761731-8235240b',
      testContracts: ['scripts/test-phase4-commerce-billing.ts'],
      consumers: ['webhook-billing-bridge'],
      dependencies: [],
      keywords: ['quarantine', 'isolation', 'ambiguity', 'uncertainty', 'governance']
    },
    {
      id: 'cap-3d-isometric-engine',
      name: '3D Isometric SVG Slide Generator',
      category: 'EVIDENCE',
      originatingProject: 'webhook-billing-bridge',
      sourcePath: 'packages/runtime/src/evidence/StoryPackGenerator.ts',
      description: 'Generates mathematical 3D isometric vector graphics with illuminated top, ambient shadow, and glowing conduits.',
      reusableInterface: 'renderIsometricBox(...): string; renderGlowPath(...): string',
      status: 'ACTIVE',
      maturity: 'CORE',
      version: '2.2.0',
      verifiedContractId: 'ev-qa-contract-1790547094069-41f1e2d3',
      testContracts: ['scripts/test-engineering-showcase-loop.ts'],
      consumers: ['StoryPackGenerator', 'ShowcaseOrchestrator', 'LinkedInPublishingPipeline'],
      dependencies: [],
      keywords: ['svg', '3d', 'isometric', 'vector', 'storypack', 'generator', 'slide', 'carousel']
    },
    {
      id: 'cap-cinema-motion-reel',
      name: 'Cinema Motion Reel Player',
      category: 'EVIDENCE',
      originatingProject: 'webhook-billing-bridge',
      sourcePath: 'apps/hq/public/story/webhook-billing-bridge/motion-reel.html',
      description: 'Hardware-accelerated 60fps presentation reel with ambient soundtrack, auto-advancing slides, and camera panning.',
      reusableInterface: 'MotionReelPlayer(slides: string[], durationPerSlideMs: number)',
      status: 'ACTIVE',
      maturity: 'PROVEN',
      version: '1.0.4',
      testContracts: ['scripts/test-engineering-showcase-loop.ts'],
      consumers: ['PublicShowcase', 'StoryPackViewer'],
      dependencies: ['cap-3d-isometric-engine'],
      keywords: ['cinema', 'motion', 'reel', 'player', 'presentation', 'animation', 'video', '60fps']
    },
    {
      id: 'cap-financial-ledger',
      name: 'Financial Control Plane Ledger',
      category: 'COMMERCE',
      originatingProject: 'gideon-hq',
      sourcePath: 'packages/billing/src/LedgerEngine.ts',
      description: 'Immutable double-entry token and currency accounting ledger with per-agent margin and cost tracking.',
      reusableInterface: 'recordLedgerTransaction(tx: LedgerTransaction): Promise<string>',
      status: 'ACTIVE',
      maturity: 'CORE',
      version: '2.0.0',
      testContracts: ['scripts/test-phase4-commerce-billing.ts'],
      consumers: ['MissionEngine', 'LedgerStation', 'CommandEngine'],
      dependencies: [],
      keywords: ['ledger', 'accounting', 'tokens', 'cost', 'spend', 'margin', 'finance']
    },
    {
      id: 'cap-portal-token-auth',
      name: 'Client Portal Token Auth',
      category: 'SECURITY',
      originatingProject: 'gideon-hq',
      sourcePath: 'packages/portal/src/PortalAuth.ts',
      description: 'Scoped, time-bound share links and magic token authentication for client artifact review and sign-off.',
      reusableInterface: 'generateShareToken(projectId: string, permissions: string[]): string',
      status: 'ACTIVE',
      maturity: 'PROVEN',
      version: '1.1.0',
      testContracts: ['scripts/test-phase5-client-portal.ts'],
      consumers: ['ClientPortal', 'ReviewLinks'],
      dependencies: ['cap-hmac-timing-safe'],
      keywords: ['portal', 'token', 'auth', 'magic-link', 'client', 'share']
    },
    {
      id: 'cap-agent-signer-separation',
      name: 'Agent != Signer 3-Gate Authority',
      category: 'GOVERNANCE',
      originatingProject: 'gideon-hq',
      sourcePath: 'packages/runtime/src/evidence/ShowcaseOrchestrator.ts',
      description: 'Cryptographic policy enforcement preventing autonomous agents from self-approving high-consequence deployments.',
      reusableInterface: 'verifySignerAuthorization(gateId: string, actor: string): boolean',
      status: 'ACTIVE',
      maturity: 'CORE',
      version: '2.0.0',
      testContracts: ['scripts/test-engineering-showcase-loop.ts', 'scripts/test-sentinel-adversarial.ts'],
      consumers: ['ShowcaseOrchestrator', 'MissionSupervisor', 'GateController'],
      dependencies: [],
      keywords: ['gate', 'authority', 'signer', 'human-in-the-loop', 'governance', 'signature']
    },
    {
      id: 'cap-closed-loop-supervisor',
      name: 'Closed-Loop Mission Supervisor',
      category: 'ORCHESTRATION',
      originatingProject: 'gideon-hq',
      sourcePath: 'packages/runtime/src/supervisor/MissionSupervisor.ts',
      description: 'Autonomous recovery supervisor with 8-category error taxonomy, automatic retry bounds, and evidence verification.',
      reusableInterface: 'handleFailure(failure: MissionFailure): Promise<RecoveryDecision>',
      status: 'ACTIVE',
      maturity: 'CORE',
      version: '2.0.0',
      testContracts: ['scripts/test-engineering-showcase-loop.ts', 'scripts/test-gideon-workspace-and-intelligence.ts'],
      consumers: ['MissionEngine', 'AgentRuntime', 'CommandEngine'],
      dependencies: ['cap-agent-signer-separation'],
      keywords: ['supervisor', 'recovery', 'taxonomy', 'retry', 'closed-loop', 'orchestration']
    }
  ];

  public static getAll(): CapabilityDefinition[] {
    return [...this.capabilities];
  }

  public static getByCategory(category: CapabilityDefinition['category']): CapabilityDefinition[] {
    return this.capabilities.filter(c => c.category === category);
  }

  public static getById(id: string): CapabilityDefinition | undefined {
    return this.capabilities.find(c => c.id === id);
  }

  public static getForProject(projectName: string): CapabilityDefinition[] {
    return this.capabilities.filter(c => c.originatingProject === projectName);
  }

  /**
   * Evaluates problem query against capability catalog to discover reusable primitives
   * and prevent speculative reimplementation.
   */
  public static checkReuseForProblem(problemQuery: string): CapabilityDefinition[] {
    const q = (problemQuery || '').toLowerCase();
    const tokens = q.split(/[\s,._\-:;/\\]+/).filter(t => t.length > 2);

    return this.capabilities.filter(cap => {
      // Direct keyword match
      if (cap.keywords.some(k => q.includes(k) || tokens.includes(k))) return true;
      // Name or description match
      if (cap.name.toLowerCase().includes(q)) return true;
      if (tokens.some(t => cap.name.toLowerCase().includes(t))) return true;
      if (tokens.some(t => cap.description.toLowerCase().includes(t))) return true;
      return false;
    });
  }

  /**
   * Resolves full dependency graph for a given capability.
   */
  public static getDependencyGraph(capabilityId: string): {
    capability: CapabilityDefinition;
    directDeps: CapabilityDefinition[];
    consumers: string[];
  } | null {
    const cap = this.getById(capabilityId);
    if (!cap) return null;

    const directDeps = (cap.dependencies || [])
      .map(id => this.getById(id))
      .filter((c): c is CapabilityDefinition => !!c);

    return {
      capability: cap,
      directDeps,
      consumers: cap.consumers || []
    };
  }

  public static registerCapability(cap: CapabilityDefinition): void {
    const existingIndex = this.capabilities.findIndex(c => c.id === cap.id);
    if (existingIndex >= 0) {
      this.capabilities[existingIndex] = cap;
    } else {
      this.capabilities.push(cap);
    }
  }
}
