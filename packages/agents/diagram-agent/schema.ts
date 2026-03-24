import { z } from 'zod';

export const DiagramAgentInputSchema = z.object({
  postBody: z.string(),
  topic: z.string(),
  diagramType: z.enum(['flowchart', 'sequence', 'architecture', 'mindmap']).default('flowchart'),
});

export const DiagramAgentOutputSchema = z.object({
  mermaidSource: z.string(),
  diagramPath: z.string(),
  diagramType: z.string(),
  generatedAt: z.string(),
});

export type DiagramAgentInput = z.infer<typeof DiagramAgentInputSchema>;
export type DiagramAgentOutput = z.infer<typeof DiagramAgentOutputSchema>;
