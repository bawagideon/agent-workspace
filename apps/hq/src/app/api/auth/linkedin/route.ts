import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { oauthStateCache } from '@/lib/linkedinAuth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const checkStatus = searchParams.get('status');

  // If requesting connection status
  if (checkStatus === 'true') {
    const hasToken = !!process.env.LINKEDIN_ACCESS_TOKEN;
    const hasCredentials = !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    return NextResponse.json({
      success: true,
      configured: hasCredentials,
      connected: hasToken,
      clientIdConfigured: !!process.env.LINKEDIN_CLIENT_ID
    });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, error: 'LINKEDIN_CLIENT_ID not configured in apps/hq/.env.local' },
      { status: 400 }
    );
  }

  // Generate cryptographic state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  oauthStateCache.set(state, Date.now() + 300000); // 5 min TTL

  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';
  const scope = encodeURIComponent('openid profile w_member_social');

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${state}&scope=${scope}`;

  return NextResponse.redirect(authUrl);
}
