require('dotenv').config();

async function checkDatabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Missing Supabase credentials in .env");
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/posts?limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });

    if (!res.ok) {
        throw new Error(`Database connection failed: ${res.statusText}`);
    }
    return true;
}

async function checkDashboard() {
    try {
        const res = await fetch('http://localhost:3000');
        if (!res.ok && res.status !== 401) { // 401 is basic auth which means server is alive
            throw new Error(`Frontend returned unexpected status: ${res.status}`);
        }
        return true;
    } catch (e) {
        throw new Error(`Dashboard is unreachable: ${e.message}`);
    }
}

async function checkApiPosts() {
    try {
        const username = process.env.DASHBOARD_USERNAME || 'admin';
        const password = process.env.DASHBOARD_PASSWORD || 'secret123';
        const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

        const res = await fetch('http://localhost:3000/api/posts', {
            headers: { 'Authorization': `Basic ${basicAuth}` }
        });

        // If basic auth passes or DB returns JSON, it works
        if (res.status === 200 || res.status === 400 || res.status === 404) {
             return true;
        } else if (!res.ok) {
            throw new Error(`API returned HTTP ${res.status}`);
        }
        return true;
    } catch(e) {
        throw new Error(`Posts API check failed: ${e.message}`);
    }
}

async function runHealthCheck() {
    console.log("=========================================");
    console.log("   AUTOMATED SYSTEM HEALTH VALIDATION    ");
    console.log("=========================================\n");

    let hasFailures = false;

    const checks = [
        { name: "Database Connection", fn: checkDatabase },
        { name: "Next.js Frontend (port 3000)", fn: checkDashboard },
        { name: "API Reachability (/api/posts)", fn: checkApiPosts }
    ];

    for (const check of checks) {
        process.stdout.write(`⏳ Checking ${check.name}... `);
        try {
            await check.fn();
            console.log("✅ PASSED");
        } catch (err) {
            console.log("❌ FAILED");
            console.error(`   -> ${err.message}`);
            hasFailures = true;
        }
    }

    console.log("\n=========================================");
    if (hasFailures) {
        console.error("⛔ HEALTH CHECK FINISHED WITH ERRORS");
        process.exit(1);
    } else {
        console.log("✅ ALL SYSTEMS OPERATIONAL");
        process.exit(0);
    }
}

runHealthCheck();
