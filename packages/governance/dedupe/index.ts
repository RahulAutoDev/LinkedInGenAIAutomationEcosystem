// ─── Deduplication Governance Module ───
// 30-day window exact match + semantic similarity dedup checker.

import { logger } from '../../shared/utils/logger.js';
import { DEDUP_WINDOW_DAYS, SIMILARITY_THRESHOLD, POSTED_TOPICS_FILE, TOPIC_EMBEDDINGS_DIR } from '../../shared/constants/index.js';
import { readJSON } from '../../integrations/storage/index.js';
import { loadEmbeddings, findSimilarTopics, generateSimpleEmbedding } from '../../integrations/vector-db/index.js';
import * as path from 'path';
import * as fs from 'fs';

export interface DedupResult {
  isDuplicate: boolean;
  reason: string | null;
  similarTopics: { topic: string; similarity: number }[];
}

/**
 * Check if a topic has been published recently (exact match or semantic similarity).
 */
export function checkDuplicate(topic: string, projectRoot: string = process.cwd()): DedupResult {
  logger.info(`[Dedupe] Checking topic: "${topic}"`);

  // 1. Exact match against posted_topics.json
  const postedPath = path.resolve(projectRoot, POSTED_TOPICS_FILE);
  let postedTopics: string[] = [];
  if (fs.existsSync(postedPath)) {
    try {
      postedTopics = readJSON<string[]>(postedPath);
    } catch {
      postedTopics = [];
    }
  }

  const normalizedTopic = topic.toLowerCase().trim();
  const exactMatch = postedTopics.find((t) => t.toLowerCase().trim() === normalizedTopic);

  if (exactMatch) {
    return {
      isDuplicate: true,
      reason: `Exact match found: "${exactMatch}"`,
      similarTopics: [],
    };
  }

  // 2. Semantic similarity check via embeddings
  const embeddingsDir = path.resolve(projectRoot, TOPIC_EMBEDDINGS_DIR);
  const storedEmbeddings = loadEmbeddings(embeddingsDir);

  if (storedEmbeddings.length > 0) {
    const queryEmbedding = generateSimpleEmbedding(topic);
    const similar = findSimilarTopics(topic, queryEmbedding, storedEmbeddings, SIMILARITY_THRESHOLD);

    // Filter by dedup window
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DEDUP_WINDOW_DAYS);
    const recentSimilar = similar.filter((s) => {
      const stored = storedEmbeddings.find((e) => e.topic === s.topic);
      return stored && new Date(stored.publishedAt) > cutoff;
    });

    if (recentSimilar.length > 0) {
      return {
        isDuplicate: true,
        reason: `Semantic similarity above ${SIMILARITY_THRESHOLD} with recent topic(s)`,
        similarTopics: recentSimilar,
      };
    }
  }

  logger.info(`[Dedupe] Topic "${topic}" is unique. Proceeding.`);
  return { isDuplicate: false, reason: null, similarTopics: [] };
}
