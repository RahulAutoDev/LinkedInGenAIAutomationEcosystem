// ─── Core Type Definitions for LinkedIn GenAI Ecosystem ───
// All agents consume and produce these contracts.

export interface TopicCandidate {
  topic: string;
  category: string;
  priority: number;
  lastPublished: string | null;
  engagementScore: number;
  notes: string;
}

export interface TopicBrief {
  topic: string;
  angle: string;
  targetAudience: string;
  talkingPoints: string[];
  suggestedFormat: 'text-only' | 'carousel' | 'diagram-post';
  generatedAt: string;
}

export interface DraftPost {
  id: string; // Unique ID for the draft
  topicBrief: TopicBrief;
  body: string; // The main text ('post' in PRD JSON)
  hashtags: string[];
  diagramMermaid: string | null; // Extracted from content generator JSON
  imagePrompt: string | null; // Extracted from content generator JSON
  diagramPath: string | null; // Added by diagram agent after rendering
  revisionCount: number; // For tracking iterations
  revisionFeedback: string | null; // Reviewer feedback
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface HashtagSet {
  hashtags: string[];
  reasoning: string[];
}

export interface ReviewVerdict {
  verdict: 'PASS' | 'REVISE' | 'BLOCK';
  score: number;
  checks: ReviewCheck[];
  feedback: string | null;
  reviewedAt: string;
  passToken: string | null; // Cryptographic token, only present on PASS
}

export interface ReviewCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  verdict?: 'PASS' | 'REVISE' | 'BLOCK';
  metadata: Record<string, unknown>;
}

export interface EngagementMetrics {
  postUrn: string;
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  clickThrough: number;
  collectedAt: string;
}

export interface PublishResult {
  success: boolean;
  postUrn: string | null;
  postUrl: string | null;
  error: string | null;
  publishedAt: string;
}

export interface PipelineState {
  cycleId: string;
  status: 'topic-planner'
  | 'content-generator'
  | 'diagram-agent'
  | 'reviewer-agent'
  | 'publisher-agent'
  | 'scheduler'
  | 'feedback'
  | 'completed'
  | 'failed';
  topicBrief: TopicBrief | null;
  draftPost: DraftPost | null;
  reviewVerdict: ReviewVerdict | null;
  publishResult: PublishResult | null;
  startedAt: string;
  completedAt: string | null;
}

// Agent configuration type
export interface AgentConfig {
  name: string;
  sovereigntyLevel: 1 | 2 | 3 | 4 | 5;
  temperature: number;
  maxTokens: number;
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'topic-planner':     { name: 'Topic Planner',      sovereigntyLevel: 3, temperature: 0.90, maxTokens: 2048 },
  'content-generator': { name: 'Content Generator',   sovereigntyLevel: 3, temperature: 0.85, maxTokens: 2048 },
  'diagram-agent':     { name: 'Diagram Generator',   sovereigntyLevel: 3, temperature: 0.30, maxTokens: 2048 },
  'reviewer-agent':    { name: 'Reviewer',            sovereigntyLevel: 4, temperature: 0.20, maxTokens: 2048 },
  'publisher-agent':   { name: 'Publisher',           sovereigntyLevel: 5, temperature: 0.10, maxTokens: 512 },
  'scheduler':         { name: 'Scheduler',           sovereigntyLevel: 5, temperature: 0.0,  maxTokens: 512 },
};
