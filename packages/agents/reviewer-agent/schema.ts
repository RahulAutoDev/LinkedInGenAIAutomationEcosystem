import { z } from 'zod';

export const ReviewerInputSchema = z.object({
  draftPost: z.object({
    id: z.string(),
    body: z.string(),
    hookLine: z.string(),
    cta: z.string(),
    hashtags: z.array(z.string()),
    diagramPath: z.string().nullable(),
    topic: z.string(),
    revisionCount: z.number(),
  }),
});

export const ReviewCheckSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  detail: z.string(),
});

export const ReviewerOutputSchema = z.object({
  verdict: z.enum(['PASS', 'REVISE', 'BLOCK']),
  score: z.number().min(0).max(10),
  checks: z.array(ReviewCheckSchema),
  feedback: z.string().nullable(),
  reviewedAt: z.string(),
  passToken: z.string().nullable(),
});

export type ReviewerInput = z.infer<typeof ReviewerInputSchema>;
export type ReviewerOutput = z.infer<typeof ReviewerOutputSchema>;
