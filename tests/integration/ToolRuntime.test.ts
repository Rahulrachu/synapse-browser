import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock electron before any imports that use it
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp'),
    getVersion: vi.fn().mockReturnValue('1.0.0'),
    getAppPath: vi.fn().mockReturnValue('/tmp'),
  },
  ipcMain: {
    handle: vi.fn(),
  },
  clipboard: {
    readText: vi.fn(),
    writeText: vi.fn(),
  },
  nativeImage: {
    createFromPath: vi.fn(),
  }
}));

import ToolRegistry from '../../src/tools/ToolRuntime';
import { Tool, ToolDefinition, ToolResult } from '../../src/tools/ToolRuntime';

class MockTool extends Tool {
  definition: ToolDefinition = {
    id: 'mock-tool',
    name: 'Mock Tool',
    description: 'A tool for testing.',
    permissions: [],
    inputSchema: {},
    outputSchema: {}
  };
  async execute(input: any): Promise<ToolResult> {
    return { success: true, data: input, executionTime: 0 };
  }
}

describe('ToolRuntime', () => {
  beforeEach(() => {
    // We don't want to register all tools for every test, 
    // but we should test the registry itself
  });

  it('should register and invoke a tool', async () => {
    const mockTool = new MockTool();
    ToolRegistry.register(mockTool);
    
    const result = await ToolRegistry.invoke('mock-tool', { test: 'data' });
    expect(result.success).toBe(true);
    expect(result.data.test).toBe('data');
  });

  it('should return error for non-existent tool', async () => {
    const result = await ToolRegistry.invoke('non-existent', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Tool not found');
  });

  it('should maintain execution history', async () => {
    await ToolRegistry.invoke('mock-tool', { run: 1 });
    const history = ToolRegistry.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[history.length - 1].toolId).toBe('mock-tool');
  });
});
