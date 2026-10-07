import crypto from 'crypto';
import { 
  ProjectRecord, 
  ProjectStatus, 
  PortalAccessRecord, 
  PortalSessionRecord, 
  PortalFeedbackIdempotencyRecord 
} from '@gideon/shared';
import { ProjectDatabase } from '../../../apps/hq/src/lib/projects/ProjectDatabase';

export class PortalAuthError extends Error {
  public readonly code: 
    | 'CREDENTIAL_NOT_FOUND'
    | 'CREDENTIAL_EXPIRED'
    | 'CREDENTIAL_REVOKED'
    | 'CREDENTIAL_ALREADY_USED'
    | 'INVALID_CREDENTIAL'
    | 'SESSION_REQUIRED'
    | 'SESSION_NOT_FOUND'
    | 'SESSION_EXPIRED'
    | 'SESSION_REVOKED'
    | 'PORTAL_ACCESS_REVOKED'
    | 'PORTAL_ACCESS_NOT_READY'
    | 'PROJECT_NOT_FOUND'
    | 'PERMISSION_DENIED'
    | 'CSRF_VERIFICATION_FAILED'
    | 'ORIGIN_VERIFICATION_FAILED'
    | 'IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH';

  constructor(
    code: 
      | 'CREDENTIAL_NOT_FOUND'
      | 'CREDENTIAL_EXPIRED'
      | 'CREDENTIAL_REVOKED'
      | 'CREDENTIAL_ALREADY_USED'
      | 'INVALID_CREDENTIAL'
      | 'SESSION_REQUIRED'
      | 'SESSION_NOT_FOUND'
      | 'SESSION_EXPIRED'
      | 'SESSION_REVOKED'
      | 'PORTAL_ACCESS_REVOKED'
      | 'PORTAL_ACCESS_NOT_READY'
      | 'PROJECT_NOT_FOUND'
      | 'PERMISSION_DENIED'
      | 'CSRF_VERIFICATION_FAILED'
      | 'ORIGIN_VERIFICATION_FAILED'
      | 'IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH',
    message: string
  ) {
    super(message);
    this.name = 'PortalAuthError';
    this.code = code;
  }
}

export interface CreateShareResult {
  shareId: string;
  accessSecret: string;
  expiresAt: string;
  permissions: string[];
}

export interface SessionBootstrapResult {
  cookieToken: string;
  csrfToken: string;
  projectId: string;
  permissions: string[];
  expiresAt: string;
}

export interface VerifiedPortalSession {
  session: PortalSessionRecord;
  project: ProjectRecord;
  share: PortalAccessRecord;
}

export class PortalSessionManager {
  private projectDb: ProjectDatabase;

  public static readonly APPROVED_PORTAL_STATES: ProjectStatus[] = [
    'STAGING',
    'CLIENT_REVIEW',
    'CLIENT_ACCEPTED',
    'REWORK_REQUESTED',
    'COMMERCIAL_CLEAR',
    'DEPLOY_AUTHORIZATION',
    'DEPLOYING',
    'DEPLOYMENT_FAILED',
    'DEPLOYED'
  ];

  constructor(projectDb?: ProjectDatabase) {
    this.projectDb = projectDb || ProjectDatabase.getInstance();
  }

  /**
   * Generates a new share credential for a project.
   * Stores SHA-256 hash in database; returns opaque shareId and one-time secret.
   */
  public async createShareCredential(
    projectId: string,
    options?: { ttlDays?: number; permissions?: string[]; createdBy?: string }
  ): Promise<CreateShareResult> {
    const project = await this.projectDb.getProjectById(projectId);
    if (!project) {
      throw new PortalAuthError('PROJECT_NOT_FOUND', `Project '${projectId}' not found.`);
    }

    const shareId = `share_${crypto.randomBytes(16).toString('hex')}`;
    const accessSecret = `sec_${crypto.randomBytes(32).toString('hex')}`;
    const credentialHash = crypto.createHash('sha256').update(accessSecret).digest('hex');

    const ttlDays = options?.ttlDays ?? 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000).toISOString();
    const permissions = options?.permissions ?? ['preview:read', 'feedback:write', 'milestone:accept'];

