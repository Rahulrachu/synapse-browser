
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodingAgent } from '../../src/agents/CodingAgent';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentContext, AgentTask } from '../../src/agents/types';

vi.mock('../../src/agents/AgentLogger');

describe('Coding Agent Foundation', () => {
  let messageBus: AgentMessageBus;
  let initialContext: AgentContext;
  let codingAgent: CodingAgent;

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
    codingAgent = new CodingAgent('coding-agent', messageBus, initialContext);
  });

  it('should have the required coding capabilities', () => {
    const capabilities = codingAgent.getCapabilities();
    const capabilityNames = capabilities.map(c => c.name);
    
    expect(capabilityNames).toContain('code_generation');
    expect(capabilityNames).toContain('code_analysis');
    expect(capabilityNames).toContain('code_modification');
    expect(capabilityNames).toContain('code_testing');
    expect(capabilityNames).toContain('code_debugging');
  });

  it('should route generation tasks correctly', async () => {
    const task: AgentTask = {
      id: 'task-1',
      goal: 'Generate a React component',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'coding-agent'
    };

    const result = await codingAgent.executeTask(task);
    expect(result.success).toBe(true);
    expect(result.output).toBe('// Code generation placeholder');
  });

  it('should route analysis tasks correctly', async () => {
    const task: AgentTask = {
      id: 'task-2',
      goal: 'Analyze this code',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'coding-agent',
      context: { code: 'const x = 1;' }
    };

    const result = await codingAgent.executeTask(task);
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty('complexity');
  });

  it('should report completion through message bus', async () => {
    const publishSpy = vi.spyOn(messageBus, 'publish');
    const task: AgentTask = {
      id: 'task-3',
      goal: 'Debug the main function',
      instructions: [],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'coding-agent'
    };

    await codingAgent.executeTask(task);

    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'coding_task_completed',
      payload: expect.objectContaining({ taskId: 'task-3' })
    }));
  });
});
