import { env } from '../../config/env.js';

/**
 * Stub wrapper for Vector DB (e.g., Qdrant, Pinecone or local Chroma).
 */
export class VectorDBService {
  private url: string;

  constructor() {
    this.url = env.VECTOR_DB_URL || 'http://localhost:6333';
  }

  /**
   * Embeds topics to block semantic duplicates.
   */
  async checkTopicSimilarity(topicString: string): Promise<boolean> {
    // Concept mock: call vector search to find exact semantics > 0.85
    console.log(`[VectorDB] Checking similarity for: ${topicString}`);
    return false; // Assuming it's novel for stub setup
  }

  /**
   * Embeds feedback rejections.
   */
  async storeFeedbackEmbedding(reason: string, isSuccess: boolean): Promise<void> {
    console.log(`[VectorDB] Stored embedding for ${isSuccess ? 'success_pattern' : 'rejection_pattern'}`);
  }
}

export const vectorDb = new VectorDBService();
