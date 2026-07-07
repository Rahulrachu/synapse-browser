import { describe, it, expect } from 'vitest';
import ContextEngine from '../../src/engine/ContextEngine';

describe('ContextEngine', () => {
  it('should update and get context', () => {
    const updates = { currentProject: 'Synapse' };
    ContextEngine.updateContext(updates);
    expect(ContextEngine.getContext().currentProject).toBe('Synapse');
  });

  it('should generate context summary', () => {
    ContextEngine.updateContext({ 
      activeTab: { id: '1', title: 'Google', url: 'https://google.com', isActive: true },
      openFiles: ['index.ts']
    });
    const summary = ContextEngine.getContextSummary();
    expect(summary).toContain('Google');
    expect(summary).toContain('index.ts');
  });
});
