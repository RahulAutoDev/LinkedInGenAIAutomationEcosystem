import { NextResponse } from 'next/server';
import { supabaseHeaders, fetchWithTimeout } from '@/lib/supabase';

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL;

  try {
    // Fetch all active posts with status = generated
    // Select post data and join with the topics table to get the original topic title
    const url = `${SUPABASE_URL}/rest/v1/posts?status=eq.generated&is_active=eq.true&select=*,topics(title)`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: supabaseHeaders,
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${await response.text()}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, posts: data });
  } catch (error: any) {
    console.error("GET /api/posts Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
