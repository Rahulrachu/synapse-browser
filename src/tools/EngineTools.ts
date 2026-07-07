import { Tool, ToolDefinition, ToolResult } from './ToolRuntime';
import ContextEngine from '../engine/ContextEngine';
import MemorySystem from '../engine/MemorySystem';
import PlanningEngine from '../engine/PlanningEngine';

export class ContextTool extends Tool {
  definition: ToolDefinition = {
    id: 'context-tool',
    name: 'Context Engine Tool',
    description: 'Access and update the browser context.',
    permissions: ['context:read', 'context:write'],
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'update', 'summary'] },
        updates: { type: 'object' }
      },
      required: ['action']
    },
    outputSchema: { type: 'object' }
  };

  async execute(input: any): Promise<ToolResult> {
    const { action, updates } = input;
    if (action === 'get') return { success: true, data: ContextEngine.getContext(), executionTime: 0 };
    if (action === 'update') {
      ContextEngine.updateContext(updates);
      return { success: true, executionTime: 0 };
    }
    if (action === 'summary') return { success: true, data: ContextEngine.getContextSummary(), executionTime: 0 };
    return { success: false, error: 'Invalid action', executionTime: 0 };
  }
}

export class MemoryTool extends Tool {
  definition: ToolDefinition = {
    id: 'memory-tool',
    name: 'Memory System Tool',
    description: 'Store and search memories.',
    permissions: ['memory:read', 'memory:write'],
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['add', 'search', 'recent'] },
        type: { type: 'string' },
        content: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['action']
    },
    outputSchema: { type: 'object' }
  };

  async execute(input: any): Promise<ToolResult> {
    const { action, type, content, query, limit } = input;
    if (action === 'add') return { success: true, data: MemorySystem.addMemory(type, content), executionTime: 0 };
    if (action === 'search') return { success: true, data: MemorySystem.searchMemories(query), executionTime: 0 };
    if (action === 'recent') return { success: true, data: MemorySystem.getRecentMemories(limit), executionTime: 0 };
    return { success: false, error: 'Invalid action', executionTime: 0 };
  }
}

export class PlanningTool extends Tool {
  definition: ToolDefinition = {
    id: 'planning-tool',
    name: 'Planning Engine Tool',
    description: 'Manage AI plans and tasks.',
    permissions: ['planning:read', 'planning:write'],
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'updateTask', 'get'] },
        goal: { type: 'string' },
        tasks: { type: 'array', items: { type: 'string' } },
        taskId: { type: 'string' },
        status: { type: 'string' },
        result: { type: 'object' }
      },
      required: ['action']
    },
    outputSchema: { type: 'object' }
  };

  async execute(input: any): Promise<ToolResult> {
    const { action, goal, tasks, taskId, status, result } = input;
    if (action === 'create') return { success: true, data: PlanningEngine.createPlan(goal, tasks), executionTime: 0 };
    if (action === 'updateTask') {
      PlanningEngine.updateTaskStatus(taskId, status, result);
      return { success: true, executionTime: 0 };
    }
    if (action === 'get') return { success: true, data: PlanningEngine.getCurrentPlan(), executionTime: 0 };
    return { success: false, error: 'Invalid action', executionTime: 0 };
  }
}
