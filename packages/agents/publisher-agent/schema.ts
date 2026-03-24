import { z } from 'zod';

export const PublisherInputSchema = z.object({
  draftPost: z.object({
    id: z.string(),
    body: z.string(),
    hashtags: z.array(z.string()),
    diagramPath: z.string().nullable(),
  }),
  passToken: z.string(), // Required: cryptographic PASS token from Reviewer
  reviewVerdict: z.object({
    verdict: z.literal('PASS'),
    score: z.number(),
    reviewedAt: z.string(),
  }),
});

export const PublisherOutputSchema = z.object({
  success: z.boolean(),
  postUrn: z.string().nullable(),
  postUrl: z.string().nullable(),
  error: z.string().nullable(),
  publishedAt: z.string(),
});

export type PublisherInput = z.infer<typeof PublisherInputSchema>;
export type PublisherOutput = z.infer<typeof PublisherOutputSchema>;
