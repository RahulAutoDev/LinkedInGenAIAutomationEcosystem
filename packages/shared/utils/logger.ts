// ─── Structured JSON Logger ───
// Every agent action is logged with agent ID, timestamp, and severity.

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  agentId?: string;
  message: string;
  data?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const prefix = entry.agentId ? `[${entry.agentId}]` : '';
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `${entry.timestamp} ${entry.level} ${prefix} ${entry.message}${dataStr}`;
}

function log(level: LogLevel, message: string, agentId?: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    agentId,
    message,
    data,
  };
  const formatted = formatEntry(entry);

  switch (level) {
    case 'ERROR':
      console.error(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (msg: string, agentId?: string, data?: Record<string, unknown>) => log('DEBUG', msg, agentId, data),
  info:  (msg: string, agentId?: string, data?: Record<string, unknown>) => log('INFO', msg, agentId, data),
  warn:  (msg: string, agentId?: string, data?: Record<string, unknown>) => log('WARN', msg, agentId, data),
  error: (msg: string, agentId?: string, data?: Record<string, unknown>) => log('ERROR', msg, agentId, data),
};
