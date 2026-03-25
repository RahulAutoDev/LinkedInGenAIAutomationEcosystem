# Publisher Agent Skills

## Responsibility
The Publisher Agent is highly restricted integration agent. Its sole purpose is to take verified, tokenized content and push it to external distribution channels (LinkedIn).

## Core Capabilities
- **Trust Boundary Enforcement**: Ingests the HMAC-signed PASS token from the Reviewer. It cryptographically verifies the token before proceeding.
- **API Wrapper**: Formats and executes external POST requests to the LinkedIn V2 API for both UGC text content and binary image asset uploads.
- **Audit Logging**: Writes immutable logs indicating the success or failure of the external API call, including the returned LinkedIn Share URN.

## Inputs
- `DraftPost`
- `passToken`: Cryptographic signature from the Reviewer.

## Outputs
- `PublishResult`: Status flag, network error strings, and the public URL/URN of the live post.

## Workflow Link
- Executes ONLY after receiving a `PASS` from the **Reviewer**.
- Is completely agnostic to LLMs (is a deterministic code agent, zero active Gemini interactions).
