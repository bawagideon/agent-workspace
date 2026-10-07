import { NextRequest, NextResponse } from 'next/server';
import { PortalSessionManager, PublicProjectionSanitizer, PortalAuthError } from '@gideon/portal';
import { ProcessSupervisor } from '@gideon/runner';

export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('gideon_portal_session')?.value;
    if (!cookieToken) {
      return NextResponse.json(
        { error: 'SESSION_REQUIRED', message: 'Portal session cookie required.' },
        { status: 401 }
      );
    }

    const sessionManager = new PortalSessionManager();
    const { session, project } = await sessionManager.verifySession(cookieToken, {
      requiredPermission: 'preview:read'
    });

    const supervisor = ProcessSupervisor.getInstance();
    const activeProcesses = supervisor.listProcesses().filter(
      p => p.projectId === project.id && (p.status === 'RUNNING' || p.status === 'STARTING')
    );
    const hasActiveRunner = activeProcesses.length > 0;

    const sanitized = PublicProjectionSanitizer.sanitizeProject(project, { hasActiveRunner });

    return NextResponse.json({
      success: true,
      project: sanitized,
      permissions: session.permissions,
      csrfToken: session.csrfToken
    });
  } catch (err: any) {
    const statusCode = err instanceof PortalAuthError && err.code.includes('REVOKED') ? 403 : 401;
    return NextResponse.json(
      { error: err.code || 'UNAUTHORIZED', message: err.message },
      { status: statusCode }
    );
  }
}
