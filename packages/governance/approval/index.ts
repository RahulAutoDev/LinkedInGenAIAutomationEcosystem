// ─── Approval Governance Module ───
// PASS token generation, verification, and revision loop counter.

import * as crypto from 'crypto';
import { logger } from '../../shared/utils/logger.js';
import { MAX_REVISION_CYCLES } from '../../shared/constants/index.js';

const SIGNING_SECRET = process.env.GEMINI_API_KEY || 'sovereign-signing-key';

/**
 * Generate a cryptographic PASS token for a reviewed draft.
 */
export function generatePassToken(draftId: string, reviewedAt: string, score: number): string {
  const data = `${draftId}:${reviewedAt}:${score}`;
  return crypto.createHmac('sha256', SIGNING_SECRET).update(data).digest('hex');
}

/**
 * Verify a PASS token against its components.
 */
export function verifyPassToken(
  draftId: string,
  token: string,
  reviewedAt: string,
  score: number
): boolean {
  const expected = generatePassToken(draftId, reviewedAt, score);
  const isValid = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!isValid) {
    logger.error(`[Approval] Token verification FAILED for draft: ${draftId}`);
  }
  return isValid;
}

/**
 * Check if the revision count has exceeded the maximum allowed revisions.
 * Returns true if the draft should be escalated to human review.
 */
export function shouldEscalateToHuman(revisionCount: number): boolean {
  if (revisionCount >= MAX_REVISION_CYCLES) {
    logger.warn(`[Approval] Revision count (${revisionCount}) exceeds max (${MAX_REVISION_CYCLES}). Escalating to human.`);
    return true;
  }
  return false;
}
