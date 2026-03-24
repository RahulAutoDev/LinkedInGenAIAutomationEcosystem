import { z } from 'zod';

export const PostWriterInputSchema = z.object({
  topicBrief: z.object({
    topic: z.string(),
    angle: z.string(),
    targetAudience: z.string(),
    talkingPoints: z.array(z.string()),
    suggestedFormat: z.enum(['text-only', 'carousel', 'diagram-post']),
  }),
  revisionFeedback: z.string().nullable().default(null),
  revisionCount: z.number().default(0),
});

export const PostWriterOutputSchema = z.object({
  id: z.string(),
  body: z.string(),
  hookLine: z.string(),
  cta: z.string(),
  revisionCount: z.number(),
  createdAt: z.string(),
});

export type PostWriterInput = z.infer<typeof PostWriterInputSchema>;
export type PostWriterOutput = z.infer<typeof PostWriterOutputSchema>;
