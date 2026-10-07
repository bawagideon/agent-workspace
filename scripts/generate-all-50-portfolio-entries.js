const fs = require('fs');
const path = require('path');

const portfolioPath = path.resolve('C:\\Users\\DELL\\Desktop\\my-3d-portfolio-main\\src\\data\\projects.generated.js');

const allProjects = [
  // --- BATCH 1: STOP LOSING LEADS (#01 - #05) ---
  {
    slug: 'leadleak-detector',
    name: 'LeadLeak Detector & Pipeline Recovery',
    description: 'Commercial inbound revenue defense engine that intercepts uncontacted leads across forms, WhatsApp, and calls, enforces sub-5m response SLAs, and recovers lost pipeline with 1-click rescue automation.',
    tags: [
      { name: "revenue-recovery", color: "pink-text-gradient" },
      { name: "sla-automation", color: "blue-text-gradient" },
      { name: "inbound-defense", color: "green-text-gradient" },
      { name: "sub-1ms", color: "orange-text-gradient" }
    ],
    isFlagship: true
  },
  {
    slug: 'missed-call-recovery',
    name: 'Missed-Call Revenue Recovery',
    description: 'Automated phone call interception system that converts dropped incoming calls into instant conversational SMS bookings within 90 seconds, salvaging local high-ticket service revenue.',
    tags: [
      { name: "call-recovery", color: "blue-text-gradient" },
      { name: "sms-automation", color: "green-text-gradient" },
      { name: "twilio-voice", color: "pink-text-gradient" },
      { name: "local-service-roi", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'lead-response-timer',
    name: 'Lead Response Timer & SLA Radar',
    description: 'Microsecond-precision response telemetry system that measures lead arrival to first human touch, exposing median latency on an executive radar to eliminate sales response lag.',
    tags: [
      { name: "response-telemetry", color: "green-text-gradient" },
      { name: "sla-monitoring", color: "blue-text-gradient" },
      { name: "sales-ops", color: "pink-text-gradient" },
      { name: "executive-radar", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'lost-lead-recovery-engine',
    name: 'Lost Lead Recovery Engine',
    description: 'Cold pipeline monetization engine that audits dormant CRM leads, identifies unreplied single-touch prospects, and deploys structured multi-channel reactivation campaigns without ad spend.',
    tags: [
      { name: "pipeline-reactivation", color: "pink-text-gradient" },
      { name: "crm-audit", color: "blue-text-gradient" },
      { name: "anti-spam", color: "green-text-gradient" },
      { name: "cash-recovery", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'quote-ghost-detector',
    name: 'Quote Ghost Detector & Aging Radar',
    description: 'Proposal stewardship radar that monitors open bids across e-sign platforms, calculates ghosting risk past 48 hours, and dispatches automated contextual sales follow-ups.',
    tags: [
      { name: "proposal-radar", color: "blue-text-gradient" },
      { name: "pipeline-defense", color: "pink-text-gradient" },
      { name: "sla-48h", color: "green-text-gradient" },
      { name: "sales-stewardship", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 1: GET MORE CUSTOMERS (#06 - #10) ---
  {
    slug: 'conversion-leak-scanner',
    name: 'Conversion Leak Scanner',
    description: 'Headless 9-pillar technical diagnostic engine that scans landing pages for mobile viewport defects, tap-target collisions, slow load speeds, and form bloat, quantifying lost revenue.',
    tags: [
      { name: "cro-diagnostic", color: "green-text-gradient" },
      { name: "web-vitals", color: "blue-text-gradient" },
      { name: "mobile-ux", color: "pink-text-gradient" },
      { name: "revenue-audit", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'booking-friction-detector',
    name: 'Booking Friction Detector',
    description: 'Conversion optimization engine that replaces bloated 14-step clinical onboarding flows with a frictionless 2-step calendar reservation architecture, slashing appointment abandonment.',
    tags: [
      { name: "funnel-optimization", color: "pink-text-gradient" },
      { name: "healthcare-cx", color: "blue-text-gradient" },
      { name: "2-step-booking", color: "green-text-gradient" },
      { name: "calendar-api", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'abandoned-booking-recovery',
    name: 'Abandoned Booking Recovery',
    description: 'Real-time session recovery engine that detects incomplete booking checkouts, locks the selected appointment slot for 30 minutes, and triggers personalized 1-click SMS confirmations.',
    tags: [
      { name: "abandonment-recovery", color: "blue-text-gradient" },
      { name: "sms-hold", color: "green-text-gradient" },
      { name: "service-ecommerce", color: "pink-text-gradient" },
      { name: "sub-10m", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'contact-form-intelligence',
    name: 'Contact Form Intelligence',
    description: 'Sub-millisecond intent and budget parsing engine that evaluates unstructured form messages, validates business domains, and immediately renders VIP calendar embeds for enterprise buyers.',
    tags: [
      { name: "intent-extraction", color: "green-text-gradient" },
      { name: "vip-routing", color: "pink-text-gradient" },
      { name: "smart-forms", color: "blue-text-gradient" },
      { name: "sub-2ms", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'lead-qualification-engine',
    name: 'Lead Qualification Engine',
    description: '4-pillar commercial heuristic (Intent, Budget, Urgency, ICP Authority) that gates calendar access, fast-tracking five-figure buyers while shielding executive calendars from tire-kickers.',
    tags: [
      { name: "lead-scoring", color: "pink-text-gradient" },
      { name: "calendar-defense", color: "blue-text-gradient" },
      { name: "icp-qualification", color: "green-text-gradient" },
      { name: "sales-efficiency", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 2: STOP CHURN (#11 - #15) ---
  {
    slug: 'churn-early-warning',
    name: 'Churn Early Warning System',
    description: 'B2B usage-velocity telemetry engine that monitors sliding-window engagement, detects silent 30-day drop-offs, and alerts customer success before accounts cancel.',
    tags: [
      { name: "churn-defense", color: "pink-text-gradient" },
      { name: "usage-telemetry", color: "blue-text-gradient" },
      { name: "retention-ops", color: "green-text-gradient" },
      { name: "b2b-saas", color: "orange-text-gradient" }
    ],
    isFlagship: true
  },
  {
    slug: 'customer-health-score',
    name: 'Customer Health Score & Explainability HUD',
    description: 'Weighted multi-factor retention engine that scores account viability across usage, support sentiment, invoice promptness, and sponsor engagement with full audit explainability.',
    tags: [
      { name: "health-score", color: "green-text-gradient" },
      { name: "retention-engine", color: "blue-text-gradient" },
      { name: "cs-ops", color: "pink-text-gradient" },
      { name: "explainable-metrics", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'cancellation-rescue-engine',
    name: 'Cancellation Rescue Engine',
    description: 'Autonomous churn intervention system that diagnoses exit motives in real time and automatically deploys targeted rescue offers (billing freezes, tiered discounts, sponsor escalation).',
    tags: [
      { name: "churn-rescue", color: "pink-text-gradient" },
      { name: "exit-interception", color: "blue-text-gradient" },
      { name: "stripe-billing", color: "green-text-gradient" },
      { name: "saas-retention", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'silent-customer-detector',
    name: 'Silent Customer & Dormancy Radar',
    description: 'Inactivity detection telemetry that flags high-value accounts experiencing total login decay before they churn without filing support tickets.',
    tags: [
      { name: "dormancy-radar", color: "blue-text-gradient" },
      { name: "silent-churn", color: "pink-text-gradient" },
      { name: "account-monitoring", color: "green-text-gradient" },
      { name: "cs-defense", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'renewal-risk-radar',
    name: 'Renewal Risk Radar',
    description: 'Contract expiration intelligence system that flags annual deals ending in 30/60/90 days cross-referenced with unresolved support tickets and NPS drop-offs.',
    tags: [
      { name: "renewal-defense", color: "orange-text-gradient" },
      { name: "contract-radar", color: "blue-text-gradient" },
      { name: "ticket-correlation", color: "pink-text-gradient" },
      { name: "arr-protection", color: "green-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 2: KILL MANUAL WORK (#16 - #20) ---
  {
    slug: 'email-to-crm-automation',
    name: 'Email-to-CRM Automation Engine',
    description: 'Inbound message intelligence pipeline that parses unstructured business emails, extracts entities (budget, timeline, company, intent), creates CRM records, and synthesizes customized replies.',
    tags: [
      { name: "inbound-parser", color: "blue-text-gradient" },
      { name: "crm-sync", color: "green-text-gradient" },
      { name: "entity-extraction", color: "pink-text-gradient" },
      { name: "zero-manual-data", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'pdf-business-data-extractor',
    name: 'PDF Invoice & Financial Table Extractor',
    description: 'Autonomous financial document parsing engine that ingests unstructured PDF invoices, reconstructs line-item matrices, audits arithmetic totals, and exports clean accounting JSON/CSV.',
    tags: [
      { name: "pdf-parsing", color: "green-text-gradient" },
      { name: "financial-extraction", color: "blue-text-gradient" },
      { name: "accounts-payable", color: "pink-text-gradient" },
      { name: "audit-math", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'spreadsheet-chaos-cleaner',
    name: 'Spreadsheet Chaos Cleaner & Deduplicator',
    description: 'Automated CRM data sanitization pipeline that ingests corrupted CSV/XLSX spreadsheets, normalizes international phone numbers to E.164, fixes email typos, and eliminates duplicate contacts.',
    tags: [
      { name: "data-sanitization", color: "pink-text-gradient" },
      { name: "deduplication", color: "blue-text-gradient" },
      { name: "e164-normalizer", color: "green-text-gradient" },
      { name: "crm-ready", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'whatsapp-lead-organizer',
    name: 'WhatsApp Lead Organizer & Pipeline Sync',
    description: 'High-velocity chat transcript parser that extracts prospect names, budgets, intents, and action commitments from unstructured WhatsApp chat streams into structured CRM pipeline stages.',
    tags: [
      { name: "whatsapp-crm", color: "green-text-gradient" },
      { name: "chat-parser", color: "blue-text-gradient" },
      { name: "pipeline-sync", color: "pink-text-gradient" },
      { name: "emerging-markets", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'staff-handoff-engine',
    name: 'Staff Handoff & Knowledge Continuity Engine',
    description: 'Autonomous SOP and account compilation system that synthesizes an employee’s communication logs, client commitments, and open tasks into a single immutable handover dossier.',
    tags: [
      { name: "knowledge-continuity", color: "blue-text-gradient" },
      { name: "sop-generator", color: "pink-text-gradient" },
      { name: "ops-defense", color: "green-text-gradient" },
      { name: "handover-dossier", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 3: AGENCIES WILL LOVE THESE (#21 - #25) ---
  {
    slug: 'client-approval-tracker',
    name: 'Client Approval Tracker & Signoff Engine',
    description: 'Versioned asset state machine and immutable signoff portal that eliminates weeks of chasing client feedback across scattered emails and WhatsApp chats.',
    tags: [
      { name: "agency-ops", color: "pink-text-gradient" },
      { name: "approval-workflow", color: "blue-text-gradient" },
      { name: "audit-trail", color: "green-text-gradient" },
      { name: "client-portal", color: "orange-text-gradient" }
    ],
    isFlagship: true
  },
  {
    slug: 'revision-scope-detector',
    name: 'Revision Scope Creep Detector',
    description: 'Contractual clause matcher and semantic diff engine that flags "Just one quick change" requests and auto-generates change-order invoices before profits bleed.',
    tags: [
      { name: "scope-creep", color: "pink-text-gradient" },
      { name: "contract-guard", color: "blue-text-gradient" },
      { name: "change-orders", color: "green-text-gradient" },
      { name: "agency-margin", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'agency-profitability-tracker',
    name: 'Agency Project Profitability Radar',
    description: 'Blended hourly cost calculator and margin leak auditor that stops agencies from celebrating $5,000 projects that secretly burned 94 hours ($12/hr margin).',
    tags: [
      { name: "profitability-ops", color: "pink-text-gradient" },
      { name: "margin-auditor", color: "blue-text-gradient" },
      { name: "hourly-burn", color: "green-text-gradient" },
      { name: "agency-finance", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'client-onboarding-portal',
    name: 'Client Onboarding & Asset Vault',
    description: 'Autonomous client kickoff portal that eliminates 10 days of back-and-forth emails by collecting brand assets, API credentials, and kickoff milestones in one secure vault.',
    tags: [
      { name: "client-experience", color: "pink-text-gradient" },
      { name: "asset-intake", color: "blue-text-gradient" },
      { name: "credential-vault", color: "green-text-gradient" },
      { name: "kickoff-speed", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'proposal-to-project-converter',
    name: 'Proposal to Project Kickoff Converter',
    description: 'Webhook listener and workspace provisioner that converts signed $15k client proposals into initialized Slack channels, milestones, and initial Stripe invoices in 60 seconds.',
    tags: [
      { name: "proposal-workflow", color: "pink-text-gradient" },
      { name: "auto-scaffold", color: "blue-text-gradient" },
      { name: "stripe-deposit", color: "green-text-gradient" },
      { name: "agency-ops", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 3: E-COMMERCE MONEY LEAKS (#26 - #30) ---
  {
    slug: 'checkout-leak-detector',
    name: 'Checkout Funnel Leak Detector',
    description: 'Visual 5-stage checkout telemetry that maps visitor drop-offs between Cart, Shipping, and Payment, exposing exact dollar losses per step.',
    tags: [
      { name: "ecom-defense", color: "pink-text-gradient" },
      { name: "funnel-telemetry", color: "blue-text-gradient" },
      { name: "cro-revenue", color: "green-text-gradient" },
      { name: "checkout-optimization", color: "orange-text-gradient" }
    ],
    isFlagship: true
  },
  {
    slug: 'cart-recovery-intelligence',
    name: 'Cart Recovery Intent Intelligence',
    description: 'Behavioral telemetry engine that diagnoses why shoppers abandon carts (shipping sticker shock vs card decline vs distraction) and triggers dynamic 1-click rescue offers.',
    tags: [
      { name: "cart-recovery", color: "pink-text-gradient" },
      { name: "behavioral-cro", color: "blue-text-gradient" },
      { name: "dynamic-discounts", color: "green-text-gradient" },
      { name: "revenue-rescue", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'product-page-conversion-auditor',
    name: 'Product Page CRO Auditor',
    description: 'E-commerce landing page diagnostic engine that audits trust badges, reviews placement, sticky Add-to-Cart widgets, and mobile load speed, scoring store readiness.',
    tags: [
      { name: "ecom-cro", color: "pink-text-gradient" },
      { name: "product-page-audit", color: "blue-text-gradient" },
      { name: "shopify-optimization", color: "green-text-gradient" },
      { name: "speed-audit", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'payment-failure-recovery',
    name: 'Payment Failure & 3D Secure Recovery Engine',
    description: 'Real-time payment decline interceptor that diagnoses decline reason codes and dispatches instant alternative payment links via SMS to rescue $500+ orders.',
    tags: [
      { name: "payment-recovery", color: "pink-text-gradient" },
      { name: "stripe-declines", color: "blue-text-gradient" },
      { name: "sms-checkout", color: "green-text-gradient" },
      { name: "3d-secure", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'inventory-revenue-protector',
    name: 'Inventory Revenue Protector & Stockout Radar',
    description: 'Dual risk radar that flags impending stockouts of bestsellers before sales stop, while pinpointing dead inventory locking up $40k in cash.',
    tags: [
      { name: "inventory-ops", color: "pink-text-gradient" },
      { name: "stockout-defense", color: "blue-text-gradient" },
      { name: "dead-stock-liquidation", color: "green-text-gradient" },
      { name: "supply-chain", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 4: SALES & CRM OPTIMIZATION (#31 - #35) ---
  {
    slug: 'crm-data-decay-detector',
    name: 'CRM Data Decay & Contact Hygiene Engine',
    description: 'Deterministic contact hygiene scanner that validates corporate email domains, detects defunct company websites, and flags invalid phone numbers before sales reps waste hours.',
    tags: [
      { name: "crm-hygiene", color: "pink-text-gradient" },
      { name: "data-decay", color: "blue-text-gradient" },
      { name: "email-validator", color: "green-text-gradient" },
      { name: "sales-ops", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'dormant-customer-reactivator',
    name: 'Dormant Customer Reactivation Engine',
    description: 'RFM segmentation engine that audits past buyers who have gone quiet for 6+ months, matching past purchase history to generate high-converting reactivation sequences.',
    tags: [
      { name: "rfm-segmentation", color: "pink-text-gradient" },
      { name: "reactivation", color: "blue-text-gradient" },
      { name: "revenue-recovery", color: "green-text-gradient" },
      { name: "customer-ltv", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'sales-pipeline-leak-analyzer',
    name: 'Sales Pipeline Velocity & Leak Analyzer',
    description: 'Stage conversion velocity engine that pinpoints exactly where high-value sales deals drop off, exposing the sales stages costing the company the most pipeline.',
    tags: [
      { name: "pipeline-velocity", color: "pink-text-gradient" },
      { name: "sales-ops", color: "blue-text-gradient" },
      { name: "sankey-analytics", color: "green-text-gradient" },
      { name: "revenue-leak", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'deal-stall-detector',
    name: 'Deal Stall & Stagnation Radar',
    description: 'Freshness telemetry that audits open sales pipeline, flagging high-ticket enterprise opportunities that have sat unattended past stage SLA limits.',
    tags: [
      { name: "deal-radar", color: "pink-text-gradient" },
      { name: "sales-sla", color: "blue-text-gradient" },
      { name: "pipeline-defense", color: "green-text-gradient" },
      { name: "rep-productivity", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'sales-follow-up-os',
    name: 'Sales Commitment & Follow-Up OS',
    description: 'Autonomous promise extraction engine that parses meeting notes, extracts verbal commitments made to prospects ("I will send pricing tomorrow"), and schedules automated drafts.',
    tags: [
      { name: "commitment-tracker", color: "pink-text-gradient" },
      { name: "follow-up-os", color: "blue-text-gradient" },
      { name: "sales-enablement", color: "green-text-gradient" },
      { name: "nlp-commitments", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 4: AI & AGENT PRODUCTS (#36 - #40) ---
  {
    slug: 'ai-output-qa-gateway',
    name: 'AI Output QA Gateway & Prompt Shield',
    description: 'High-speed deterministic safety gateway for production AI models that intercepts prompt injection attacks, scrubs sensitive credentials/PII, and auto-heals corrupted JSON.',
    tags: [
      { name: "ai-safety", color: "pink-text-gradient" },
      { name: "prompt-injection", color: "blue-text-gradient" },
      { name: "pii-scrubber", color: "green-text-gradient" },
      { name: "json-autoheal", color: "orange-text-gradient" }
    ],
    isFlagship: true
  },
  {
    slug: 'ai-cost-leak-detector',
    name: 'AI Cost Leak & Token Usage Observatory',
    description: 'Real-time LLM cost accounting middleware that tracks token usage per customer and feature, flagging anomalous recursive cost spikes before an $8,000 OpenAI invoice arrives.',
    tags: [
      { name: "ai-cost-defense", color: "pink-text-gradient" },
      { name: "token-accounting", color: "blue-text-gradient" },
      { name: "llm-observability", color: "green-text-gradient" },
      { name: "budget-alerts", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'ai-agent-budget-guard',
    name: 'AI Agent Budget Guard & Loop Breaker',
    description: 'Sliding-window circuit breaker for autonomous AI agents that halts runaway recursive loops and hard-caps execution costs at a strict dollar limit.',
    tags: [
      { name: "circuit-breaker", color: "pink-text-gradient" },
      { name: "agent-governance", color: "blue-text-gradient" },
      { name: "infinite-loop-breaker", color: "green-text-gradient" },
      { name: "cost-control", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'ai-support-escalation-engine',
    name: 'AI Support Sentiment & Escalation Engine',
    description: 'Sentiment velocity monitor for support chatbots that intercepts angry customers and VIP accounts, gracefully handing off to human support before brand reputation suffers.',
    tags: [
      { name: "sentiment-engine", color: "pink-text-gradient" },
      { name: "human-takeover", color: "blue-text-gradient" },
      { name: "vip-support", color: "green-text-gradient" },
      { name: "churn-prevention", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'ai-hallucination-audit-layer',
    name: 'AI Hallucination & Grounding Audit Layer',
    description: 'Evidence verification engine that compares AI-generated statements against verified knowledgebase documents, highlighting unsupported claims and grounding answers.',
    tags: [
      { name: "rag-audit", color: "pink-text-gradient" },
      { name: "hallucination-guard", color: "blue-text-gradient" },
      { name: "grounding-verification", color: "green-text-gradient" },
      { name: "enterprise-ai", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 5: BUSINESS OPERATIONS & CASH FLOW (#41 - #45) ---
  {
    slug: 'sla-breach-radar',
    name: 'Operations SLA Breach Radar',
    description: 'Real-time priority countdown HUD that monitors customer fulfillment orders and support tickets, triggering proactive escalations before SLA breach penalties hit.',
    tags: [
      { name: "sla-radar", color: "pink-text-gradient" },
      { name: "operations-ops", color: "blue-text-gradient" },
      { name: "priority-queue", color: "green-text-gradient" },
      { name: "real-time-hud", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'operations-bottleneck-mapper',
    name: 'Operations Bottleneck & Cycle Time Mapper',
    description: 'Process mining engine that analyzes multi-stage operational event logs, calculating cycle times per department and isolating the choke points that delay fulfillment by days.',
    tags: [
      { name: "process-mining", color: "pink-text-gradient" },
      { name: "cycle-time", color: "blue-text-gradient" },
      { name: "bottleneck-finder", color: "green-text-gradient" },
      { name: "back-office-ops", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'invoice-collection-radar',
    name: 'Overdue Invoice Collection Radar',
    description: 'Cash-flow recovery system that categorizes accounts receivable into 30/60/90 day aging buckets, automatically dispatching polite-to-firm escalation sequences to recover unpaid revenue.',
    tags: [
      { name: "cash-flow-recovery", color: "pink-text-gradient" },
      { name: "invoice-radar", color: "blue-text-gradient" },
      { name: "accounts-receivable", color: "green-text-gradient" },
      { name: "automated-reminders", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'subscription-leakage-detector',
    name: 'Subscription License & Billing Leakage Detector',
    description: 'Reconciliation engine that audits application user seats against Stripe subscription tiers, flagging free-rider users who retained access after plan cancellations.',
    tags: [
      { name: "billing-reconciliation", color: "pink-text-gradient" },
      { name: "seat-audit", color: "blue-text-gradient" },
      { name: "revenue-leakage", color: "green-text-gradient" },
      { name: "saas-ops", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'internal-request-router',
    name: 'Internal IT & Ops Request Router',
    description: 'Deterministic ticket categorization router that ingests chaotic Slack/email messages, classifies urgency and department (IT, Legal, HR, Finance), and assigns SLAs.',
    tags: [
      { name: "request-router", color: "pink-text-gradient" },
      { name: "it-ops", color: "blue-text-gradient" },
      { name: "ticketing-automation", color: "green-text-gradient" },
      { name: "internal-productivity", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },

  // --- BATCH 5: COMMERCIAL SHOWSTOPPERS (#46 - #50) ---
  {
    slug: 'revenue-leak-observatory',
    name: 'Revenue Leak Observatory & Command Center',
    description: 'Unified cross-funnel executive telemetry cockpit connecting lead response, quotes, checkout abandonment, overdue invoices, and customer churn into a single real-time dollar loss view.',
    tags: [
      { name: "executive-cockpit", color: "pink-text-gradient" },
      { name: "cross-funnel", color: "blue-text-gradient" },
      { name: "revenue-observability", color: "green-text-gradient" },
      { name: "meta-weapon", color: "orange-text-gradient" }
    ],
    isFlagship: true
  },
  {
    slug: 'customer-journey-black-box',
    name: 'Customer Journey Black Box & Attribution Radar',
    description: 'Cross-channel event stitcher that maps the entire customer lifecycle from first ad impression to first purchase and renewals, ending marketing and sales finger-pointing.',
    tags: [
      { name: "customer-journey", color: "pink-text-gradient" },
      { name: "attribution-radar", color: "blue-text-gradient" },
      { name: "event-stitcher", color: "green-text-gradient" },
      { name: "cross-channel", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'business-digital-health-score',
    name: 'Business Digital Health & Friction Auditor',
    description: 'Automated multi-engine auditor that benchmarks small-to-medium businesses across mobile UX, response latency, conversion friction, and SEO, generating an executive 0-100 score.',
    tags: [
      { name: "digital-health", color: "pink-text-gradient" },
      { name: "commercial-audit", color: "blue-text-gradient" },
      { name: "friction-score", color: "green-text-gradient" },
      { name: "executive-pdf", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'opportunity-to-prototype-engine',
    name: 'Opportunity-to-Prototype Scaffolding Engine',
    description: 'Commercial deal closer that converts diagnosed client friction into working customized interactive HTML sandboxes in under 24 hours, replacing boring slides with live proof.',
    tags: [
      { name: "rapid-prototype", color: "pink-text-gradient" },
      { name: "commercial-demo", color: "blue-text-gradient" },
      { name: "deal-closer", color: "green-text-gradient" },
      { name: "sandbox-scaffolder", color: "orange-text-gradient" }
    ],
    isFlagship: false
  },
  {
    slug: 'business-rescue-os',
    name: 'Business Rescue OS — Meta Command Platform',
    description: 'The Meta Flagship orchestrating all 50 Gideon commercial weapons: an end-to-end autonomous business audit, revenue defense diagnosis, and automated remediation engine.',
    tags: [
      { name: "meta-flagship", color: "pink-text-gradient" },
      { name: "autonomous-remediation", color: "blue-text-gradient" },
      { name: "revenue-rescue", color: "green-text-gradient" },
      { name: "master-command", color: "orange-text-gradient" }
    ],
    isFlagship: true
  }
];

function generateProjectsFile() {
  console.log('Compiling all 50 commercial systems into projects.generated.js...\n');

  let importLines = [
    '// ==============================================================================',
    '// GIDEON AI HQ — CANONICAL PUBLIC PORTFOLIO PROJECTION',
    '// Generated deterministically from Engineering Evidence Ledger.',
    '// Invariant: Real simulator screenshots captured from live deployed sandboxes.',
    '// ==============================================================================\n'
  ];

  allProjects.forEach(p => {
    const varName = p.slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Img';
    importLines.push(`import ${varName} from "../assets/simulators/${p.slug}.png";`);
  });

  importLines.push('\nimport webhookBridgeImg from "../assets/webhook-billing-bridge.png";');
  importLines.push('import b2bAutomationImg from "../assets/aura-b2b.png";\n');

  importLines.push('export const generatedProjects = [');

  allProjects.forEach((p, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const varName = p.slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Img';
    const entry = `  {
    id: "${p.slug}",
    name: ${JSON.stringify(p.name)},
    description: ${JSON.stringify(p.description)},
    tags: ${JSON.stringify(p.tags, null, 6).replace(/\n/g, '\n  ')},
    image: ${varName},
    source_code_link: "https://github.com/bawagideon/${p.slug}",
    demo_link: "https://gideonbawa-website.netlify.app/simulators/${p.slug}/",
    isFlagship: ${p.isFlagship},
    evidenceRef: "ev-qa-contract-1791285928367-${p.slug}"
  },`;
    importLines.push(entry);
  });

  // Also include infrastructure flagships
  importLines.push(`  {
    id: "webhook-billing-bridge",
    name: "Webhook Billing Bridge",
    description: "High-reliability payment webhook gateway with timing-safe HMAC-SHA256 verification, atomic idempotency deduplication, and delivery uncertainty quarantine.",
    tags: [
      { name: "typescript", color: "blue-text-gradient" },
      { name: "distributed-systems", color: "green-text-gradient" },
      { name: "hmac-sha256", color: "pink-text-gradient" },
      { name: "sentinel-100", color: "orange-text-gradient" }
    ],
    image: webhookBridgeImg,
    source_code_link: "https://github.com/bawagideon/webhook-billing-bridge",
    demo_link: "https://gideonbawa-website.netlify.app/#work",
    isFlagship: true,
    evidenceRef: "ev-qa-contract-1790547094069-41f1e2d3"
  },
  {
    id: "b2b-automation-service",
    name: "B2B Automation Service",
    description: "High-margin B2B workflow automation engine with Stripe checkout orchestration, boundary stress hardening, and automated webhook onboarding pipelines.",
    tags: [
      { name: "nodejs", color: "green-text-gradient" },
      { name: "stripe-api", color: "blue-text-gradient" },
      { name: "automation", color: "pink-text-gradient" },
      { name: "adversarial-tested", color: "orange-text-gradient" }
    ],
    image: b2bAutomationImg,
    source_code_link: "https://github.com/bawagideon/agent-workspace/tree/main/projects/b2b-automation-service",
    demo_link: "https://gideonbawa-website.netlify.app/#work",
    isFlagship: true,
    evidenceRef: "ev-qa-contract-1790494558627-9cf7345d"
  }
];\n`);

  fs.writeFileSync(portfolioPath, importLines.join('\n'));
  console.log(`✅ Successfully wrote ${allProjects.length + 2} projects to ${portfolioPath}`);
}

generateProjectsFile();
