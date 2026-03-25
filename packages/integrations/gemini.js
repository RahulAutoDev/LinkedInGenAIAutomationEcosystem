// ─── Gemini API Integration ───
// Clean, modular client for Google Gemini Pro.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Call Google Gemini Pro API with a system prompt and user prompt.
 * Returns the generated text.
 *
 * @param {Object} options
 * @param {string} options.systemPrompt - System-level instruction
 * @param {string} options.userPrompt - User message / content request
 * @param {number} [options.temperature=0.85] - Creativity level
 * @param {number} [options.maxTokens=2048] - Max output tokens
 * @returns {Promise<string>} Generated text response
 */
async function callGemini({ systemPrompt, userPrompt, temperature = 0.85, maxTokens = 2048 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('❌ GEMINI_API_KEY is not set. Add it to your .env file.');
  }

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP: 0.92,
      topK: 40,
    },
  };

  // Retry with exponential backoff on rate limits
  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const errBody = await res.text();
        const delay = Math.pow(2, attempt) * 2000;
        console.warn(`⚠️  Rate limited (429). Retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`);
        console.warn(`   Response: ${errBody.substring(0, 200)}`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 300)}`);
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokensUsed = json?.usageMetadata?.totalTokenCount || 0;

      return { text, tokensUsed };
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      console.warn(`⚠️  Attempt ${attempt} failed: ${err.message}`);
    }
  }

  throw new Error('All retries exhausted.');
}

module.exports = { callGemini };
