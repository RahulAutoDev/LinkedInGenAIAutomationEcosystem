# Enterprise Compliance Rules

## Overview
The Governance Layer enforces the following compliance rules before any content is published to LinkedIn.

## Automated Policy Checks

### 1. Sensitive Data Detection
Scans for: SSN patterns, email addresses, credit card numbers, credential leaks, confidentiality markers.
**Severity:** Critical (triggers BLOCK)

### 2. Prohibited Phrases
Blocks: "guaranteed results", "get rich quick", "limited time only", "act now", "not financial advice".
**Severity:** High (triggers REVISE or BLOCK)

### 3. Emoji Limits
Maximum 3 emojis per post.
**Severity:** Low (triggers REVISE)

### 4. Character Limits
Maximum 3000 characters per post.
**Severity:** Medium (triggers REVISE)

### 5. All-Caps Detection
No more than 20% of words in ALL CAPS.
**Severity:** Medium (triggers REVISE)

## Trust Boundary Rules
1. Publisher cannot execute without HMAC-signed PASS token from Reviewer
2. Maximum 3 revision cycles before human escalation
3. BLOCK verdict immediately halts pipeline
4. All verdicts logged immutably to audit trail

## Regulatory Compliance
- No unqualified financial, medical, or legal advice
- Respects intellectual property rights
- Compliant with LinkedIn Terms of Service
- GDPR-aware: no PII in published content
