
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserAgent } from '../../src/agents/BrowserAgent';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentContext, AgentTask } from '../../src/agents/types';

// Mock BrowserAutomation
vi.mock('../../src/main/BrowserAutomation', () => ({
  default: {
    navigate: vi.fn().mockResolvedValue({ success: true }),
    clickElement: vi.fn().mockResolvedValue({ success: true }),
    typeText: vi.fn().mockResolvedValue({ success: true }),
    takeScreenshot: vi.fn().mockResolvedValue({ success: true, data: 'base64-image' }),
    getPageSource: vi.fn().mockResolvedValue({ success: true, data: '<html></html>' })
  }
}));

vi.mock('../../src/agents/AgentLogger');

describe('Browser Agent', () => {
  let messageBus: AgentMessageBus;
  let initialContext: AgentContext;
  let browserAgent: BrowserAgent;

  beforeEach(() => {
    messageBus = new AgentMessageBus();
    initialContext = {
      sharedData: new Map(),
      contextEngineState: {} as any,
      memorySystemState: [],
      planningEngineState: null,
      browserAutomationState: {},
      toolRuntimeState: []
    };
    browserAgent = new BrowserAgent('browser-agent', messageBus, initialContext);
  });

  it('should handle navigation tasks', async () => {
    const task: AgentTask = {
      id: 'task-1',
      goal: 'Navigate to https://example.com',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'browser-agent'
    };

    const result = await browserAgent.executeTask(task);
    expect(result.success).toBe(true);
    expect(task.status).toBe('completed');
  });

  it('should handle click tasks', async () => {
    const task: AgentTask = {
      id: 'task-2',
      goal: 'Click on "#submit-button"',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'browser-agent'
    };

    const result = await browserAgent.executeTask(task);
    expect(result.success).toBe(true);
  });

  it('should handle typing tasks', async () => {
    const task: AgentTask = {
      id: 'task-3',
      goal: 'Type "hello world" into "#search-input"',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'browser-agent'
    };

    const result = await browserAgent.executeTask(task);
    expect(result.success).toBe(true);
  });

  it('should report task completion through message bus', async () => {
    const publishSpy = vi.spyOn(messageBus, 'publish');
    const task: AgentTask = {
      id: 'task-4',
      goal: 'Take a screenshot',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'browser-agent'
    };

    await browserAgent.executeTask(task);

    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'task_completed',
      payload: expect.objectContaining({ taskId: 'task-4' })
    }));
  });

  it('should handle failures and report them', async () => {
    const publishSpy = vi.spyOn(messageBus, 'publish');
    const task: AgentTask = {
      id: 'task-5',
      goal: 'Invalid action',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'browser-agent'
    };

    const result = await browserAgent.executeTask(task);
    expect(result.success).toBe(false);
    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'task_failed',
      payload: expect.objectContaining({ taskId: 'task-5' })
    }));
  });
});
