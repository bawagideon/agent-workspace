import { NextRequest, NextResponse } from 'next/server';
import { PortalSessionManager } from '@gideon/portal';
import { ProjectDatabase } from '@/lib/projects/ProjectDatabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const sessionManager = new PortalSessionManager();
    const result = await sessionManager.createShareCredential(id, {
      ttlDays: body.ttlDays,
      permissions: body.permissions,
      createdBy: 'human'
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const shareUrl = `${proto}://${host}/portal/${result.shareId}#access=${result.accessSecret}`;

    return NextResponse.json({
      success: true,
      shareId: result.shareId,
      accessSecret: result.accessSecret,
      shareUrl,
      expiresAt: result.expiresAt,
      permissions: result.permissions
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'SHARE_CREATION_FAILED', message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = ProjectDatabase.getInstance();
    const list = await db.listPortalAccess(id);

    return NextResponse.json({ success: true, credentials: list });
  } catch (err: any) {
    return NextResponse.json({ error: 'FETCH_FAILED', message: err.message }, { status: 500 });
  }
}
