import { NextRequest, NextResponse } from 'next/server';
import { 
  PortalSessionManager, 
  UntrustedFeedbackSanitizer, 
  PortalAuthError,
  FeedbackValidationError 
} from '@gideon/portal';
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
    const idempotencyKey = req.headers.get('idempotency-key');
    const origin = req.headers.get('origin') || undefined;

    const sessionManager = new PortalSessionManager();
    const { session, project } = await sessionManager.verifySession(cookieToken, {
      requiredPermission: 'feedback:write',
      expectedCsrfToken: csrfTokenHeader,
      origin
    });

    const body = await req.json();

    // Composite idempotency check with request fingerprinting
    if (idempotencyKey) {
      const idemp = await sessionManager.checkFeedbackIdempotency(
        project.id,
        idempotencyKey,
        session.shareId,
        body
      );

      if (idemp.isDuplicate) {
        return NextResponse.json(idemp.cachedResponse, { status: 200 });
      }
    }

    // Sanitize untrusted input (Data, never instructions)
    const sanitized = UntrustedFeedbackSanitizer.sanitize(body);

    const db = ProjectDatabase.getInstance();

    // Log structured event
    const event = await db.logEvent({
      projectId: project.id,
      eventType: 'CLIENT_REVIEW_FEEDBACK',
      actor: 'client',
      payload: {
        shareId: session.shareId,
        areaOfConcern: sanitized.areaOfConcern,
        feedbackText: sanitized.feedbackText,
        requestedChanges: sanitized.requestedChanges,
        delimitedRepresentation: sanitized.delimitedRepresentation
      }
    });

    // Governed state transition: CLIENT_REVIEW -> REWORK_REQUESTED
    let updatedProject = project;
    if (project.status === 'CLIENT_REVIEW') {
      updatedProject = await ProjectStateMachine.transition(
        project.id,
        'REWORK_REQUESTED',
        'client',
        `Client submitted revision feedback: ${sanitized.areaOfConcern}`
      );
    }

    const responsePayload = {
      success: true,
      status: updatedProject.status,
      eventId: event.id,
      message: 'Feedback recorded for operator and workforce review.',
      feedback: {
        areaOfConcern: sanitized.areaOfConcern,
        characterCount: sanitized.rawCharacterCount,
        timestamp: sanitized.timestamp
      }
    };

    // Cache idempotency response if key provided
    if (idempotencyKey) {
      const requestHash = require('crypto')
        .createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex');

      await sessionManager.saveFeedbackIdempotency(
        project.id,
        idempotencyKey,
        session.shareId,
        requestHash,
        responsePayload
      );
    }

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: any) {
    if (err instanceof FeedbackValidationError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 });
    }
    if (err instanceof PortalAuthError) {
      const status = 
        err.code === 'IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH' ? 409 :
        err.code === 'CSRF_VERIFICATION_FAILED' || err.code.includes('REVOKED') ? 403 : 401;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    return NextResponse.json({ error: 'FEEDBACK_SUBMISSION_FAILED', message: err.message }, { status: 500 });
  }
}
