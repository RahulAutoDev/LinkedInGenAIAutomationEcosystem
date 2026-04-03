const env = require('../../config/env.js');

const supabaseHeaders = {
  'apikey': env.SUPABASE_KEY,
  'Authorization': `Bearer ${env.SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * Basic Timeout wrapper mapping identical rules from the generic workflow orchestrator
 */
async function fetchWithTimeout(url, options = {}) {
  const timeout = options.timeout || 8000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms: ${url}`);
    }
    throw err;
  }
}

async function markPublished(postId) {
  const url = `${env.SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`;
  const response = await fetchWithTimeout(url, {
    method: 'PATCH',
    headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify({ status: 'published' })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update status to published: ${await response.text()}`);
  }
}

async function startPublisher() {
  console.log("🚀 Serverless Publishing Pipeline Initiated...\n");
  
  // Safely poll UI-approved strings checking the `is_active` constraint explicitly
  const url = `${env.SUPABASE_URL}/rest/v1/posts?status=eq.approved&is_active=eq.true&order=approved_at.asc&limit=5`;
  
  try {
    const response = await fetchWithTimeout(url, { 
       method: 'GET', 
       headers: supabaseHeaders 
    });
    
    if (!response.ok) {
       throw new Error(`Could not fetch approved queue: ${await response.text()}`);
    }
    const posts = await response.json();
    
    if (!posts || posts.length === 0) {
      console.log("⚠️ Queue Exhaustion: No natively approved strings discovered in Supabase.\n");
      return;
    }

    for (const post of posts) {
      console.log(`========================================`);
      console.log(`📌 Emitting Post ID: ${post.id.split('-')[0]}... (v${post.version})`);
      console.log(`========================================\n`);
      
      try {
        // --- Mock LinkedIn API Integration ---
        console.log(`[LinkedIn REST Bound] Synchronizing token keys against OAuth API...`);
        console.log(`[LinkedIn Broadcaster] Initiating payload sink: "${post.content.substring(0,40)}..."`);
        
        await new Promise(r => setTimeout(r, 2000)); // Simulate async network protocol latency
        
        console.log(`✅ Broadcast Completed. Source verified.\n`);
        
        console.log(`⏳ Resolving state locks in Supabase Postgres...`);
        await markPublished(post.id);
        console.log(`✅ Node safely isolated as [PUBLISHED].\n`);
        
      } catch (err) {
        console.error(`❌ Terminal Exception resolving POST broadcast: ${err.message}\n`);
      }
    }
  } catch (error) {
    console.error(`❌ Background Dispatcher Fault: ${error.message}\n`);
  }
}

startPublisher();
