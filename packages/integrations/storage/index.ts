// ─── File Storage Integration ───
// Read/write JSON data, topics, and rendered assets.

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../shared/utils/logger.js';

/**
 * Read a JSON file and return its parsed contents.
 */
export function readJSON<T = unknown>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Write data to a JSON file (creates directories if needed).
 */
export function writeJSON(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  logger.info(`[Storage] Written: ${filePath}`);
}

/**
 * Append an item to a JSON array file. Creates file with empty array if missing.
 */
export function appendToJSONArray<T>(filePath: string, item: T): void {
  let arr: T[] = [];
  if (fs.existsSync(filePath)) {
    try {
      arr = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
    } catch {
      arr = [];
    }
  }
  arr.push(item);
  writeJSON(filePath, arr);
}

/**
 * Read a prompt template file.
 */
export function readPrompt(promptName: string, promptsDir: string = 'prompts'): string {
  const filePath = path.resolve(process.cwd(), promptsDir, promptName);
  if (!fs.existsSync(filePath)) {
    logger.warn(`[Storage] Prompt file not found: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * List all files in a directory with a given extension.
 */
export function listFiles(dirPath: string, extension?: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).filter((f) => !extension || f.endsWith(extension));
}
