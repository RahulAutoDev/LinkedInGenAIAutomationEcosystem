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
    const timestamp = new Date().toISOString();

    const payload = {
      status: 'approved',
      approved_at: timestamp,
      approved_by: 'Governance Admin' // Hardcoded for single-user thesis setup
    };

    const response = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to approve post: ${await response.text()}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, post: data[0] });

  } catch (error: any) {
    console.error("POST /api/approve Internal Trace Error:", error.message);
    return NextResponse.json({ success: false, error: 'Internal Server Error: Unable to fulfill approval pipeline natively.' }, { status: 500 });
  }
}
