# Content Generator Skills

## Responsibility
The Content Generator (formerly Post Writer) is the creative core of the ecosystem. It transforms a structured `TopicBrief` into a highly engaging, professional LinkedIn post optimized for the target audience.

## Core Capabilities
- **Drafting**: Extrapolates talking points into full, cohesive narratives.
- **Hook Optimization**: Generates high-impact, scroll-stopping opening concepts based on the predefined hook strategy.
- **Formatting Enforcement**: Automatically handles strict character limits, sparse emoji usage, and whitespace management for mobile scannability.
- **Hashtag Integration**: Generates and appends highly relevant contextual hashtags.

## Inputs
- `TopicBrief`: Structured topic data including the specific angle to take.
- `revisionFeedback` (Optional): Constructive feedback loop data if the Reviewer Agent rejects the initial draft.

## Outputs
- `DraftPost`: A structured JSON entity containing the full body text, isolated hook, CTA, and generated hashtags.

## Workflow Link
- Consumes output directly from the **Topic Planner**.
- Feeds output directly into the **Diagram Agent** (if visual format requested) and the **Reviewer Agent**.
