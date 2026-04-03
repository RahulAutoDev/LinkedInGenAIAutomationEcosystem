import { NextResponse } from 'next/server';
import { supabaseHeaders, fetchWithTimeout } from '@/lib/supabase';

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
  const LINKEDIN_PERSON_URN = process.env.LINKEDIN_PERSON_URN; // usually "urn:li:person:XXXXX"

  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ success: false, error: "Missing postId" }, { status: 400 });
    }

    // 1. Fetch Post Payload from Supabase
    const dbRes = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}&select=content,hashtags,diagram`, {
      method: 'GET',
      headers: supabaseHeaders
    });

    if (!dbRes.ok) throw new Error("Could not map backend item payload");
    const dbPosts = await dbRes.json();
    const targetPost = dbPosts[0];
    
    // Attempt parse of hashtags gracefully depending on Postgres representation
    let hashText = '';
    const hashArray = typeof targetPost.hashtags === 'string' ? JSON.parse(targetPost.hashtags) : targetPost.hashtags;
    if (Array.isArray(hashArray)) {
      hashText = '\\n\\n' + hashArray.join(' ');
    }

    const textContent = `${targetPost.content}${hashText}`;

    // 2. Fetch Dynamic OAuth Constraints natively replacing ENV masks
    let linkedInSecret = null;
    let linkedInUrn = null;

    try {
      const authRes = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/linkedin_auth?select=*&order=created_at.desc&limit=1`, {
          method: 'GET',
          headers: supabaseHeaders
      });
      if (authRes.ok) {
          const authData = await authRes.json();
          if (authData && authData.length > 0) {
              linkedInSecret = authData[0].access_token;
              linkedInUrn = authData[0].person_urn;
          }
      }
    } catch(err) {
      console.error("[LinkedIn Fetch Auth] Silent Network Exception", err);
    }

    const timestamp = new Date().toISOString();

    // 3. Automated Fallback Copes protecting Pipeline Network Flow
    if (!linkedInSecret || !linkedInUrn) {
        console.warn(`[LinkedIn Integration] Access token or URN missing. Re-routing to graceful Fallback Mode...`);
        
        await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify({
                status: 'ready_to_publish_manual',
                published_at: timestamp
            })
        });

        // Drop execution and immediately yield payloads returning manual flows
        return NextResponse.json({ 
            success: true, 
            mode: 'manual',
            status: 'ready_to_publish_manual',
            content: textContent,
            diagram: targetPost.diagram
        });
    }

    // 4. Transmit to LinkedIn if auth is valid
    console.log(`\n[LinkedIn Integration] Commencing Publishing API: ${postId}`);
    const linkedInPayload = {
      author: linkedInUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: textContent
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    console.log("Publish Payload:", linkedInPayload);
    
    const linkedInResponse = await fetchWithTimeout('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linkedInSecret}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(linkedInPayload)
    });

    // Timestamp is previously defined at the function root level
    if (!linkedInResponse.ok) {
        let errorData;
        try {
          errorData = await linkedInResponse.json();
        } catch {
          errorData = await linkedInResponse.text();
        }
        
        const statusCode = linkedInResponse.status;
        
        console.error("Publish Error FULL:", {
          message: "LinkedIn API HTTP Error",
          response: errorData,
          status: statusCode,
          stack: new Error().stack
        });
        
        // Log Failure back into DB
        await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
            method: 'PATCH',
            headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
            body: JSON.stringify({
                status: 'publish_failed',
                publish_error: typeof errorData === 'string' ? errorData : JSON.stringify(errorData),
                published_at: timestamp
            })
        });

        // Return exact diagnostics explicitly requested
        return NextResponse.json({ 
          error: "publish_failed", 
          message: errorData,
          status_code: statusCode || "unknown"
        }, { status: statusCode });
    }

    const linkedInResult = await linkedInResponse.json();
    console.log("Publish Success:", linkedInResult);

    // 3. Document Successful Broadcast inside the Database
    const updateBody = {
      status: 'published',
      published_at: timestamp,
      publish_response: JSON.stringify(linkedInResult)
    };

    const finalRes = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(updateBody)
    });

    if (!finalRes.ok) throw new Error("Could not record successful state safely back to Supabase");
    const recordedPost = await finalRes.json();

    return NextResponse.json({ success: true, post: recordedPost[0] });

  } catch (error: any) {
    console.error("Publish Error FULL:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    return NextResponse.json({ 
      error: "publish_failed", 
      message: error.message,
      status_code: error.response?.status || 500
    }, { status: error.response?.status || 500 });
  }
}
