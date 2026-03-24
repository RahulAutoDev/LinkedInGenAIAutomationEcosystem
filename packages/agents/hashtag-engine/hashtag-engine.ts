// ─── Hashtag Engine Agent ───
// Sovereignty Level 2 (Advisory): Generates recommendations only.

import { HashtagEngineInputSchema, type HashtagEngineInput, type HashtagEngineOutput } from './schema.js';
import { callGemini } from '../../shared/utils/gemini.js';
import { logger } from '../../shared/utils/logger.js';
import { MAX_HASHTAGS, MIN_HASHTAGS } from '../../shared/constants/index.js';

const AGENT_ID = 'hashtag-engine';

export class HashtagEngine {
  async execute(rawInput: unknown): Promise<HashtagEngineOutput> {
    const input = HashtagEngineInputSchema.parse(rawInput);
    logger.info(`Generating hashtags for topic: "${input.topic}"`, AGENT_ID);

    const userPrompt = `
Analyze the following LinkedIn post and generate ${MIN_HASHTAGS}-${MAX_HASHTAGS} high-relevance, trending hashtags.

Topic: ${input.topic}
Category: ${input.category}
Post Content:
${input.postBody}

REQUIREMENTS:
- Each hashtag must start with #
- Prioritize tags with high search volume and professional relevance
- Mix broad reach tags (#AI, #Leadership) with niche precision tags (#NeuromorphicComputing)
- No generic filler tags

Return JSON with:
- hashtags: array of hashtag strings (3-5 items)
- reasoning: array of strings explaining why each hashtag was chosen
    `.trim();

    const response = await callGemini({
      agentId: AGENT_ID,
      systemPrompt: 'You are a LinkedIn SEO and hashtag optimization specialist.',
      userPrompt,
      jsonSchema: {},
    });

    if (response.parsed) {
      const parsed = response.parsed as HashtagEngineOutput;
      // Ensure hashtags are prefixed with #
      parsed.hashtags = parsed.hashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`);
      logger.info(`Generated ${parsed.hashtags.length} hashtags: ${parsed.hashtags.join(', ')}`, AGENT_ID);
      return parsed;
    }

    // Fallback
    logger.warn('Gemini JSON parse failed. Returning default hashtags.', AGENT_ID);
    return {
      hashtags: ['#AI', '#Innovation', '#Technology'],
      reasoning: ['Fallback: Gemini response could not be parsed.'],
    };
  }
}
