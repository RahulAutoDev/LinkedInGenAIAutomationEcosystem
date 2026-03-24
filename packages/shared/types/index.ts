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
  id: string;
  topicBrief: TopicBrief;
  body: string;
  hookLine: string;
  cta: string;
  hashtags: string[];
  diagramPath: string | null;
  revisionCount: number;
  revisionFeedback: string | null;
  createdAt: string;
  updatedAt: string;
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
  status: 'topic_selection' | 'drafting' | 'enhancement' | 'review' | 'publishing' | 'feedback' | 'completed' | 'failed';
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
  'topic-planner':   { name: 'Topic Planner',      sovereigntyLevel: 3, temperature: 0.90, maxTokens: 2048 },
  'post-writer':     { name: 'Post Writer',         sovereigntyLevel: 3, temperature: 0.85, maxTokens: 2048 },
  'hashtag-engine':  { name: 'Hashtag Optimizer',   sovereigntyLevel: 2, temperature: 0.40, maxTokens: 512 },
  'diagram-agent':   { name: 'Diagram Generator',   sovereigntyLevel: 3, temperature: 0.30, maxTokens: 2048 },
  'reviewer-agent':  { name: 'Reviewer',            sovereigntyLevel: 4, temperature: 0.20, maxTokens: 2048 },
  'publisher-agent': { name: 'Publisher',            sovereigntyLevel: 5, temperature: 0.10, maxTokens: 512 },
};
