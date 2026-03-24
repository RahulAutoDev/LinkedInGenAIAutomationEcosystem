// ─── Diagram Agent ───
// Sovereignty Level 3 (Operational): Generates Mermaid diagrams and renders to PNG.

import { DiagramAgentInputSchema, type DiagramAgentInput, type DiagramAgentOutput } from './schema.js';
import { callGemini } from '../../shared/utils/gemini.js';
import { logger } from '../../shared/utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const AGENT_ID = 'diagram-agent';

export class DiagramAgent {
  async execute(rawInput: unknown): Promise<DiagramAgentOutput> {
    const input = DiagramAgentInputSchema.parse(rawInput);
    logger.info(`Generating ${input.diagramType} diagram for topic: "${input.topic}"`, AGENT_ID);

    const userPrompt = `
Analyze the following LinkedIn post and create a Mermaid.js diagram that visually reinforces the core argument.

Topic: ${input.topic}
Diagram Type: ${input.diagramType}
Post Content:
${input.postBody}

REQUIREMENTS:
1. Output ONLY valid Mermaid.js syntax (no markdown fencing, no explanation).
2. Use descriptive node labels (not just letters).
3. Quote any label containing special characters like parentheses.
4. Keep diagram complexity moderate — 5-10 nodes maximum.
5. Use appropriate diagram type: graph TD for flowcharts, sequenceDiagram for sequences.
    `.trim();

    const response = await callGemini({
      agentId: AGENT_ID,
      systemPrompt: 'You are a technical diagram specialist. Output ONLY valid Mermaid.js syntax.',
      userPrompt,
    });

    // Clean the response — strip markdown fencing if present
    let mermaidSource = response.text.trim();
    if (mermaidSource.startsWith('```mermaid')) {
      mermaidSource = mermaidSource.replace(/^```mermaid\n?/, '').replace(/\n?```$/, '');
    }
    if (mermaidSource.startsWith('```')) {
      mermaidSource = mermaidSource.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Write .mmd file and render to PNG
    const outputDir = path.resolve(process.cwd(), 'data', 'drafts');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = Date.now();
    const mmdPath = path.join(outputDir, `diagram_${timestamp}.mmd`);
    const pngPath = path.join(outputDir, `diagram_${timestamp}.png`);

    fs.writeFileSync(mmdPath, mermaidSource, 'utf-8');

    try {
      execSync(`npx -y @mermaid-js/mermaid-cli -i "${mmdPath}" -o "${pngPath}"`, {
        timeout: 30000,
        stdio: 'pipe',
      });
      logger.info(`Diagram rendered: ${pngPath}`, AGENT_ID);
    } catch (err) {
      logger.warn(`Mermaid CLI rendering failed: ${err}. Returning source only.`, AGENT_ID);
    }

    // Clean up .mmd
    if (fs.existsSync(mmdPath)) fs.unlinkSync(mmdPath);

    return {
      mermaidSource,
      diagramPath: fs.existsSync(pngPath) ? pngPath : '',
      diagramType: input.diagramType,
      generatedAt: new Date().toISOString(),
    };
  }
}
