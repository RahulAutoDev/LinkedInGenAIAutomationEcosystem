import { z } from 'zod';

export const TopicPlannerInputSchema = z.object({
  candidates: z.array(z.object({
    topic: z.string(),
    category: z.string(),
    priority: z.number(),
    lastPublished: z.string().nullable(),
    engagementScore: z.number(),
    notes: z.string().default(''),
  })),
  postedTopics: z.array(z.string()).default([]),
  maxResults: z.number().default(1),
});

export const TopicPlannerOutputSchema = z.object({
  topic: z.string(),
  angle: z.string(),
  targetAudience: z.string(),
  talkingPoints: z.array(z.string()),
  suggestedFormat: z.enum(['text-only', 'carousel', 'diagram-post']),
  generatedAt: z.string(),
});

export type TopicPlannerInput = z.infer<typeof TopicPlannerInputSchema>;
export type TopicPlannerOutput = z.infer<typeof TopicPlannerOutputSchema>;
