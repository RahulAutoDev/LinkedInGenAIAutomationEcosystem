// ─── Policy Engine ───
// Defines brand guidelines, sensitive data patterns, and legal flags.

import { logger } from '../../shared/utils/logger.js';
import { MAX_EMOJI_COUNT, MAX_POST_LENGTH } from '../../shared/constants/index.js';

export interface PolicyViolation {
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
}

// Sensitive data patterns
const SENSITIVE_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/, name: 'SSN' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, name: 'Email Address' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, name: 'Credit Card Number' },
  { pattern: /\b(?:password|secret|api[_-]?key|token)\s*[:=]\s*\S+/i, name: 'Credential Leak' },
  { pattern: /\bconfidential|internal[\s-]only|do[\s-]not[\s-]distribute/i, name: 'Confidentiality Marker' },
];

// Prohibited words/phrases
const PROHIBITED_PHRASES = [
  'guaranteed results',
  'get rich quick',
  'limited time only',
  'act now',
  'not financial advice',
];

/**
 * Run all policy checks on a post body.
 */
export function enforcePolicy(body: string): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  // 1. Length check
  if (body.length > MAX_POST_LENGTH) {
    violations.push({
      rule: 'max_length',
      severity: 'medium',
      detail: `Post exceeds ${MAX_POST_LENGTH} characters (actual: ${body.length}).`,
    });
  }

  // 2. Emoji count
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojiCount = (body.match(emojiRegex) || []).length;
  if (emojiCount > MAX_EMOJI_COUNT) {
    violations.push({
      rule: 'emoji_limit',
      severity: 'low',
      detail: `Post contains ${emojiCount} emojis (max ${MAX_EMOJI_COUNT}).`,
    });
  }

  // 3. Sensitive data scan
  for (const { pattern, name } of SENSITIVE_PATTERNS) {
    if (pattern.test(body)) {
      violations.push({
        rule: 'sensitive_data',
        severity: 'critical',
        detail: `Potential ${name} detected in post content.`,
      });
    }
  }

  // 4. Prohibited phrases
  for (const phrase of PROHIBITED_PHRASES) {
    if (body.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push({
        rule: 'prohibited_phrase',
        severity: 'high',
        detail: `Contains prohibited phrase: "${phrase}".`,
      });
    }
  }

  // 5. All-caps check (no more than 20% of words)
  const words = body.split(/\s+/).filter((w) => w.length > 2);
  const allCapsWords = words.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
  if (words.length > 0 && allCapsWords.length / words.length > 0.2) {
    violations.push({
      rule: 'excessive_caps',
      severity: 'medium',
      detail: `${Math.round((allCapsWords.length / words.length) * 100)}% of words are ALL CAPS.`,
    });
  }

  if (violations.length > 0) {
    logger.warn(`[Policy] ${violations.length} violation(s) found.`);
  } else {
    logger.info('[Policy] All checks passed.');
  }

  return violations;
}

/**
 * Check if any violations are of critical severity (should trigger BLOCK).
 */
export function hasCriticalViolation(violations: PolicyViolation[]): boolean {
  return violations.some((v) => v.severity === 'critical');
}
