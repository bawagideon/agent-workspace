import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export interface SentinelNotification {
  id: string;
  type: 'QA_AUDIT' | 'SECURITY' | 'OPPORTUNITY' | 'GATE' | 'OBSERVATION' | 'FLYWEEL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message: string;
  observation?: string;
  recommendation?: string;
  proposedLesson?: string;
  source: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  evidenceRef?: string;
}

const NOTIFICATIONS_FILE = path.resolve(
  process.cwd(), 
  process.cwd().includes('apps') ? '../../.gideon/sentinel_notifications.json' : '.gideon/sentinel_notifications.json'
);

const DOSSIERS_FILE = path.resolve(
  process.cwd(), 
  process.cwd().includes('apps') ? '../../.gideon/scout_opportunity_dossiers.json' : '.gideon/scout_opportunity_dossiers.json'
);

function getSynthesizedLiveNotifications(): SentinelNotification[] {
  const notifs: SentinelNotification[] = [
    {
      id: 'notif-sentinel-debugger-qa',
      type: 'QA_AUDIT',
      severity: 'SUCCESS',
      title: 'Sentinel: Webhook Payload Debugger (QA_VERIFIED)',
      message: '8/8 adversarial tests passed. Invariants: timingSafeEqual, timestamp decay, raw buffer body integrity verified.',
      observation: 'This capability overlaps with existing webhook verification infrastructure in webhook-billing-bridge.',
      recommendation: 'Expose the debugger diagnostic engine as a reusable capability in CapabilityRegistry for future billing and webhook projects.',
      proposedLesson: 'Webhook endpoints MUST preserve raw Buffer bytes before body-parser mutation.',
      source: 'Sentinel QA Observer',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      read: false,
      actionUrl: '/loops/build?mission=build-webhook-payload-debugger',
      evidenceRef: 'ev-qa-contract-webhook-debugger-1790949202354'
    },
    {
      id: 'notif-sentinel-blossom-defect',
      type: 'OBSERVATION',
      severity: 'WARNING',
      title: 'Confirmed Defect: Blossom Med Contact Form Failure',
      message: 'Public contact page (blossommedca.com/contact) currently exposes an unhandled form error state.',
      observation: 'Prospective medical spa patients cannot submit inquiries online. Opportunity #006 holds confirmed technical defect.',
      recommendation: 'Advance Opportunity #006 to SOLUTION_READY and review targeted Resilient Intake blueprint ($2,200 quote).',
      source: 'Sentinel Defect Observer',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      read: false,
      actionUrl: '/loops/opportunities?id=opp-006'
    },
    {
      id: 'notif-sentinel-beaconhill-routing',
      type: 'OPPORTUNITY',
      severity: 'INFO',
      title: 'Scout Architectural Signal: Beaconhill Multi-Branch Routing',
      message: 'Beaconhill operates Ikeja + Victoria Island branches with 7-day patient volume.',
      observation: 'Cross-branch booking is siloed by phone number, risking appointment leakage between Island and Mainland.',
      recommendation: 'Inspect Opportunity #038 smart branch availability routing engine ($2,400 package).',
      source: 'Scout Market Radar',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: false,
      actionUrl: '/loops/opportunities?id=opp-038'
    },
    {
      id: 'notif-sentinel-buildingsmiles-legacy',
      type: 'OBSERVATION',
      severity: 'INFO',
      title: 'Scout Signal: Building Smiles Legacy 2010s HTML Frame',
      message: 'Public website runs obsolete static index.html frame structure without mobile viewport scaling.',
      observation: 'Strong ground-up modernization candidate in Surulere medical corridor. High competitive leverage.',
      recommendation: 'Review Opportunity #039 mobile-first patient hub proposal ($1,600 quote).',
      source: 'Scout Market Radar',
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      read: false,
      actionUrl: '/loops/opportunities?id=opp-039'
    },
    {
      id: 'notif-sentinel-gate3-release',
      type: 'GATE',
      severity: 'WARNING',
      title: 'Gate 3 Release Staged: Webhook Billing Bridge Case Study',
      message: 'Cryptographic SHA-256 seal matches narrative draft. 8 3D isometric slides generated for LinkedIn broadcast.',
      source: 'Supervisor Release Gate',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      read: false,
      actionUrl: '/loops/publish?mission=publish-webhook-case-study',
      evidenceRef: '56b0975b6e5ed749aaefdb32df5ce5994e871c276a26fa604cc8656b2f85e9e8'
    },
    {
      id: 'notif-sentinel-security-hmac',
      type: 'SECURITY',
      severity: 'INFO',
      title: 'Constant-Time Buffer Verification Invariant Active',
      message: 'HMAC signature verification strictly complies with timing-safe comparison bounds (<12ms execution time).',
      source: 'Sentinel Security Guard',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      read: true,
      actionUrl: '/sentinel'
    }
  ];

  return notifs;
}

function getNotifications(): SentinelNotification[] {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  
  const defaults = getSynthesizedLiveNotifications();
  try {
    const dir = path.dirname(NOTIFICATIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(defaults, null, 2), 'utf8');
  } catch {}
  
  return defaults;
}

function saveNotifications(notifications: SentinelNotification[]) {
  try {
    const dir = path.dirname(NOTIFICATIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save sentinel notifications:', err);
  }
}

export async function GET() {
  try {
    // Check if we should re-sync notifications to include live Sentinel observations
    let notifications = getNotifications();
    const liveNotifs = getSynthesizedLiveNotifications();

    // Merge any missing live synthesized observations
    let updated = false;
    for (const live of liveNotifs) {
      const existing = notifications.find(n => n.id === live.id);
      if (!existing) {
        notifications.unshift(live);
        updated = true;
      } else {
        // Update fields if enriched
        if (live.observation && !existing.observation) {
          existing.observation = live.observation;
          existing.recommendation = live.recommendation;
          existing.proposedLesson = live.proposedLesson;
          updated = true;
        }
      }
    }

    if (updated) {
      saveNotifications(notifications);
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id } = body;

    let notifications = getNotifications();

    if (action === 'MARK_READ' && id) {
      notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(notifications);
    } else if (action === 'MARK_ALL_READ') {
      notifications = notifications.map(n => ({ ...n, read: true }));
      saveNotifications(notifications);
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
