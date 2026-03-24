// ─── Vector DB Integration ───
// Embedding similarity search for topic deduplication.

import { logger } from '../../shared/utils/logger.js';
import { SIMILARITY_THRESHOLD } from '../../shared/constants/index.js';
import * as fs from 'fs';
import * as path from 'path';

interface TopicEmbedding {
  topic: string;
  embedding: number[];
  publishedAt: string;
}

/**
 * Simple cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

/**
 * Load all stored embeddings from the embeddings directory.
 */
export function loadEmbeddings(embeddingsDir: string): TopicEmbedding[] {
  if (!fs.existsSync(embeddingsDir)) return [];

  const files = fs.readdirSync(embeddingsDir).filter((f) => f.endsWith('.json'));
  const embeddings: TopicEmbedding[] = [];

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(embeddingsDir, file), 'utf-8'));
      embeddings.push(data as TopicEmbedding);
    } catch {
      logger.warn(`[VectorDB] Failed to parse embedding file: ${file}`);
    }
  }

  return embeddings;
}

/**
 * Save a topic embedding to disk.
 */
export function saveEmbedding(embeddingsDir: string, embedding: TopicEmbedding): void {
  if (!fs.existsSync(embeddingsDir)) fs.mkdirSync(embeddingsDir, { recursive: true });
  const fileName = `${embedding.topic.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.json`;
  fs.writeFileSync(path.join(embeddingsDir, fileName), JSON.stringify(embedding, null, 2));
  logger.info(`[VectorDB] Saved embedding for topic: "${embedding.topic}"`);
}

/**
 * Check if a topic is semantically similar to any recently published topic.
 * Returns the most similar topic and its similarity score.
 */
export function findSimilarTopics(
  query: string,
  queryEmbedding: number[],
  storedEmbeddings: TopicEmbedding[],
  threshold: number = SIMILARITY_THRESHOLD
): { topic: string; similarity: number }[] {
  const results: { topic: string; similarity: number }[] = [];

  for (const stored of storedEmbeddings) {
    const similarity = cosineSimilarity(queryEmbedding, stored.embedding);
    if (similarity >= threshold) {
      results.push({ topic: stored.topic, similarity });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Generate a simple bag-of-words embedding for a topic string.
 * In production, this would call Gemini's embedding API.
 */
export function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const vocab = new Set(words);
  // Simple hash-based embedding (production would use real model embeddings)
  const embedding = new Array(128).fill(0);
  for (const word of words) {
    const hash = Array.from(word).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    embedding[hash % 128] += 1;
  }
  // Normalize
  const norm = Math.sqrt(embedding.reduce((acc, v) => acc + v * v, 0)) || 1;
  return embedding.map((v) => v / norm);
}
