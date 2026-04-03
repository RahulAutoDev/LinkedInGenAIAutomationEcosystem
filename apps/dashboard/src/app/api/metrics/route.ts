import { NextResponse } from 'next/server';
import { supabaseHeaders, fetchWithTimeout } from '@/lib/supabase';

export async function GET() {
  const SUPABASE_URL = process.env.SUPABASE_URL;

  try {
    const url = `${SUPABASE_URL}/rest/v1/posts?select=status`;
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: supabaseHeaders,
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch baseline metrics: ${await response.text()}`);
    }

    const data = await response.json();
    
    const metrics = {
      generated: data.filter((p: any) => p.status === 'generated').length,
      approved: data.filter((p: any) => p.status === 'approved' || p.status === 'queued' || p.status === 'published').length,
      rejected: data.filter((p: any) => p.status === 'rejected').length,
      duplicates: 0 // Deduplication natively short-circuits prior to database insertion
    };

    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    console.error("GET /api/metrics Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
