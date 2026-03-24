// ─── Topic Planner Agent ───
// Sovereignty Level 3 (Operational): Can read/write internal data, call Gemini.
// Reads candidate topics, deduplicates, ranks by priority, generates TopicBrief.

import { TopicPlannerInputSchema, type TopicPlannerInput, type TopicPlannerOutput } from './schema.js';
import { callGemini } from '../../shared/utils/gemini.js';
import { logger } from '../../shared/utils/logger.js';
import { DEDUP_WINDOW_DAYS } from '../../shared/constants/index.js';
import * as fs from 'fs';
import * as path from 'path';

const AGENT_ID = 'topic-planner';

export class TopicPlanner {
  private promptTemplate: string;

  constructor() {
    const promptPath = path.resolve(process.cwd(), 'prompts', 'linkedin_post_prompt.md');
    this.promptTemplate = fs.existsSync(promptPath)'
      ? fs.readFileSync(promptPath, 'utf-8')
      : 'You are a LinkedIn content strategist. Select the best topic and generate a structured brief.';
  }

  async execute(rawInput: unknown): Promise<TopicPlannerOutput> {
    const input = TopicPlannerInputSchema.parse(rawInput);
    logger.info('Starting topic selection cycle', AGENT_ID);

    // Step 1: Filter out recently published topics (within dedup window)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DEDUP_WINDOW_DAYS);
    const cutoffStr = cutoffDate.toISOString();

    const eligible = input.candidates.filter((c) => {
      if (!c.lastPublished) return true;
      return c.lastPublished < cutoffStr;
    });

    // Step 2: Filter out exact-match duplicates
    const deduped = eligible.filter(
      (c) => !input.postedTopics.includes(c.topic.toLowerCase().trim())
    );

    if (deduped.length === 0) {
      logger.warn('No eligible topics after dedup filtering.', AGENT_ID);
      throw new Error('No eligible topics available. All candidates are within the dedup window.');
    }

    // Step 3: Rank by priority (descending), then by engagement score
    const ranked = deduped.sort(
      (a, b) => b.priority - a.priority || b.engagementScore - a.engagementScore
    );

    const topCandidate = ranked[0];
    logger.info(`Selected topic: "${topCandidate.topic}" (priority=${topCandidate.priority})`, AGENT_ID);

    // Step 4: Call Gemini to generate the TopicBrief
    const userPrompt = `
Given the following topic, generate a structured content brief for a LinkedIn post.

Topic: ${topCandidate.topic}
Category: ${topCandidate.category}
Notes: ${topCandidate.notes}

Return a JSON object with these exact fields:
- topic: the exact topic string
- angle: a unique, compelling angle for this post
- targetAudience: who this post is aimed at
- talkingPoints: array of 3-5 key points to cover
- suggestedFormat: one of "text-only", "carousel", or "diagram-post"
- generatedAt: current ISO timestamp
    `.trim();

    const response = await callGemini({
      agentId: AGENT_ID,
      systemPrompt: this.promptTemplate,
      userPrompt,
      jsonSchema: {},
    });

    if (response.parsed) {
      const output = response.parsed as TopicPlannerOutput;
      output.generatedAt = new Date().toISOString();
      logger.info(`TopicBrief generated for: "${output.topic}"`, AGENT_ID);
      return output;
    }

    // Fallback: construct from raw candidate if Gemini parse fails
    logger.warn('Gemini JSON parse failed, constructing fallback TopicBrief', AGENT_ID);
    return {
      topic: topCandidate.topic,
      angle: `Expert analysis of ${topCandidate.topic}`,
      targetAudience: 'Technology leaders and practitioners',
      talkingPoints: [topCandidate.notes || 'Key insights on this topic'],
      suggestedFormat: 'text-only',
      generatedAt: new Date().toISOString(),
    };
  }
}
