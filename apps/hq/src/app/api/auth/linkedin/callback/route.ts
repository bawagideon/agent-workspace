import { NextResponse } from 'next/server';
import { oauthStateCache } from '@/lib/linkedinAuth';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return NextResponse.json(
      { success: false, error, description: errorDescription },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { success: false, error: 'Missing code or state in OAuth callback' },
      { status: 400 }
    );
  }

  // Verify state CSRF
  const expires = oauthStateCache.get(state);
  if (!expires || Date.now() > expires) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired OAuth state token (CSRF failure)' },
      { status: 403 }
    );
  }
  oauthStateCache.delete(state);

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { success: false, error: 'LinkedIn credentials not configured on server' },
      { status: 500 }
    );
  }

  try {
    // 1. Server-side POST token exchange
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.json(
        { success: false, error: 'Failed to exchange authorization code', details: tokenData },
        { status: 500 }
      );
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    // 2. Fetch authenticated member identity via UserInfo
    let memberUrn = '';
    let memberName = '';
    try {
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userData = await userRes.json();
      memberUrn = userData.sub ? `urn:li:person:${userData.sub}` : '';
      memberName = userData.name || `${userData.given_name || ''} ${userData.family_name || ''}`.trim();
    } catch {}

    // 3. Persist connection credentials to local secure storage
    const vaultPath = path.resolve(process.cwd(), '.gideon/linkedin_vault.json');
    const vaultDir = path.dirname(vaultPath);
    if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });

    const connectionRecord = {
      connectedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (expiresIn || 5184000) * 1000).toISOString(),
      accessToken,
      memberUrn,
      memberName,
      scopes: ['w_member_social', 'openid', 'profile']
    };

    fs.writeFileSync(vaultPath, JSON.stringify(connectionRecord, null, 2), 'utf8');

    // Also update runtime process environment variable for active session
    process.env.LINKEDIN_ACCESS_TOKEN = accessToken;
    process.env.LINKEDIN_MEMBER_URN = memberUrn;

    // Redirect to Approvals Center or Showcase Hub with success toast
    return NextResponse.redirect('http://localhost:3000/showcase?linkedin=connected');
  } catch (err: any) {
    console.error('[LinkedIn OAuth Exchange Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
