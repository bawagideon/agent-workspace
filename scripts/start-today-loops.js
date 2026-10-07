const fs = require('fs');
const path = require('path');

const GIDEON_DIR = path.resolve(process.cwd(), '.gideon');
if (!fs.existsSync(GIDEON_DIR)) {
  fs.mkdirSync(GIDEON_DIR, { recursive: true });
}

const MISSIONS_FILE = path.join(GIDEON_DIR, 'loop_missions.json');
const CONVERSATIONS_FILE = path.join(GIDEON_DIR, 'conversations.json');

const NOW = new Date('2026-10-01T16:00:00.000Z').toISOString();

// Define Today's Fresh Missions
const TODAY_MISSIONS = [
  {
    id: 'build-20261001-distributed-mutex',
    loop: 'BUILD',
    title: 'Distributed Mutex & Stream Ingestion (Sub-5ms Cluster Mutex)',
    objective: 'Implement distributed Redis/memory atomic mutex primitives for high-volume webhook streams with sub-5ms p99 latency, zero-race concurrency fallbacks, and 100% Sentinel QA test verification.',
    projectId: 'webhook-billing-bridge',
    status: 'RUNNING',
    conversationId: 'conv-build-20261001-distributed-mutex',
    workforce: ['atlas', 'forge', 'sentinel'],
    riskLevel: 'MEDIUM',
    constraints: 'Zero duplicate executions allowed under 20-thread concurrency assault',
    contextRevision: 1,
    filesTouched: [
      'projects/webhook-billing-bridge/src/security/hmac.ts',
      'projects/webhook-billing-bridge/src/mutex/distributedMutex.ts',
      'projects/webhook-billing-bridge/test/bridge.test.ts'
    ],
    evidenceRef: 'ev-qa-contract-1790547094069-41f1e2d3',
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 'publish-20261001-b2b-onboarding',
    loop: 'PUBLISH',
    title: 'B2B Microservice & Stripe Onboarding 3D Story Release',
    objective: 'Generate 8-slide 3D architectural deck, technical narrative, and client demonstration for the audited B2B Checkout Automation service running on Port 4102.',
    projectId: 'b2b-automation-service',
    status: 'RUNNING',
    conversationId: 'conv-publish-20261001-b2b-showcase',
    workforce: ['atlas', 'forge', 'sentinel'],
    riskLevel: 'MEDIUM',
    contextRevision: 1,
    artifacts: [
      { name: 'B2B Automation Microservice (Port 4102)', url: 'http://localhost:4102', type: 'MICROSERVICE' },
      { name: 'Interactive Assault & Checkout Sandbox', url: 'http://localhost:4102', type: 'HTML_DEMO' },
      { name: 'Sentinel Adversarial Audit Contract', url: 'ev-qa-contract-1790494558627-9cf7345d', type: 'EVIDENCE' }
    ],
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 'opp-20261001-fintech-saas-outreach',
    loop: 'OPPORTUNITIES',
    title: 'Q4 Enterprise SaaS Billing Hardening Campaign',
    objective: 'Scout 10 target mid-market B2B SaaS platforms suffering Stripe retry race conditions; synthesize tailored cryptographic proof briefs and cold outbound pitch packages.',
    projectId: 'webhook-billing-bridge',
    status: 'RUNNING',
    conversationId: 'conv-opp-20261001-fintech-outreach',
    workforce: ['scout', 'atlas', 'sentinel'],
    riskLevel: 'LOW',
    constraints: 'Human approval strictly required for outbound outreach',
    contextRevision: 1,
    createdAt: NOW,
    updatedAt: NOW
  }
];

