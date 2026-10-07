import { NextRequest, NextResponse } from 'next/server';
import { PortalSessionManager, PortalAuthError } from '@gideon/portal';
import { ProjectStateMachine } from '@/lib/projects/ProjectStateMachine';
import { ProjectDatabase } from '@/lib/projects/ProjectDatabase';

export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('gideon_portal_session')?.value;
    if (!cookieToken) {
      return NextResponse.json(
        { error: 'SESSION_REQUIRED', message: 'Portal session cookie required.' },
        { status: 401 }
      );
    }

    const csrfTokenHeader = req.headers.get('x-csrf-token') || '';
    const origin = req.headers.get('origin') || undefined;

    const sessionManager = new PortalSessionManager();
    const { session, project } = await sessionManager.verifySession(cookieToken, {
      requiredPermission: 'milestone:accept',
      expectedCsrfToken: csrfTokenHeader,
      origin
    });

    const db = ProjectDatabase.getInstance();

    // Log acceptance event
    await db.logEvent({
      projectId: project.id,
      eventType: 'CLIENT_MILESTONE_ACCEPTED',
      actor: 'client',
      payload: {
        shareId: session.shareId,
        acceptedAt: new Date().toISOString()
      }
    });

    // Invariant: Client acceptance transitions CLIENT_REVIEW -> CLIENT_ACCEPTED (Never straight to DEPLOYED)
    let updated = project;
    if (project.status === 'CLIENT_REVIEW') {
      updated = await ProjectStateMachine.transition(
        project.id,
        'CLIENT_ACCEPTED',
        'client',
        'Milestone deliverable accepted by client'
      );
    }

    // Check commercial settlement status
    const outstandingCents = Math.max(0, (updated.pricingCents || 0) - (updated.cashReceivedCents || 0));
    const commercialClear = outstandingCents === 0;

    return NextResponse.json({
      success: true,
      status: updated.status,
      commercialClear,
      outstandingBalanceCents: outstandingCents,
      message: commercialClear 
        ? 'Milestone deliverable accepted and fully settled.'
        : 'Milestone deliverable accepted. Commercial balance remaining before final handover.'
    });
  } catch (err: any) {
    if (err instanceof PortalAuthError) {
      const status = err.code === 'CSRF_VERIFICATION_FAILED' || err.code.includes('REVOKED') ? 403 : 401;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    return NextResponse.json({ error: 'APPROVAL_FAILED', message: err.message }, { status: 500 });
  }
}
