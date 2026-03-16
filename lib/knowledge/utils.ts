import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

/**
 * Text processing utilities
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 1);
}

export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}... (truncated)`;
}

export function truncateForLog(text: string, limit: number = 420): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}... (truncated)`;
}

/**
 * File system utilities
 */
export function readText(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8').trim();
}

export function toRelativePath(filePath: string): string {
  return filePath
    .replace(`${process.cwd()}${path.sep}`, '')
    .replaceAll('/', '\\');
}

export function findFileByPattern(
  dirPath: string,
  stem: string,
  extension: string
): string | null {
  const direct = path.join(dirPath, `${stem}${extension}`);
  if (fs.existsSync(direct)) return direct;

  const candidates = fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith(extension));
  if (candidates.length === 0) return null;

  const exact = candidates.find((name) => name === `${stem}${extension}`);
  const partial = candidates.find((name) => name.includes(stem));
  return path.join(dirPath, exact ?? partial ?? candidates[0]);
}

export function findGraphFile(dirPath: string, stem: string): string | null {
  return findFileByPattern(dirPath, stem, '_graph.txt');
}

export function findSvgFile(dirPath: string, stem: string): string | null {
  return findFileByPattern(dirPath, stem, '.svg');
}

/**
 * Request/ID utilities
 */
export function makeRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatMs(startAt: number): string {
  return `${Date.now() - startAt}ms`;
}

/**
 * Number utilities
 */
export function clampTopK(topK: number): number {
  return Math.min(Math.max(topK, 1), 2);
}

/**
 * Error/Logging utilities
 */
export function toLogMessage(data?: Record<string, unknown>): string {
  if (!data) return '';
  try {
    const raw = JSON.stringify(data);
    return truncateForLog(raw);
  } catch {
    return '[unserializable-log-data]';
  }
}

export function summarizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Parsing utilities
 */
export function parseKeyValues(raw: string): Record<string, string> {
  const output: Record<string, string> = {};
  const pieces = raw.split('|').map((part) => part.trim());
  for (const piece of pieces) {
    const index = piece.indexOf('=');
    if (index <= 0) continue;
    const key = piece.slice(0, index).trim();
    const value = piece.slice(index + 1).trim();
    if (!key || !value) continue;
    output[key] = value;
  }
  return output;
}

/**
 * Content extraction utilities
 */
export function extractSvg(raw: string, maxChars: number = 4500): string {
  const match = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) return truncate(raw.trim(), maxChars);
  return truncate(match[0].trim(), maxChars);
}

/**
 * Trace formatting utilities
 */
export type PipelineTraceEntry = {
  stage: string;
  status: 'start' | 'ok' | 'error' | 'fallback';
  elapsedMs: number;
  at: string;
  detail: string;
  data?: Record<string, unknown>;
};

export function formatTraceText(trace: PipelineTraceEntry[]): string {
  return trace
    .map(
      (entry) =>
        `${entry.elapsedMs}ms | ${entry.stage} | ${entry.status} | ${entry.detail}`
    )
    .join('\n');
}
