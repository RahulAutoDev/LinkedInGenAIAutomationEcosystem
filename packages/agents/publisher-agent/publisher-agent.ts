// ─── Publisher Agent ───
// Sovereignty Level 5 (Full Sovereign) — CONDITIONAL on Reviewer PASS token.
// TRUST BOUNDARY: Will NOT execute without a verified PASS token.

import { PublisherInputSchema, type PublisherInput, type PublisherOutput } from './schema.js';
import { ReviewerAgent } from '../reviewer-agent/reviewer-agent.js';
import { publishPost } from '../../integrations/linkedin/publish.js';
import { appendAuditLog } from '../../governance/audit-log/index.js';
import { logger } from '../../shared/utils/logger.js';

const AGENT_ID = 'publisher-agent';

export class PublisherAgent {
  async execute(rawInput: unknown): Promise<PublisherOutput> {
    const input = PublisherInputSchema.parse(rawInput);
    const { draftPost, passToken, reviewVerdict } = input;

    logger.info(`Publisher received draft: id=${draftPost.id}`, AGENT_ID);

    // ─── TRUST BOUNDARY ENFORCEMENT ───
    const isValid = ReviewerAgent.verifyPassToken(
      draftPost.id,
      passToken,
      reviewVerdict.reviewedAt,
      reviewVerdict.score
    );

    if (!isValid) {
      const error = 'TRUST BOUNDARY VIOLATION: Invalid or missing PASS token. Publishing blocked.';
      logger.error(error, AGENT_ID);

      await appendAuditLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentId: AGENT_ID,
        action: 'PUBLISH_BLOCKED',
        input: { draftId: draftPost.id },
        output: { error },
        metadata: { reason: 'invalid_pass_token' },
      });

      return {
        success: false,
        postUrn: null,
        postUrl: null,
        error,
        publishedAt: new Date().toISOString(),
      };
    }

    logger.info('PASS token verified. Proceeding to publish.', AGENT_ID);

    // ─── FORMAT & PUBLISH ───
    const fullBody = `${draftPost.body}\n\n${draftPost.hashtags.join(' ')}`;
    const accessToken = process.env.LINKEDIN_API_KEY || '';

    try {
      const result = await publishPost(accessToken, fullBody);

      const output: PublisherOutput = {
        success: result.success,
        postUrn: result.id || null,
        postUrl: result.id ? `https://www.linkedin.com/feed/update/${result.id}` : null,
        error: null,
        publishedAt: new Date().toISOString(),
      };

      // Log to audit trail
      await appendAuditLog({
        id: crypto.randomUUID(),
        timestamp: output.publishedAt,
        agentId: AGENT_ID,
        action: 'PUBLISHED',
        input: { draftId: draftPost.id, hashtags: draftPost.hashtags },
        output: { postUrn: output.postUrn, postUrl: output.postUrl },
        verdict: 'PASS',
        metadata: { reviewScore: reviewVerdict.score },
      });

      logger.info(`Published successfully: ${output.postUrn}`, AGENT_ID);
      return output;
    } catch (err) {
      const error = `Publishing failed: ${err}`;
      logger.error(error, AGENT_ID);

      return {
        success: false,
        postUrn: null,
        postUrl: null,
        error,
        publishedAt: new Date().toISOString(),
      };
    }
  }
}
