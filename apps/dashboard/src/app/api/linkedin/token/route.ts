import { NextResponse } from 'next/server';
import { supabaseHeaders, fetchWithTimeout } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    // Exactly matches the URI registered in the LinkedIn Developer portal
    const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json({ success: false, error: "Missing LinkedIn OAuth secrets in environment variables" }, { status: 500 });
    }

    // LinkedIn requires x-www-form-urlencoded for the token exchange
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    console.log(`[LinkedIn OAuth] Exchanging code for access token...`);

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LinkedIn OAuth] Token Exchange Error:", errorText);
      return NextResponse.json({ success: false, error: "Token exchange failed", details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const accessToken = data.access_token;
    
    // 2. Fetch User Identity (sub) to prevent hardcoded URNs
    console.log(`[LinkedIn OAuth] Executing Identity /v2/userinfo...`);
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userRes.ok) {
        console.error("[LinkedIn OAuth] Failed to fetch User_Info. Check token scopes.");
        return NextResponse.json({ success: false, error: "Identity Fetch Failed" }, { status: userRes.status });
    }

    const userData = await userRes.json();
    const userUrn = `urn:li:person:${userData.sub}`;

    console.log("[LinkedIn OAuth] Associated Target Identity String:", userUrn);

    // 3. Store Identity Array within Supabase DB replacing static .env dependencies
    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const dbPayload = {
        access_token: accessToken,
        expires_in: data.expires_in,
        scope: data.scope,
        person_urn: userUrn
    };

    const dbRes = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/linkedin_auth`, {
        method: 'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
        body: JSON.stringify(dbPayload)
    });

    if (!dbRes.ok) {
        console.error("Supabase Database Token Insertion Failure!");
    }
    
    // Log the successful retrieval natively
    console.log("[LinkedIn OAuth] Exchange Successful!");
    console.log(`Access Token: [HIDDEN_FOR_SECURITY - STORED IN DB]`);
    console.log(`Expires In: ${data.expires_in} seconds`);

    // Strictly return the generic token map state securely
    return NextResponse.json({
      success: true,
      person_urn: userUrn,
      expires_in: data.expires_in
    });

  } catch (error: any) {
    console.error("[LinkedIn OAuth] Internal Execution Error:", error.message);
    return NextResponse.json({ success: false, error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
