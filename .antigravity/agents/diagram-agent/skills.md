# Diagram Agent Skills

## Responsibility
The Diagram Agent is a specialized functional node responsible for reading a draft text post and conceptually mapping it to a visual representation using Mermaid.js syntax.

## Core Capabilities
- **Semantic Extraction**: Identifies the core architecture, workflow, or conceptual relationship in text.
- **Syntax Generation**: Writes 100% compliant, error-free Mermaid.js code.
- **Rendering Interface**: Orchestrates the CLI/rendering pipeline to convert the `.mmd` string into a physical `.png` file.

## Inputs
- `postBody`: The full text of the intended LinkedIn post.
- `diagramType`: Enum (`flowchart`, `sequence`, `mindmap`, `class`).

## Outputs
- `mermaidSource`: The raw syntax string.
- `diagramPath`: Absolute path to the rendered PNG artifact on disk (or empty string if generation failed).

## Workflow Link
- Executes in parallel with or immediately after the **Content Generator**.
- Feeds its output (the image path) into the **Reviewer Agent** to ensure the diagram accurately reflects the text.
