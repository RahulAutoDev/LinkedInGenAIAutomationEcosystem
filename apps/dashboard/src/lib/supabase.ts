// Load root environment mapping if local is missing
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in Next.js environment mapping!");
}

export const supabaseHeaders = {
  'apikey': SUPABASE_KEY || '',
  'Authorization': `Bearer ${SUPABASE_KEY || ''}`,
  'Content-Type': 'application/json'
};

export async function fetchWithTimeout(url: string, options: any = {}) {
  const timeout = options.timeout || 8000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms: ${url}`);
    }
    throw err;
  }
}
