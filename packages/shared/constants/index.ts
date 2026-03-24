// ─── Constants for the LinkedIn GenAI Ecosystem ───

// Governance
export const MAX_REVISION_CYCLES = 3;
export const DEDUP_WINDOW_DAYS = 30;
export const SIMILARITY_THRESHOLD = 0.85;
export const MAX_HASHTAGS = 5;
export const MIN_HASHTAGS = 3;

// Scoring (from gemini.md)
export const HOOK_SCORE_WEIGHT = 0.40;
export const VALUE_DENSITY_WEIGHT = 0.30;
export const SHAREABILITY_WEIGHT = 0.20;
export const CTA_CLARITY_WEIGHT = 0.10;
export const MIN_HOOK_SCORE = 8;

// LinkedIn API
export const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
export const LINKEDIN_UGC_ENDPOINT = `${LINKEDIN_API_BASE}/ugcPosts`;
export const LINKEDIN_ANALYTICS_ENDPOINT = `${LINKEDIN_API_BASE}/organizationalEntityShareStatistics`;

// Gemini
export const GEMINI_MODEL = 'gemini-2.5-pro';
export const GEMINI_MAX_OUTPUT_TOKENS = 8192;

// Pipeline
export const MAX_POST_LENGTH = 3000; // LinkedIn character limit
export const MAX_EMOJI_COUNT = 3;
export const PUBLISH_WINDOW_START = 8;  // 8 AM
export const PUBLISH_WINDOW_END = 10;   // 10 AM
export const ANALYTICS_DELAY_HOURS = 10;

// Data Paths (relative to project root)
export const DATA_DIR = 'data';
export const POSTED_TOPICS_FILE = `${DATA_DIR}/posted_topics.json`;
export const TOPIC_EMBEDDINGS_DIR = `${DATA_DIR}/topic_embeddings`;
export const DRAFTS_DIR = `${DATA_DIR}/drafts`;
export const AUDIT_LOG_FILE = `${DATA_DIR}/audit_log.json`;
export const PROMPTS_DIR = 'prompts';
