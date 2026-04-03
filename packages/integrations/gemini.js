const env = require('../../config/env.js');

/**
 * Calls the Gemini API standard REST endpoint with the desired model and prompt.
 * Uses `gemini-2.5-flash-lite` natively.
 */
async function generateContent(promptText) {
  const model = env.GEMINI_MODEL;
  const apiKey = env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Safety check parsing
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("No candidates returned from Gemini API.");
    }

  } catch (error) {
    console.error("❌ Caught Error in gemini.js:", error.message);
    throw error;
  }
}

/**
 * Calls the Gemini text-embedding endpoint to generate a vector payload.
 */
async function generateEmbedding(text) {
  const apiKey = env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Embedding Error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error("❌ Embedding Error:", error.message);
    throw error;
  }
}

module.exports = {
  generateContent,
  generateEmbedding
};
