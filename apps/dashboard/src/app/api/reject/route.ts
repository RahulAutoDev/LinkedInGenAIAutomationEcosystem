import { NextResponse } from 'next/server';
import { supabaseHeaders, fetchWithTimeout } from '@/lib/supabase';

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ success: false, error: "Missing postId" }, { status: 400 });
    }

    const url = `${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`;

    const payload = {
      status: 'rejected',
      rejected_by: 'Governance Admin'
    };

    const response = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to reject post: ${await response.text()}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, post: data[0] });

  } catch (error: any) {
    console.error("POST /api/reject Internal Trace Error:", error.message);
    return NextResponse.json({ success: false, error: 'Internal Server Error: Execution exception trapped gracefully.' }, { status: 500 });
  }
}
