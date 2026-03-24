// ─── Worker Orchestrator ───
// Full pipeline: Topic Selection → Drafting → Enhancement → Review → Publish → Feedback
// Implements the complete workflow from .antigravity/workflows.md

import { TopicPlanner } from '../../../packages/agents/topic-planner/topic-planner.js';
import { PostWriter } from '../../../packages/agents/post-writer/post-writer.js';
import { HashtagEngine } from '../../../packages/agents/hashtag-engine/hashtag-engine.js';
import { DiagramAgent } from '../../../packages/agents/diagram-agent/diagram-agent.js';
import { ReviewerAgent } from '../../../packages/agents/reviewer-agent/reviewer-agent.js';
import { PublisherAgent } from '../../../packages/agents/publisher-agent/publisher-agent.js';
import { checkDuplicate } from '../../../packages/governance/dedupe/index.js';
import { shouldEscalateToHuman } from '../../../packages/governance/approval/index.js';
import { appendAuditLog } from '../../../packages/governance/audit-log/index.js';
import { appendToJSONArray, readJSON } from '../../../packages/integrations/storage/index.js';
import { logger } from '../../../packages/shared/utils/logger.js';
import { MAX_REVISION_CYCLES, POSTED_TOPICS_FILE } from '../../../packages/shared/constants/index.js';
import type { TopicBrief, DraftPost, PipelineState } from '../../../packages/shared/types/index.js';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

// ─── Initialize Agents ───
const topicPlanner = new TopicPlanner();
const postWriter = new PostWriter();
const hashtagEngine = new HashtagEngine();
const diagramAgent = new DiagramAgent();
const reviewerAgent = new ReviewerAgent();
const publisherAgent = new PublisherAgent();

/**
 * Execute a full content generation cycle.
 * This is the master orchestration function.
 */
