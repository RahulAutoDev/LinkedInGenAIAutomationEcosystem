// ─── Audit Log Governance Module ───
// Append-only JSON log writer for all verdicts and agent actions.

import type { AuditLogEntry } from '../../shared/types/index.js';
import { AUDIT_LOG_FILE } from '../../shared/constants/index.js';
import { appendToJSONArray } from '../../integrations/storage/index.js';
import { logger } from '../../shared/utils/logger.js';
import * as path from 'path';

/**
 * Append an audit log entry. This is append-only — entries cannot be modified or deleted.
 */
export async function appendAuditLog(entry: AuditLogEntry): Promise<void> {
  const logPath = path.resolve(process.cwd(), AUDIT_LOG_FILE);
  appendToJSONArray(logPath, entry);
  logger.info(
    `[AuditLog] Logged: action=${entry.action} agent=${entry.agentId} verdict=${entry.verdict || 'N/A'}`,
    entry.agentId
  );
}

/**
 * Read the full audit log. Read-only access.
 */
export function readAuditLog(): AuditLogEntry[] {
  const logPath = path.resolve(process.cwd(), AUDIT_LOG_FILE);
  try {
    const fs = require('fs');
    if (!fs.existsSync(logPath)) return [];
    return JSON.parse(fs.readFileSync(logPath, 'utf-8')) as AuditLogEntry[];
  } catch {
    return [];
  }
}

/**
 * Get audit entries for a specific draft ID.
 */
export function getAuditEntriesForDraft(draftId: string): AuditLogEntry[] {
  return readAuditLog().filter(
    (entry) =>
      (entry.input as Record<string, unknown>)?.draftId === draftId ||
      entry.id === draftId
  );
}
