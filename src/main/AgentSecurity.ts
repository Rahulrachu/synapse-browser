import path from 'node:path';

export const MAX_OUTPUT = 24000;
export const SAFE_COMMAND = /^(pwd|ls(?:\s+[-\w./]+)?|find\s+[-\w./]+(?:\s+-maxdepth\s+\d+)?|git\s+(?:status|diff|log|branch)(?:\s+[-\w./]+)*|npm\s+(?:test|run\s+(?:build|test|lint))(?:\s+[-\w./]+)*|pnpm\s+(?:test|run\s+(?:build|test|lint))(?:\s+[-\w./]+)*)$/;

export function trim(value: unknown) { const text = typeof value === 'string' ? value : JSON.stringify(value); return text.length > MAX_OUTPUT ? text.slice(0, MAX_OUTPUT) + '\n[output truncated]' : text; }
export function safeRelative(filePath: string) { const input = String(filePath || ''); if (!input || input.includes('\0')) throw new Error('Invalid workspace path'); const normalized = path.posix.normalize(input.replaceAll('\\', '/')); if (normalized === '..' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) throw new Error('Path must remain inside the project workspace'); return normalized; }
export function isSafeCommand(command: string) { return SAFE_COMMAND.test(String(command || '').trim()); }
