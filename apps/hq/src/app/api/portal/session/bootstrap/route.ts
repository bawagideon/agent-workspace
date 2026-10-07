import { NextRequest, NextResponse } from 'next/server';
import { PortalSessionManager, PortalAuthError } from '@gideon/portal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shareId, accessSecret } = body;

    if (!shareId || !accessSecret) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'shareId and accessSecret are required.' },
        { status: 400 }
      );
    }

    const sessionManager = new PortalSessionManager();
    const origin = req.headers.get('origin') || undefined;

    const result = await sessionManager.bootstrapSession(shareId, accessSecret, {
      origin
    });

    const response = NextResponse.json({
      success: true,
      csrfToken: result.csrfToken,
      projectId: result.projectId,
      permissions: result.permissions,
      expiresAt: result.expiresAt
    });

    // Set HttpOnly, Secure, SameSite=Lax session cookie
    response.cookies.set('gideon_portal_session', result.cookieToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(result.expiresAt)
    });

    return response;
  } catch (err: any) {
    const statusCode = 
      err instanceof PortalAuthError && (err.code === 'CREDENTIAL_REVOKED' || err.code === 'PORTAL_ACCESS_NOT_READY')
        ? 403
        : 401;

    return NextResponse.json(
      { error: err.code || 'BOOTSTRAP_FAILED', message: err.message },
      { status: statusCode }
    );
  }
}
