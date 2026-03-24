// ─── Post Writer Agent ───
// Sovereignty Level 3 (Operational): Generates LinkedIn post from TopicBrief.
// Optimizes for Hook Score ≥ 8/10 and Value Density per gemini.md.

import { PostWriterInputSchema, type PostWriterInput, type PostWriterOutput } from './schema.js';
import { callGemini } from '../../shared/utils/gemini.js';
import { logger } from '../../shared/utils/logger.js';
import { MAX_POST_LENGTH, MAX_EMOJI_COUNT } from '../../shared/constants/index.js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const AGENT_ID = 'post-writer';

export class PostWriter {
  private promptTemplate: string;

  constructor() {
    const promptPath = path.resolve(process.cwd(), 'prompts', 'linkedin_post_prompt.md');
    this.promptTemplate = fs.existsSync(promptPath)
      ? fs.readFileSync(promptPath, 'utf-8')
      : 'You are a professional LinkedIn content writer.';
  }

  async execute(rawInput: unknown): Promise<PostWriterOutput> {
    const input = PostWriterInputSchema.parse(rawInput);
    const { topicBrief, revisionFeedback, revisionCount } = input;
    logger.info(`Drafting post for topic: "${topicBrief.topic}" (revision #${revisionCount})`, AGENT_ID);

    const revisionClause = revisionFeedback
      ? `\n\nIMPORTANT: This is revision #${revisionCount}. Address this feedback:\n${revisionFeedback}`
      : '';

    const userPrompt = `
Write a high-impact LinkedIn post based on this brief:

Topic: ${topicBrief.topic}
Angle: ${topicBrief.angle}
Target Audience: ${topicBrief.targetAudience}
Talking Points: ${topicBrief.talkingPoints.join(', ')}
Suggested Format: ${topicBrief.suggestedFormat}
${revisionClause}

REQUIREMENTS:
1. Hook Score ≥ 8/10: Opening line must arrest scrolling. Use a pattern interrupt, bold stat, or contrarian statement.
2. Value Density: Every sentence delivers insight. Use frameworks, numbered lists, actionable takeaways.
3. Shareability: Include at least one "screenshot-worthy" quotable line.
4. CTA: End with a specific, non-generic call-to-action.
5. Maximum ${MAX_POST_LENGTH} characters. Maximum ${MAX_EMOJI_COUNT} emojis.
6. Short paragraphs. Use whitespace for mobile readability.

Return JSON with these fields:
- body: the full post text
- hookLine: just the opening hook line (separately)
- cta: just the CTA line (separately)
    `.trim();

    const response = await callGemini({
      agentId: AGENT_ID,
      systemPrompt: this.promptTemplate,
      userPrompt,
      jsonSchema: {},
    });

    const id = crypto.randomUUID();

    if (response.parsed) {
      const parsed = response.parsed as { body: string; hookLine: string; cta: string };
      const output: PostWriterOutput = {
        id,
        body: parsed.body || response.text,
        hookLine: parsed.hookLine || '',
        cta: parsed.cta || '',
        revisionCount: revisionCount,
        createdAt: new Date().toISOString(),
      };
      logger.info(`Draft created: id=${id}, length=${output.body.length} chars`, AGENT_ID);
      return output;
    }

    // Fallback
    logger.warn('Gemini JSON parse failed, using raw text as body', AGENT_ID);
    return {
      id,
      body: response.text.substring(0, MAX_POST_LENGTH),
      hookLine: response.text.split('\n')[0] || '',
      cta: '',
      revisionCount: revisionCount,
      createdAt: new Date().toISOString(),
    };
  }
}
