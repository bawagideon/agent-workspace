import { NextRequest, NextResponse } from 'next/server';
import { PortalSessionManager } from '@gideon/portal';

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const sessionManager = new PortalSessionManager();
    await sessionManager.revokeShareCredential(shareId, 'human');

    return NextResponse.json({ success: true, message: 'Portal access credential revoked immediately.' });
  } catch (err: any) {
    return NextResponse.json({ error: 'REVOCATION_FAILED', message: err.message }, { status: 500 });
  }
}
