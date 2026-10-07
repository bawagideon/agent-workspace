import { NextRequest, NextResponse } from 'next/server';
import { PortalSessionManager, PortalAuthError } from '@gideon/portal';
import { ProcessSupervisor } from '@gideon/runner';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return handleProxyRequest(req, await params, 'GET');
}

export async function HEAD(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return handleProxyRequest(req, await params, 'HEAD');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return handleProxyRequest(req, await params, 'POST');
}

async function handleProxyRequest(
  req: NextRequest, 
  params: { path?: string[] }, 
  method: 'GET' | 'HEAD' | 'POST'
) {
  // 1. Block SSRF destination poisoning attempts in query params
  const url = req.nextUrl;
  const ssrfParams = ['port', 'target', 'host', 'url', 'dest', 'destination'];
  for (const p of ssrfParams) {
    if (url.searchParams.has(p)) {
      return NextResponse.json(
        { error: 'SSRF_VIOLATION', message: `Client-supplied destination parameter '${p}' is strictly forbidden.` },
        { status: 400 }
      );
    }
  }

  // 2. Reject WebSocket / Upgrade attempts (Staging preview is HTTP only)
  if (req.headers.get('upgrade')?.toLowerCase() === 'websocket') {
    return NextResponse.json(
      { error: 'WEBSOCKETS_DISABLED', message: 'WebSockets and HMR are disabled in sandboxed staging previews.' },
      { status: 400 }
    );
  }

  // 3. Verify Portal Session Cookie
  const cookieToken = req.cookies.get('gideon_portal_session')?.value;
  if (!cookieToken) {
    return NextResponse.json(
      { error: 'SESSION_REQUIRED', message: 'Portal authentication session cookie is required to access preview.' },
      { status: 401 }
    );
  }

  const sessionManager = new PortalSessionManager();
  let verified;
  try {
    verified = await sessionManager.verifySession(cookieToken, {
      requiredPermission: 'preview:read'
    });
  } catch (err: any) {
    const status = err instanceof PortalAuthError && err.code.includes('REVOKED') ? 403 : 401;
    return NextResponse.json(
      { error: err.code || 'UNAUTHORIZED', message: err.message },
      { status }
    );
  }

  const { project } = verified;

  // 4. Derive destination strictly from server-side active runner lease
  const supervisor = ProcessSupervisor.getInstance();
  const activeProcesses = supervisor.listProcesses().filter(
    p => p.projectId === project.id && (p.status === 'RUNNING' || p.status === 'STARTING')
  );

  if (activeProcesses.length === 0) {
    return NextResponse.json(
      { 
        error: 'PREVIEW_OFFLINE', 
        message: `Staging preview runner for project '${project.name}' is currently offline. Please contact operator.` 
      },
      { status: 503 }
    );
  }

  const activeProcess = activeProcesses[0];
  const targetPort = activeProcess.port;

  // Strict SSRF guard: port must be in 4100-4199
  if (targetPort < 4100 || targetPort > 4199) {
    return NextResponse.json(
      { error: 'INVALID_RUNNER_PORT', message: 'Assigned runner port is out of permitted range.' },
      { status: 500 }
    );
  }

  // Build target URL
  const subpath = params.path ? params.path.join('/') : '';
  const queryString = url.search ? url.search : '';
  const targetUrl = `http://127.0.0.1:${targetPort}/${subpath}${queryString}`;

  // Forward request
  try {
    const upstreamHeaders: Record<string, string> = {
      'Host': `127.0.0.1:${targetPort}`,
      'Accept': req.headers.get('accept') || '*/*',
      'User-Agent': req.headers.get('user-agent') || 'Gideon-Portal-Preview-Proxy/1.0'
    };

    if (req.headers.has('content-type')) {
      upstreamHeaders['Content-Type'] = req.headers.get('content-type')!;
    }

    let body: any = undefined;
    if (method === 'POST') {
      body = await req.arrayBuffer();
    }

    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body,
      redirect: 'manual'
    });

    const responseHeaders = new Headers();
    // Invariant: Enforce CSP and frame ancestors
    responseHeaders.set('Content-Security-Policy', "frame-ancestors 'self'");
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Referrer-Policy', 'no-referrer');
    responseHeaders.set('Cache-Control', 'no-store, must-revalidate');

    const contentType = upstreamResponse.headers.get('content-type') || 'text/html';
    responseHeaders.set('Content-Type', contentType);

    // Defense-in-depth: Secret redaction for textual payloads
    if (contentType.includes('text') || contentType.includes('json') || contentType.includes('javascript')) {
      let text = await upstreamResponse.text();
      // Redact known secret patterns
      text = text.replace(/sk_live_[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]');
      text = text.replace(/ghp_[a-zA-Z0-9]{20,}/g, '[REDACTED_TOKEN]');
      text = text.replace(/SUPABASE_SERVICE_ROLE_KEY=[^\s&"']+/g, 'SUPABASE_SERVICE_ROLE_KEY=[REDACTED]');
      text = text.replace(/STRIPE_SECRET_KEY=[^\s&"']+/g, 'STRIPE_SECRET_KEY=[REDACTED]');
      text = text.replace(/PORTAL_HMAC_SECRET=[^\s&"']+/g, 'PORTAL_HMAC_SECRET=[REDACTED]');

      return new NextResponse(text, {
        status: upstreamResponse.status,
        headers: responseHeaders
      });
    }

    // Binary / non-textual responses
    const binaryData = await upstreamResponse.arrayBuffer();
    return new NextResponse(binaryData, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  } catch (proxyErr: any) {
    return NextResponse.json(
      { error: 'PROXY_FORWARD_FAILED', message: `Failed to proxy to staging runner: ${proxyErr.message}` },
      { status: 502 }
    );
  }
}
