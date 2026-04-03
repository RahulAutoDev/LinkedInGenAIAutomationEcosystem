import React from 'react';

export default async function DashboardPage() {
  // Fetch from the local API endpoint (must provide absolute URL for SSR)
  // For simplicity in a local app, we can just call our fetch to Supabase directly in the Server Component!
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  let posts = [];
  let dashboardMetrics = { generated: 0, approved: 0, rejected: 0 };
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/posts?status=in.(generated,approved,publish_failed,ready_to_publish_manual)&is_active=eq.true&select=*,topics(title)&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_KEY || '',
        'Authorization': `Bearer ${SUPABASE_KEY || ''}`
      },
      cache: 'no-store' // Always fetch fresh
    });
    if (res.ok) {
      posts = await res.json();
    }

    const metricRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=status`, {
      headers: {
        'apikey': SUPABASE_KEY || '',
        'Authorization': `Bearer ${SUPABASE_KEY || ''}`
      },
      cache: 'no-store'
    });
    
    if (metricRes.ok) {
      const metricData = await metricRes.json();
      dashboardMetrics.generated = metricData.filter((p: any) => p.status === 'generated').length;
      dashboardMetrics.approved = metricData.filter((p: any) => ['approved', 'queued', 'published', 'ready_to_publish_manual'].includes(p.status)).length;
      dashboardMetrics.rejected = metricData.filter((p: any) => p.status === 'rejected').length;
    }

  } catch (err) {
    console.error("Fetch Posts Error:", err);
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] font-sans selection:bg-[#001333] selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#ffffff]/70 backdrop-blur-xl border-b border-[#c5c6d2]/20 px-8 py-6 shadow-[0_12px_40px_-10px_rgba(28,27,27,0.06)] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#001333]">Governance Ledger</h1>
          <p className="text-sm text-[#444650] mt-1 font-medium">Production Architecture v2</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-xs font-bold text-[#444650] uppercase tracking-wider">Total</span>
             <span className="text-lg font-bold text-[#001333]">{dashboardMetrics.generated + dashboardMetrics.approved + dashboardMetrics.rejected}</span>
          </div>
          <div className="flex flex-col items-end border-l border-[#c5c6d2]/30 pl-6">
             <span className="text-xs font-bold text-[#0f2750] uppercase tracking-wider">Approved</span>
             <span className="text-lg font-bold text-[#495e8a]">{dashboardMetrics.approved}</span>
          </div>
          <div className="flex flex-col items-end border-l border-[#ba1a1a]/20 pl-6">
             <span className="text-xs font-bold text-[#93000a] uppercase tracking-wider">Rejected</span>
             <span className="text-lg font-bold text-[#ba1a1a]">{dashboardMetrics.rejected}</span>
          </div>
          
          <div className="border-l border-[#c5c6d2]/30 h-8 ml-2"></div>

          <span className="px-4 py-1.5 rounded-full bg-[#0f2750] text-[#ffffff] text-xs font-semibold uppercase tracking-wider">
            {posts.length} Pending
          </span>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-[#f6f3f2] rounded-2xl border border-[#c5c6d2]/20">
            <h2 className="text-xl font-semibold text-[#1c1b1b]">No pending reviews.</h2>
            <p className="text-[#58657a] mt-2">The generative engine queue is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Client Component for the Interactive Card
import { ClientPostCard as PostCard } from './components/ClientPostCard';
