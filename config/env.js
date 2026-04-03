require('dotenv').config();

const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  QDRANT_URL: process.env.QDRANT_URL,
  QDRANT_API_KEY: process.env.QDRANT_API_KEY,
  SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.82,
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
  GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME || 'Sheet1'
};

if (!env.GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is not defined in the environment.");
  process.exit(1);
}

module.exports = env;
