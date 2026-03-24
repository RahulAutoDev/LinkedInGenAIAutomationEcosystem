import { z } from 'zod';

export const HashtagEngineInputSchema = z.object({
  postBody: z.string(),
  topic: z.string(),
  category: z.string(),
  maxHashtags: z.number().default(5),
});

export const HashtagEngineOutputSchema = z.object({
  hashtags: z.array(z.string()).min(3).max(5),
  reasoning: z.array(z.string()),
});

export type HashtagEngineInput = z.infer<typeof HashtagEngineInputSchema>;
export type HashtagEngineOutput = z.infer<typeof HashtagEngineOutputSchema>;