    const record: PortalAccessRecord = {
      id: shareId,
      projectId,
      credentialHash,
      permissions,
      expiresAt,
      createdBy: options?.createdBy || 'human',
      createdAt: new Date().toISOString(),
      version: 1
    };

    await this.projectDb.savePortalAccess(record);

    await this.projectDb.logEvent({
      projectId,
      eventType: 'PORTAL_ACCESS_ISSUED',
      actor: options?.createdBy || 'human',
      payload: { shareId, permissions, expiresAt }
    });

    return {
      shareId,
      accessSecret,
      expiresAt,
      permissions
    };
  }

  /**
   * Exchanges an ephemeral bootstrap secret for an authoritative HttpOnly session cookie.
   * Enforces truly one-time bootstrap (used_at) to prevent secret replay attacks.
   */
  public async bootstrapSession(
    shareId: string,
    accessSecret: string,
    options?: { origin?: string; expectedOrigin?: string }
  ): Promise<SessionBootstrapResult> {
    if (options?.origin && options?.expectedOrigin && options.origin !== options.expectedOrigin) {
      throw new PortalAuthError('ORIGIN_VERIFICATION_FAILED', 'Origin mismatch during session bootstrap.');
    }

    const share = await this.projectDb.getPortalAccess(shareId);
    if (!share) {
      throw new PortalAuthError('CREDENTIAL_NOT_FOUND', 'Portal share credential not found.');
    }

    if (share.revokedAt) {
      throw new PortalAuthError('CREDENTIAL_REVOKED', 'Portal share access has been revoked by operator.');
    }

    if (new Date() > new Date(share.expiresAt)) {
      throw new PortalAuthError('CREDENTIAL_EXPIRED', 'Portal share credential has expired.');
    }

    // Invariant: Truly one-time bootstrap credential
    if (share.usedAt) {
      throw new PortalAuthError('CREDENTIAL_ALREADY_USED', 'Portal share credential has already been used.');
    }

    // Verify secret hash via constant-time comparison
    const computedHash = crypto.createHash('sha256').update(accessSecret).digest('hex');
    const isSecretMatch = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'utf8'),
      Buffer.from(share.credentialHash, 'utf8')
    );

    if (!isSecretMatch) {
      throw new PortalAuthError('INVALID_CREDENTIAL', 'Invalid portal access secret.');
    }

    // Check project status gate
    const project = await this.projectDb.getProjectById(share.projectId);
    if (!project) {
      throw new PortalAuthError('PROJECT_NOT_FOUND', 'Bound project not found.');
    }

    if (!PortalSessionManager.APPROVED_PORTAL_STATES.includes(project.status)) {
      throw new PortalAuthError(
        'PORTAL_ACCESS_NOT_READY',
        `Project is in status '${project.status}'. Client portal access is only permitted in approved staging/review states.`
      );
    }

    // Mark credential as used
    share.usedAt = new Date().toISOString();
    await this.projectDb.savePortalAccess(share);

    // Generate opaque 256-bit session token
    const cookieToken = `gps_${crypto.randomBytes(32).toString('hex')}`;
    const sessionHash = crypto.createHash('sha256').update(cookieToken).digest('hex');
    const csrfToken = `csrf_${crypto.randomBytes(24).toString('hex')}`;

    const sessionRecord: PortalSessionRecord = {
      id: `sess_${crypto.randomBytes(16).toString('hex')}`,
      sessionHash,
      shareId,
      projectId: share.projectId,
      permissions: share.permissions,
      csrfToken,
      expiresAt: share.expiresAt,
      createdAt: new Date().toISOString()
    };

    await this.projectDb.savePortalSession(sessionRecord);

    await this.projectDb.logEvent({
      projectId: share.projectId,
      eventType: 'PORTAL_SESSION_BOOTSTRAPPED',
      actor: 'client',
      payload: { sessionId: sessionRecord.id, shareId }
    });

    return {
      cookieToken,
      csrfToken,
      projectId: share.projectId,
      permissions: share.permissions,
      expiresAt: share.expiresAt
    };
  }

  /**
   * Verifies an incoming session token against authoritative DB records.
   * Checks expiration, DB revocation, project status, permissions, and CSRF token.
   */
  public async verifySession(
    cookieToken: string,
    options?: {
      requiredPermission?: string;
      expectedCsrfToken?: string;
      origin?: string;
      expectedOrigin?: string;
    }
  ): Promise<VerifiedPortalSession> {
    if (!cookieToken || typeof cookieToken !== 'string') {
      throw new PortalAuthError('SESSION_REQUIRED', 'Missing portal session cookie.');
    }

    if (options?.origin && options?.expectedOrigin && options.origin !== options.expectedOrigin) {
      throw new PortalAuthError('ORIGIN_VERIFICATION_FAILED', 'Origin mismatch for state-changing operation.');
    }

    const sessionHash = crypto.createHash('sha256').update(cookieToken).digest('hex');
    const session = await this.projectDb.getPortalSessionByHash(sessionHash);

    if (!session) {
      throw new PortalAuthError('SESSION_NOT_FOUND', 'Portal session not found or invalid.');
    }

    if (session.revokedAt) {
      throw new PortalAuthError('SESSION_REVOKED', 'Portal session has been revoked.');
    }

    if (new Date() > new Date(session.expiresAt)) {
      throw new PortalAuthError('SESSION_EXPIRED', 'Portal session has expired.');
    }

    // Authoritative check on parent share credential
    const share = await this.projectDb.getPortalAccess(session.shareId);
    if (!share || share.revokedAt) {
      throw new PortalAuthError('PORTAL_ACCESS_REVOKED', 'Parent portal access has been revoked by operator.');
    }

    // Check project status
    const project = await this.projectDb.getProjectById(session.projectId);
    if (!project) {
      throw new PortalAuthError('PROJECT_NOT_FOUND', 'Bound project not found.');
    }

    if (!PortalSessionManager.APPROVED_PORTAL_STATES.includes(project.status)) {
      throw new PortalAuthError(
        'PORTAL_ACCESS_NOT_READY',
        `Project is in status '${project.status}'. Client portal access is suspended.`
      );
    }

    // Check permission if required
    if (options?.requiredPermission) {
      if (!session.permissions.includes(options.requiredPermission)) {
        throw new PortalAuthError(
          'PERMISSION_DENIED',
          `Session does not possess required permission '${options.requiredPermission}'.`
        );
      }
    }

    // Check CSRF token for mutations if expected
    if (options?.expectedCsrfToken) {
      const expectedBuf = Buffer.from(options.expectedCsrfToken, 'utf8');
      const actualBuf = Buffer.from(session.csrfToken, 'utf8');
      const match = expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
      if (!match) {
        throw new PortalAuthError('CSRF_VERIFICATION_FAILED', 'CSRF token verification failed.');
      }
    }

    return { session, project, share };
  }

  /**
   * Revokes a portal share credential and all its active sessions immediately in DB.
   */
  public async revokeShareCredential(shareId: string, actor: string = 'human'): Promise<void> {
    await this.projectDb.revokePortalAccess(shareId, actor);
  }

  /**
   * Idempotency handling with request fingerprinting.
   * If same key + same hash -> returns cached response.
   * If same key + different hash -> throws 409 IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH.
   */
  public async checkFeedbackIdempotency(
    projectId: string,
    idempotencyKey: string,
    shareId: string,
    payload: any
  ): Promise<{ isDuplicate: boolean; cachedResponse?: any; requestHash: string }> {
    const requestHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const existing = await this.projectDb.getFeedbackIdempotency(projectId, idempotencyKey);

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new PortalAuthError(
          'IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH',
          `Idempotency key '${idempotencyKey}' was previously used with a different request payload.`
        );
      }
      return { isDuplicate: true, cachedResponse: existing.responsePayload, requestHash };
    }

    return { isDuplicate: false, requestHash };
  }

  public async saveFeedbackIdempotency(
    projectId: string,
    idempotencyKey: string,
    shareId: string,
    requestHash: string,
    responsePayload: any
  ): Promise<void> {
    const record: PortalFeedbackIdempotencyRecord = {
      projectId,
      idempotencyKey,
      shareId,
      requestHash,
      createdAt: new Date().toISOString(),
      responsePayload
    };
    await this.projectDb.saveFeedbackIdempotency(record);
  }
}
