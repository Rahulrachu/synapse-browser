import { describe, it, expect, vi } from 'vitest';
import MemorySystem from '../../src/engine/MemorySystem';

// Mock electron app for tests
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp')
  }
}));

describe('MemorySystem', () => {
  it('should add and search memories', () => {
    MemorySystem.addMemory('fact', 'User likes dark mode');
    const results = MemorySystem.searchMemories('dark mode');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toBe('User likes dark mode');
  });

  it('should get recent memories', () => {
    MemorySystem.addMemory('preference', 'Font size 14');
    const recent = MemorySystem.getRecentMemories(1);
    expect(recent[0].content).toBe('Font size 14');
  });
});
