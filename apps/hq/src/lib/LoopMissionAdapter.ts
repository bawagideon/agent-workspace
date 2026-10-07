import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabase } from './supabase';
import { chatAdapter } from './ChatAdapter';

export type MissionLoop = 'BUILD' | 'PUBLISH' | 'OPPORTUNITIES';
export type MissionStatus = 'PROPOSED' | 'RUNNING' | 'PAUSED' | 'HALTED_FOR_APPROVAL' | 'COMPLETED' | 'FAILED';

export interface LoopMission {
  id: string;
  loop: MissionLoop;
  title: string;
  objective: string;
  projectId?: string;
  status: MissionStatus;
  conversationId: string;
  workforce: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  constraints?: string;
  contextRevision: number;
  filesTouched?: string[];
  evidenceRef?: string;
  artifacts?: Array<{ name: string; url?: string; type: string }>;
  approvals?: Array<{ id: string; gate: string; status: string; description: string }>;
  metrics?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORE_DIR = path.resolve(process.cwd(), process.cwd().includes('apps') ? '../../.gideon' : '.gideon');
const MISSIONS_FILE = path.join(LOCAL_STORE_DIR, 'loop_missions.json');

const INITIAL_MISSIONS: LoopMission[] = [
  // --- BUILD LOOP MISSIONS ---
  {
    id: 'build-webhook-bridge',
    loop: 'BUILD',
    title: 'Harden Webhook Billing Bridge with In-Memory Mutex',
    objective: 'Eliminate duplicate transaction processing under 20-thread Stripe retry assault with timing-safe HMAC and downstream uncertainty quarantine.',
    projectId: 'webhook-billing-bridge',
    status: 'COMPLETED',
    conversationId: 'conv-build-webhook-bridge',
    workforce: ['atlas', 'forge', 'sentinel'],
    riskLevel: 'MEDIUM',
    contextRevision: 4,
    filesTouched: [
      'packages/runtime/src/evidence/StoryPackGenerator.ts',
      'projects/webhook-billing-bridge/src/security/hmac.ts',
      'projects/webhook-billing-bridge/test/bridge.test.ts'
    ],
    evidenceRef: 'ev-qa-contract-1790547094069-41f1e2d3',
    approvals: [
      { id: 'gate-1-git', gate: 'Gate 1 (GitHub)', status: 'APPROVED', description: 'Authorize push to github.com/bawagideon/webhook-billing-bridge' }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'build-b2b-automation',
    loop: 'BUILD',
    title: 'Stripe Checkout & Automated Onboarding Microservice',
    objective: 'Implement audited Stripe checkout session generation on Port 4102 with adversarial SQL/NoSQL injection defense and rate limiting.',
    projectId: 'b2b-automation-service',
    status: 'COMPLETED',
    conversationId: 'conv-build-b2b-automation',
    workforce: ['atlas', 'forge', 'sentinel'],
    riskLevel: 'LOW',
    contextRevision: 2,
    filesTouched: [
      'projects/b2b-automation-service/src/index.js',
      'projects/b2b-automation-service/src/controllers/checkoutController.js',
      'projects/b2b-automation-service/tests/adversarial_audit.spec.js'
    ],
    evidenceRef: 'ev-qa-contract-1790494558627-9cf7345d',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'build-fintech-idempotency',
    loop: 'BUILD',
    title: 'Multi-Tenant Distributed Idempotency Gateway',
    objective: 'Extend CapabilityRegistry mutex primitives to deliver sub-5ms Redis/memory mutex gateways for high-volume transactions without DB row locks.',
    projectId: 'stripe-client-workflow',
    status: 'RUNNING',
    conversationId: 'conv-build-fintech-idempotency',
    workforce: ['atlas', 'forge', 'sentinel'],
    riskLevel: 'HIGH',
    constraints: 'Must support 10,000 req/sec with < 5ms latency overhead.',
    contextRevision: 1,
    filesTouched: [
      'packages/runtime/src/capabilities/CapabilityRegistry.ts',
      'projects/stripe-client-workflow/package.json'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // --- PUBLISH LOOP MISSIONS ---
  {
    id: 'publish-webhook-case-study',
    loop: 'PUBLISH',
    title: 'Technical LinkedIn Case Study & 3D Story Pack Release',
    objective: 'Project Webhook Billing Bridge into an authentic 8-slide 3D isometric carousel with narrative storytelling and SHA-256 evidence seal.',
    projectId: 'webhook-billing-bridge',
    status: 'COMPLETED',
    conversationId: 'conv-publish-webhook-case-study',
    workforce: ['atlas', 'forge', 'sentinel'],
    riskLevel: 'HIGH',
    contextRevision: 3,
    evidenceRef: 'ev-qa-contract-1790547094069-41f1e2d3',
    artifacts: [
      { name: '8 3D Isometric SVG Slides', url: '/story/webhook-billing-bridge/slide-1.svg', type: 'vector/svg' },
      { name: '8 High-Res PNG Carousel Slides (1920x1080)', url: '/story/webhook-billing-bridge/slide-1.png', type: 'image/png' },
      { name: 'Narrative Case Study Copy', url: '/story/webhook-billing-bridge/narrative-post.txt', type: 'text/plain' },
      { name: '60fps Presentation Reel Player', url: '/story/webhook-billing-bridge/motion-reel.html', type: 'text/html' }
    ],
    approvals: [
      { id: 'gate-3-linkedin', gate: 'Gate 3 (LinkedIn Broadcast)', status: 'APPROVED', description: 'Operator signed Gate 3 with SHA-256 seal 56b0975b...' }
    ],
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'publish-portfolio-projection',
    loop: 'PUBLISH',
    title: 'Canonical 3D Portfolio Showcase Synchronization',
    objective: 'Publish Webhook Billing Bridge and B2B Automation Service as flagship deliverables into Desktop/my-3d-portfolio-main/src/data/projects.generated.js.',
    projectId: 'webhook-billing-bridge',
    status: 'COMPLETED',
    conversationId: 'conv-publish-portfolio-projection',
    workforce: ['atlas', 'forge'],
    riskLevel: 'MEDIUM',
    contextRevision: 2,
    filesTouched: [
      'C:/Users/DELL/Desktop/my-3d-portfolio-main/src/data/projects.generated.js'
    ],
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // --- OPPORTUNITIES LOOP MISSIONS ---
  {
    id: 'opp-saas-webhook-hardening',
    loop: 'OPPORTUNITIES',
    title: 'Find SaaS Teams Suffering from Payment Webhook Retries',
    objective: 'Research 20 mid-market B2B SaaS and fintech companies processing payments via Stripe, qualify duplicate charge risks, and draft custom technical audit pitches.',
    projectId: 'webhook-billing-bridge',
    status: 'RUNNING',
    conversationId: 'conv-opp-saas-webhook-hardening',
    workforce: ['scout', 'atlas', 'sentinel'],
    riskLevel: 'LOW',
    contextRevision: 2,
    metrics: {
      discovered: 12,
      technicallyQualified: 3,
      contacted: 0,
      responded: 0,
      won: 0,
      cashReceivedCents: 0
    },
    constraints: 'Human approval strictly required prior to any outbound email or message dispatch.',
    createdAt: new Date(Date.now() - 36000000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'opp-b2b-onboarding-automation',
    loop: 'OPPORTUNITIES',
    title: 'B2B Client Provisioning & Automated Webhook Onboarding',
    objective: 'Identify high-ticket agencies and vertical SaaS platforms with manual customer setup bottlenecks and pitch 100% automated Stripe-to-workspace provisioning.',
    projectId: 'b2b-automation-service',
    status: 'RUNNING',
    conversationId: 'conv-opp-b2b-onboarding-automation',
    workforce: ['scout', 'atlas', 'sentinel'],
    riskLevel: 'LOW',
    contextRevision: 1,
    metrics: {
      discovered: 8,
      technicallyQualified: 2,
      contacted: 0,
      responded: 0,
      won: 0,
      cashReceivedCents: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function ensureMissionsStore(): Map<string, LoopMission> {
  const missionMap = new Map<string, LoopMission>();
  try {
    if (!fs.existsSync(LOCAL_STORE_DIR)) {
      fs.mkdirSync(LOCAL_STORE_DIR, { recursive: true });
    }

    if (fs.existsSync(MISSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(MISSIONS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        data.forEach((m: LoopMission) => missionMap.set(m.id, m));
      }
    } else {
      INITIAL_MISSIONS.forEach((m: LoopMission) => missionMap.set(m.id, m));
      fs.writeFileSync(MISSIONS_FILE, JSON.stringify(INITIAL_MISSIONS, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[LoopMissionAdapter] Local store fallback error:', err);
    INITIAL_MISSIONS.forEach((m: LoopMission) => missionMap.set(m.id, m));
  }
  return missionMap;
}

function saveMissionsStore(map: Map<string, LoopMission>) {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(MISSIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('[LoopMissionAdapter] Failed to save missions:', err);
  }
}

export class LoopMissionAdapter {
  private missions: Map<string, LoopMission> = ensureMissionsStore();

  public async getMissions(loop?: MissionLoop): Promise<LoopMission[]> {
    this.missions = ensureMissionsStore();
    const list = Array.from(this.missions.values());
    const filtered = loop ? list.filter(m => m.loop === loop) : list;
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public async getMissionById(id: string): Promise<LoopMission | undefined> {
    this.missions = ensureMissionsStore();
    return this.missions.get(id);
  }

  public async createMission(params: {
    loop: MissionLoop;
    title: string;
    objective: string;
    projectId?: string;
    workforce?: string[];
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    constraints?: string;
  }): Promise<LoopMission> {
    this.missions = ensureMissionsStore();
    const loopPrefix = params.loop.toLowerCase().slice(0, 3);
    const missionId = `${loopPrefix}-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex')}`;
    const convoId = `conv-${missionId}`;

    const defaultWorkforce = params.workforce && params.workforce.length > 0 
      ? params.workforce 
      : (params.loop === 'BUILD' 
          ? ['atlas', 'forge', 'sentinel'] 
          : (params.loop === 'PUBLISH' 
              ? ['atlas', 'forge', 'sentinel'] 
              : ['scout', 'atlas', 'sentinel']));

    const newMission: LoopMission = {
      id: missionId,
      loop: params.loop,
      title: params.title.trim(),
      objective: params.objective.trim(),
      projectId: params.projectId || 'agent-workspace',
      status: 'RUNNING',
      conversationId: convoId,
      workforce: defaultWorkforce,
      riskLevel: params.riskLevel || 'MEDIUM',
      constraints: params.constraints?.trim(),
      contextRevision: 1,
      filesTouched: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.missions.set(missionId, newMission);
    saveMissionsStore(this.missions);

    // Seed initial assistant message in attached conversation
    try {
      const initialGreeting = params.loop === 'BUILD'
        ? `I have instantiated build mission **${newMission.title}** under ${newMission.projectId}. Atlas has registered the objective, Forge is inspecting relevant capabilities, and Sentinel is standing by to verify. What is our first implementation step?`
        : params.loop === 'PUBLISH'
        ? `Publishing mission **${newMission.title}** is active for ${newMission.projectId}. We have authoritative evidence loaded. I will help draft, format, verify slides, and prepare release gates for your approval.`
        : `Opportunity mission **${newMission.title}** initiated. Scout is researching companies matching our technical capability in ${newMission.projectId}. Remember: human authority is required for all outbound communications.`;

      await chatAdapter.seedInitialGreeting({
        conversationId: convoId,
        agentId: params.loop === 'BUILD' ? 'forge' : params.loop === 'PUBLISH' ? 'atlas' : 'scout',
        content: initialGreeting,
        contextId: newMission.projectId,
        projectId: newMission.projectId
      });
    } catch (err) {
      console.warn('[LoopMissionAdapter] Initial greeting failed:', err);
    }

    return newMission;
  }

  public async updateMission(id: string, updates: Partial<LoopMission>): Promise<LoopMission | undefined> {
    this.missions = ensureMissionsStore();
    const existing = this.missions.get(id);
    if (!existing) return undefined;

    const updated: LoopMission = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.missions.set(id, updated);
    saveMissionsStore(this.missions);
    return updated;
  }

  public async createProjectPipeline(params: {
    projectId: string;
    title: string;
    objective: string;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<{
    projectSlug: string;
    buildMission: LoopMission;
    publishMission: LoopMission;
    opportunityMission: LoopMission;
  }> {
    const slug = params.projectId.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/^-+|-+$/g, '');
    const cleanTitle = params.title.trim();
    const cleanObjective = params.objective.trim();
    const risk = params.riskLevel || 'MEDIUM';

    // 1. Ensure project physical workspace directory exists
    const workspaceRoot = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
    const projectDir = path.join(workspaceRoot, 'projects', slug);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'test'), { recursive: true });
      const pkg = {
        name: slug,
        version: '1.0.0',
        description: cleanObjective,
        main: 'src/index.js',
        scripts: {
          test: 'node --test test/*.test.js'
        },
        author: 'Gideon Autonomous Workforce',
        license: 'MIT'
      };
      fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf8');
      fs.writeFileSync(path.join(projectDir, 'README.md'), `# ${cleanTitle}\n\n${cleanObjective}\n`, 'utf8');
      fs.writeFileSync(path.join(projectDir, 'src/index.js'), `// ${cleanTitle}\n// Objective: ${cleanObjective}\n\nmodule.exports = {};\n`, 'utf8');
    }

    // 2. Instantiate BUILD Mission
    const buildMission = await this.createMission({
      loop: 'BUILD',
      projectId: slug,
      title: `${cleanTitle}: Engineering & QA Contracts`,
      objective: `Engineer ${cleanTitle} meeting zero-compromise architectural standards. Objective: ${cleanObjective}. Enforce Sentinel QA contracts and pass all unit/adversarial tests.`,
      workforce: ['atlas', 'forge', 'sentinel'],
      riskLevel: risk
    });

    // 3. Instantiate PUBLISH Mission
    const publishMission = await this.createMission({
      loop: 'PUBLISH',
      projectId: slug,
      title: `${cleanTitle}: 3D Isometric Showcase & Technical Story Pack`,
      objective: `Compile an 8-slide 3D isometric narrative deck, LinkedIn technical case study, and interactive demonstration sandbox for ${cleanTitle}.`,
      workforce: ['atlas', 'forge', 'sentinel'],
      riskLevel: risk
    });

    // 4. Instantiate OPPORTUNITIES Mission
    const opportunityMission = await this.createMission({
      loop: 'OPPORTUNITIES',
      projectId: slug,
      title: `${cleanTitle}: Enterprise Client Scout & Pipeline Outreach`,
      objective: `Scout mid-market and enterprise prospects experiencing the exact pain solved by ${cleanTitle}. Synthesize customized cryptographic proof pitches and outreach briefs.`,
      workforce: ['scout', 'atlas', 'sentinel'],
      riskLevel: 'LOW',
      constraints: 'Human operator approval strictly required before sending any outbound communications.'
    });

    return {
      projectSlug: slug,
      buildMission,
      publishMission,
      opportunityMission
    };
  }
}

export const loopMissionAdapter = new LoopMissionAdapter();
