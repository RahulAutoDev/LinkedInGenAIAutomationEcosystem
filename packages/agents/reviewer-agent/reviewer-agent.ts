// ─── Reviewer Agent (Compliance & Safety) — THE GOVERNANCE GATE ───
// Sovereignty Level 4 (Constrained Sovereign): Issues PASS/REVISE/BLOCK verdicts.
// TRUST BOUNDARY: No content reaches Publisher without a PASS from this agent.

import { ReviewerInputSchema, type ReviewerInput, type ReviewerOutput } from './schema.js';
import { callGemini } from '../../shared/utils/gemini.js';
import { logger } from '../../shared/utils/logger.js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const AGENT_ID = 'reviewer-agent';

export class ReviewerAgent {
  private promptTemplate: string;

  constructor() {
    const promptPath = path.resolve(process.cwd(), 'prompts', 'reviewer_prompt.md');
    this.promptTemplate = fs.existsSync(promptPath)
      ? fs.readFileSync(promptPath, 'utf-8')
      : 'You are a LinkedIn content compliance reviewer.';
  }

  async execute(rawInput: unknown): Promise<ReviewerOutput> {
    const input = ReviewerInputSchema.parse(rawInput);
    const { draftPost } = input;
    logger.info(`Reviewing draft: id=${draftPost.id}, revision #${draftPost.revisionCount}`, AGENT_ID);

    const userPrompt = `
Review the following LinkedIn post draft against enterprise compliance standards.

Post ID: ${draftPost.id}
Topic: ${draftPost.topic}
Hashtags: ${draftPost.hashtags.join(', ')}
Has Diagram: ${draftPost.diagramPath ? 'Yes' : 'No'}
Revision Count: ${draftPost.revisionCount}

POST CONTENT:
${draftPost.body}

Evaluate against these checks and return a JSON object:
1. brand_compliance: Does the tone match professional enterprise guidelines?
2. factual_accuracy: Are all claims substantiated or reasonably qualified?
3. sensitive_data: Contains NO proprietary, confidential, or PII data?
4. tone_quality: Professional yet engaging, no excessive self-promotion?
5. formatting: Short paragraphs, mobile-friendly, ≤ 3 emojis?
6. legal_exposure: No content creating regulatory or legal risk?

Return JSON with:
- verdict: "PASS" or "REVISE" or "BLOCK"
- score: 0-10 overall quality score
- checks: array of { name, passed (boolean), detail (string) }
- feedback: null if PASS, specific revision instructions if REVISE, reason if BLOCK
    `.trim();

    const response = await callGemini({
      agentId: AGENT_ID,
      systemPrompt: this.promptTemplate,
      userPrompt,
      jsonSchema: {},
    });

    const now = new Date().toISOString();

    if (response.parsed) {
      const parsed = response.parsed as Omit<ReviewerOutput, 'reviewedAt' | 'passToken'>;

      // Generate cryptographic PASS token only on PASS verdict
      let passToken: string | null = null;
      if (parsed.verdict === 'PASS') {
        const tokenData = `${draftPost.id}:${now}:${parsed.score}`;
        passToken = crypto
          .createHmac('sha256', process.env.GEMINI_API_KEY || 'sovereign-key')
          .update(tokenData)
          .digest('hex');
        logger.info(`PASS verdict issued. Token generated for draft ${draftPost.id}`, AGENT_ID);
      } else {
        logger.info(`${parsed.verdict} verdict issued for draft ${draftPost.id}`, AGENT_ID);
      }

      return {
        verdict: parsed.verdict,
        score: parsed.score,
        checks: parsed.checks || [],
        feedback: parsed.feedback || null,
        reviewedAt: now,
        passToken,
      };
    }

    // Fallback: if Gemini can't parse, default to REVISE for safety
    logger.warn('Gemini JSON parse failed. Defaulting to REVISE for safety.', AGENT_ID);
    return {
      verdict: 'REVISE',
      score: 5,
      checks: [{ name: 'parse_failure', passed: false, detail: 'Automated review response could not be parsed.' }],
      feedback: 'Review system encountered a parsing error. Please re-submit for manual review.',
      reviewedAt: now,
      passToken: null,
    };
  }

  /**
   * Verify a PASS token for Trust Boundary enforcement.
   * Called by the Publisher agent before any external action.
   */
  static verifyPassToken(draftId: string, token: string, reviewedAt: string, score: number): boolean {
    const tokenData = `${draftId}:${reviewedAt}:${score}`;
    const expected = crypto
      .createHmac('sha256', process.env.GEMINI_API_KEY || 'sovereign-key')
      .update(tokenData)
      .digest('hex');
    return token === expected;
  }
}
