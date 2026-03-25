# Reviewer Agent Skills

## Responsibility
The Reviewer is the most critical agent in the system. It acts as the **Governance Gate** and Trust Boundary. It has final say over whether content is allowed to be published, requires revision, or must be permanently blocked.

## Core Capabilities
- **Compliance Enforcement**: Scans for brand voice deviation, sensitive data leakage (PII, credentials), and prohibited promotional language.
- **Quality Assurance**: Evaluates readibility, factual accuracy, and alignment with the original `TopicBrief`.
- **Cryptographic Trust**: Generates an HMAC-signed PASS token if (and only if) the content meets all criteria. This token is required by the Publisher.

## Inputs
- `DraftPost`: The complete generated text package.
- `diagramPath` (Optional): Associated visual asset.

## Outputs
- `ReviewVerdict`: Structured JSON containing the verdict (`PASS`, `REVISE`, `BLOCK`), specific numeric scoring, detailed feedback strings, and the cryptographic `passToken` (if applicable).

## Workflow Link
- Interacts as a bottleneck layer between **Content Generator/Diagram Agent** and the **Publisher**. Creates a feedback loop back to the Generator on `REVISE`.
