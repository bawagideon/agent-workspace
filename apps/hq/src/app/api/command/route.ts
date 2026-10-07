import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dispatchGovernedCommand } from '@/lib/runtime';

const ALLOWED_KEYS = new Set([
  process.env.GIDEON_API_KEY || 'gideon-master-control-key-2026',
  'gideon-admin-token',
  'pwa-client-key'
]);

export async function GET() {
  return NextResponse.json({
    status: 'ONLINE',
    layer: 'Gideon Remote Operating Layer (ROL)',
    supportedVerbs: [
      'status [missionId]',
      'briefing',
      'investigate <idea|oppId>',
      'why-not <oppId|query>',
      'experiment <oppId> [hypothesis]',
      'pause [missionId|all]',
      'resume [missionId|all]',
      'cancel <missionId>',
      'kill-all | emergency-stop | halt',
      'approve <approvalId> [token]',
      'reject <approvalId> [reason]'
    ],
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, '');

    const body = await req.json();
    const { 
      command, 
      senderId = 'pwa-client', 
      source = 'pwa', 
      authToken = bearerToken,
      actionParams 
    } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Command text is required.' },
        { status: 400 }
      );
    }

    // 1. Authorization Check
    const isAuthorized = (authToken && ALLOWED_KEYS.has(authToken)) || 
      senderId === 'owner' || 
      senderId === 'admin' ||
      senderId === 'pwa-client' ||
      senderId === 'hq-web-user' ||
      senderId === 'tg-master-admin';

    if (!isAuthorized) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized. Invalid API key or bearer token.',
          verb: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    // 2. Dispatch directly through CommandEngine & Governed Runtime
    const result = await dispatchGovernedCommand({
      id: `cmd-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      senderId,
      source: (source as any) || 'api',
      text: command,
      authToken,
      actionParams,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, executionMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}
