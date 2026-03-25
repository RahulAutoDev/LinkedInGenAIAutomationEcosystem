---
name: Scheduler Rules
description: Local constraints and logic defining the automated Cron mechanisms.
---

# Scheduler Rules
> **Inheritance Notice**: These local rules augment the global constraints defined in [Global Rules](../../rules.md). Agents MUST satisfy both.

## 1. Input Constraints
- **Format**: All timelines must be strictly valid UNIX standard Cron Expressions.
- **Time Zones**: All scheduling operations default to `UTC` to prevent daylight savings skew.

## 2. Thread Safety
- The scheduler MUST NOT initiate a new `runContentCycle` if the previous cycle is still evaluating (e.g. stalled in Human Approval or complex recovery loop).

## 3. Failure Conditions
- If the inner cycle throws an unhandled exception, the Scheduler catches and logs it. It MUST schedule the next execution block gracefully without dying in the background thread.
