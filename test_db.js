const { Client } = require('pg');
require('dotenv').config();

async function testDb() {
  // Extract and clean the DB URL to ensure quotes aren't causing issues
  const rawUrl = process.env.DATABASE_URL || '';
  const cleanUrl = rawUrl.replace(/^"|"$/g, '');

  console.log("📡 Attempting to connect to PostgreSQL...");
  console.log(`URL Host Target: ${cleanUrl.split('@')[1]?.split('/')[0]}\n`);

  const client = new Client({ 
    connectionString: cleanUrl, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to Supabase PostgreSQL.");
    
    console.log("⏳ Initializing 'topics' schema...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Verified / Created 'topics' table.");
    
    // Test a quick query to prove it
    const res = await client.query('SELECT count(*) FROM topics;');
    console.log(`📊 Current Topics in Database: ${res.rows[0].count}`);

  } catch(e) {
    console.error("❌ Database Test Failed:");
    console.error(e.message);
  } finally {
    await client.end();
  }
}

testDb();