export async function runContentCycle(): Promise<PipelineState> {
  const cycleId = crypto.randomUUID();
  const state: PipelineState = {
    cycleId,
    status: 'topic_selection',
    topicBrief: null,
    draftPost: null,
    reviewVerdict: null,
    publishResult: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };

  logger.info(`═══ Starting Content Cycle: ${cycleId} ═══`);

  try {
    // ──────────────────────────────────────
    // STEP 1: TOPIC SELECTION
    // ──────────────────────────────────────
    state.status = 'topic_selection';
    logger.info('Step 1: Topic Selection', 'orchestrator');

    // Load sample candidates (in production, read from LinkedIn_Topics.xlsx)
    const candidates = [
      { topic: 'Neuromorphic Computing in Edge AI', category: 'AI', priority: 9, lastPublished: null, engagementScore: 85, notes: 'Trending topic in industrial AI' },
      { topic: 'Multi-Agent Orchestration Patterns', category: 'Architecture', priority: 8, lastPublished: null, engagementScore: 78, notes: 'Key enterprise adoption topic' },
      { topic: 'Trust-Constrained Autonomous Systems', category: 'Security', priority: 7, lastPublished: null, engagementScore: 72, notes: 'Governance and safety focus' },
    ];

    // Check posted topics for dedup
    let postedTopics: string[] = [];
    const postedPath = path.resolve(process.cwd(), POSTED_TOPICS_FILE);
    if (fs.existsSync(postedPath)) {
      try { postedTopics = readJSON<string[]>(postedPath); } catch { postedTopics = []; }
    }

    const topicBrief = await topicPlanner.execute({ candidates, postedTopics });
    state.topicBrief = topicBrief;

    // Deduplicate check via governance
    const dedupResult = checkDuplicate(topicBrief.topic);
    if (dedupResult.isDuplicate) {
      logger.warn(`Topic "${topicBrief.topic}" is a duplicate: ${dedupResult.reason}`, 'orchestrator');
      state.status = 'failed';
      state.completedAt = new Date().toISOString();
      return state;
    }

    await appendAuditLog({
      id: crypto.randomUUID(), timestamp: new Date().toISOString(),
      agentId: 'topic-planner', action: 'TOPIC_SELECTED',
      input: { topic: topicBrief.topic }, output: topicBrief as unknown as Record<string, unknown>,
      metadata: { cycleId },
    });

    // ──────────────────────────────────────
    // STEP 2-3: DRAFTING + ENHANCEMENT LOOP
    // ──────────────────────────────────────
    let revisionCount = 0;
    let currentDraft: DraftPost | null = null;
    let reviewPassed = false;

    while (revisionCount <= MAX_REVISION_CYCLES && !reviewPassed) {
      state.status = 'drafting';
      logger.info(`Step 2: Drafting (revision #${revisionCount})`, 'orchestrator');

      const writerOutput = await postWriter.execute({
        topicBrief,
        revisionFeedback: currentDraft ? state.reviewVerdict?.feedback || null : null,
        revisionCount,
      });

      // ──────────────────────────────────────
      // STEP 3: ENHANCEMENT (Parallel)
      // ──────────────────────────────────────
      state.status = 'enhancement';
      logger.info('Step 3: Enhancement (hashtags + diagram in parallel)', 'orchestrator');

      const [hashtagResult, diagramResult] = await Promise.all([
        hashtagEngine.execute({
          postBody: writerOutput.body,
          topic: topicBrief.topic,
          category: topicBrief.targetAudience,
        }),
        topicBrief.suggestedFormat === 'diagram-post'
          ? diagramAgent.execute({
              postBody: writerOutput.body,
              topic: topicBrief.topic,
              diagramType: 'flowchart',
            })
          : Promise.resolve(null),
      ]);

      currentDraft = {
        id: writerOutput.id,
        topicBrief,
        body: writerOutput.body,
        hookLine: writerOutput.hookLine,
        cta: writerOutput.cta,
        hashtags: hashtagResult.hashtags,
        diagramPath: diagramResult?.diagramPath || null,
        revisionCount,
        revisionFeedback: null,
        createdAt: writerOutput.createdAt,
        updatedAt: new Date().toISOString(),
      };
      state.draftPost = currentDraft;

      // ──────────────────────────────────────
      // STEP 4: GOVERNANCE REVIEW
      // ──────────────────────────────────────
      state.status = 'review';
      logger.info('Step 4: Governance Review (Trust Boundary)', 'orchestrator');

      const reviewResult = await reviewerAgent.execute({
        draftPost: {
          id: currentDraft.id,
          body: currentDraft.body,
          hookLine: currentDraft.hookLine,
          cta: currentDraft.cta,
          hashtags: currentDraft.hashtags,
          diagramPath: currentDraft.diagramPath,
          topic: topicBrief.topic,
          revisionCount,
        },
      });

      state.reviewVerdict = reviewResult;

      await appendAuditLog({
        id: crypto.randomUUID(), timestamp: new Date().toISOString(),
        agentId: 'reviewer-agent', action: 'REVIEW_VERDICT',
        input: { draftId: currentDraft.id }, output: reviewResult as unknown as Record<string, unknown>,
        verdict: reviewResult.verdict,
        metadata: { cycleId, revisionCount },
      });

      if (reviewResult.verdict === 'PASS') {
        reviewPassed = true;
        logger.info('Review PASSED. Proceeding to publish.', 'orchestrator');
      } else if (reviewResult.verdict === 'BLOCK') {
        logger.error('Review BLOCKED. Halting pipeline.', 'orchestrator');
        state.status = 'failed';
        state.completedAt = new Date().toISOString();
        return state;
      } else {
        // REVISE
        revisionCount++;
        if (shouldEscalateToHuman(revisionCount)) {
          logger.warn('Max revisions exceeded. Escalating to human review.', 'orchestrator');
          state.status = 'failed';
          state.completedAt = new Date().toISOString();
          return state;
        }
        logger.info(`Revision requested. Loop #${revisionCount}`, 'orchestrator');
      }
    }

    if (!reviewPassed || !currentDraft || !state.reviewVerdict?.passToken) {
      state.status = 'failed';
      state.completedAt = new Date().toISOString();
      return state;
    }

    // ──────────────────────────────────────
    // STEP 5: PUBLISHING
    // ──────────────────────────────────────
    state.status = 'publishing';
    logger.info('Step 5: Publishing (Trust Boundary Enforcement)', 'orchestrator');

    const publishResult = await publisherAgent.execute({
      draftPost: {
        id: currentDraft.id,
        body: currentDraft.body,
        hashtags: currentDraft.hashtags,
        diagramPath: currentDraft.diagramPath,
      },
      passToken: state.reviewVerdict.passToken,
      reviewVerdict: {
        verdict: 'PASS',
        score: state.reviewVerdict.score,
        reviewedAt: state.reviewVerdict.reviewedAt,
      },
    });

    state.publishResult = publishResult;

    // Update posted topics
    if (publishResult.success) {
      appendToJSONArray(path.resolve(process.cwd(), POSTED_TOPICS_FILE), topicBrief.topic);
    }

    // ──────────────────────────────────────
    // COMPLETE
    // ──────────────────────────────────────
    state.status = 'completed';
    state.completedAt = new Date().toISOString();
    logger.info(`═══ Content Cycle Complete: ${cycleId} ═══`, 'orchestrator');

    return state;
  } catch (err) {
    logger.error(`Pipeline failed: ${err}`, 'orchestrator');
    state.status = 'failed';
    state.completedAt = new Date().toISOString();
    return state;
  }
}

// ─── Entry Point ───
if (require.main === module) {
  runContentCycle()
    .then((state) => {
      console.log('\n─── Pipeline Result ───');
      console.log(JSON.stringify(state, null, 2));
    })
    .catch(console.error);
}