// Seed Conversations
const SEED_CONVERSATIONS = {
  'conv-build-20261001-distributed-mutex': {
    id: 'conv-build-20261001-distributed-mutex',
    title: 'Distributed Mutex & Stream Ingestion',
    status: 'ACTIVE',
    contextType: 'WORKSPACE',
    contextId: 'webhook-billing-bridge',
    projectId: 'webhook-billing-bridge',
    createdAt: NOW,
    updatedAt: NOW,
    messages: [
      {
        id: `msg-build-${Date.now()}-1`,
        conversationId: 'conv-build-20261001-distributed-mutex',
        role: 'assistant',
        agentId: 'gideon',
        content: `Good morning Operator. All 3 Mission Loop Engines are initialized fresh for today, **October 1, 2026**.\n\n**Build Mission Active: Distributed Mutex & Stream Ingestion**\n• Project: \`webhook-billing-bridge\`\n• Assigned Workforce: **Atlas** (Strategic DAG), **Forge** (Engineering), **Sentinel** (Independent QA Observer)\n• Primary Objective: Extend our proven in-memory atomic mutex to support clustered Redis replication with sub-5ms p99 latency, zero-race concurrency fallbacks, and 100% Sentinel QA contracts.\n\nForge is standing by to inspect capabilities or execute code changes. What is our first engineering milestone today?`,
        createdAt: NOW
      }
    ]
  },
  'conv-publish-20261001-b2b-showcase': {
    id: 'conv-publish-20261001-b2b-showcase',
    title: 'B2B Microservice & Stripe Onboarding 3D Story Release',
    status: 'ACTIVE',
    contextType: 'WORKSPACE',
    contextId: 'b2b-automation-service',
    projectId: 'b2b-automation-service',
    createdAt: NOW,
    updatedAt: NOW,
    messages: [
      {
        id: `msg-pub-${Date.now()}-1`,
        conversationId: 'conv-publish-20261001-b2b-showcase',
        role: 'assistant',
        agentId: 'forge',
        content: `Publishing Studio initialized for **October 1, 2026**.\n\n**Mission Active: B2B Microservice 3D Showcase & Case Study**\n• Project: \`b2b-automation-service\` (Port 4102 - ONLINE)\n• Evidence Ref: \`ev-qa-contract-1790494558627-9cf7345d\` (100% Sentinel Scorecard)\n• Deliverables: 8-slide 3D isometric narrative deck, interactive checkout sandbox link, and client demonstration deck.\n\nI can render fresh 3D slides, draft the technical LinkedIn article, or prepare the release bundle for Gate 3 review.`,
        createdAt: NOW
      }
    ]
  },
  'conv-opp-20261001-fintech-outreach': {
    id: 'conv-opp-20261001-fintech-outreach',
    title: 'Q4 Enterprise SaaS Billing Hardening Campaign',
    status: 'ACTIVE',
    contextType: 'WORKSPACE',
    contextId: 'webhook-billing-bridge',
    projectId: 'webhook-billing-bridge',
    createdAt: NOW,
    updatedAt: NOW,
    messages: [
      {
        id: `msg-opp-${Date.now()}-1`,
        conversationId: 'conv-opp-20261001-fintech-outreach',
        role: 'assistant',
        agentId: 'scout',
        content: `Scout Opportunity Radar initialized for **October 1, 2026**.\n\n**Mission Active: Q4 Enterprise SaaS Billing Hardening Campaign**\n• Target: Mid-Market SaaS CTOs & Lead Backend Engineers ($5,000–$15,000 implementation packages)\n• Value Proposition: Guaranteed 0.00% duplicate charges under Stripe retry assaults via verified atomic idempotency architecture.\n• Proof Artifact: \`github.com/bawagideon/webhook-billing-bridge\` with browser assault simulator.\n\n3 qualified high-conversion prospects and personalized pitch packages are ready in the right pane for your review. Remember: human approval is strictly required before sending any outbound communication.`,
        createdAt: NOW
      }
    ]
  }
};

function run() {
  console.log('================================================================');
  console.log('  STARTING GIDEON HQ 3 CORE MISSIONS LOOPS — OCTOBER 1, 2026    ');
  console.log('================================================================');

  let existingMissions = [];
  if (fs.existsSync(MISSIONS_FILE)) {
    try {
      existingMissions = JSON.parse(fs.readFileSync(MISSIONS_FILE, 'utf8'));
    } catch {
      existingMissions = [];
    }
  }

  const todayIds = new Set(TODAY_MISSIONS.map(m => m.id));
  const remainingMissions = existingMissions.filter(m => !todayIds.has(m.id));
  const mergedMissions = [...TODAY_MISSIONS, ...remainingMissions];

  fs.writeFileSync(MISSIONS_FILE, JSON.stringify(mergedMissions, null, 2), 'utf8');
  console.log(`✓ Instantiated 3 fresh today missions in .gideon/loop_missions.json (Total: ${mergedMissions.length})`);

  let existingConversations = {};
  if (fs.existsSync(CONVERSATIONS_FILE)) {
    try {
      existingConversations = JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf8'));
    } catch {
      existingConversations = {};
    }
  }

  const mergedConversations = {
    ...existingConversations,
    ...SEED_CONVERSATIONS
  };

  fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(mergedConversations, null, 2), 'utf8');
  console.log(`✓ Seeded today's interactive workforce conversations in .gideon/conversations.json`);

  console.log('\nTODAY MISSIONS READY:');
  console.log('1. [BUILD]         http://localhost:3000/loops/build?mission=build-20261001-distributed-mutex');
  console.log('2. [PUBLISH]       http://localhost:3000/loops/publish?mission=publish-20261001-b2b-onboarding');
  console.log('3. [OPPORTUNITIES] http://localhost:3000/loops/opportunities?mission=opp-20261001-fintech-saas-outreach');
  console.log('================================================================');
}

run();
