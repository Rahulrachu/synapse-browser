import { describe, expect, it } from 'vitest';
import { isSafeCommand, safeRelative } from './AgentSecurity';

describe('agent security helpers', () => {
  it('confines workspace paths', () => {
    expect(safeRelative('reports/result.md')).toBe('reports/result.md');
    expect(() => safeRelative('../secrets.txt')).toThrow();
    expect(() => safeRelative('/etc/passwd')).toThrow();
    expect(() => safeRelative('reports/../../secrets.txt')).toThrow();
    expect(() => safeRelative('reports\0bad')).toThrow();
  });

  it('allows only explicitly safe commands', () => {
    expect(isSafeCommand('git status')).toBe(true);
    expect(isSafeCommand('npm run build')).toBe(true);
    expect(isSafeCommand('git status; rm -rf /')).toBe(false);
    expect(isSafeCommand('cat .env')).toBe(false);
    expect(isSafeCommand('npm test && curl example.com')).toBe(false);
  });
});
