// ─── Gemini API Client Wrapper ───
// Shared by all agents. Loads per-agent temperature from AGENT_CONFIGS.

import { AGENT_CONFIGS, type AgentConfig } from '../types/index.js';
import { GEMINI_MODEL, GEMINI_MAX_OUTPUT_TOKENS } from '../constants/index.js';
import { logger } from './logger.js';

export interface GeminiRequest {
  agentId: string;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema?: Record<string, unknown>;
}

export interface GeminiResponse {
  text: string;
  parsed: Record<string, unknown> | null;
  tokensUsed: number;
}

export async function callGemini(request: GeminiRequest): Promise<GeminiResponse> {
  const config: AgentConfig = AGENT_CONFIGS[request.agentId] || {
    name: request.agentId,
    sovereigntyLevel: 1,
    temperature: 0.5,
    maxTokens: 2048,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: request.userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: request.systemPrompt }],
    },
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: Math.min(config.maxTokens, GEMINI_MAX_OUTPUT_TOKENS),
      topP: 0.92,
      topK: 40,
    },
  };

  if (request.jsonSchema) {
    (body.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
  }

  logger.info(`[Gemini] Calling model for agent="${config.name}" temp=${config.temperature}`);

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`[Gemini] Rate limited. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errText}`);
      }

      const json = await res.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { totalTokenCount?: number };
      };

      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const tokensUsed = json.usageMetadata?.totalTokenCount ?? 0;

      let parsed: Record<string, unknown> | null = null;
      if (request.jsonSchema) {
        try {
          parsed = JSON.parse(text);
        } catch {
          logger.warn('[Gemini] Failed to parse JSON response, returning raw text.');
        }
      }

      logger.info(`[Gemini] Success. Tokens used: ${tokensUsed}`);
      return { text, parsed, tokensUsed };
    } catch (err) {
      if (attempt === maxRetries) throw err;
      logger.warn(`[Gemini] Request failed (attempt ${attempt}/${maxRetries}): ${err}`);
    }
  }

  throw new Error('[Gemini] All retries exhausted.');
}
