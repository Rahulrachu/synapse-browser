
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRegistry } from '../../src/agents/AgentRegistry';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentManager } from '../../src/agents/AgentManager';
import { BaseAgent } from '../../src/agents/BaseAgent';
import { AgentTask, AgentResult, AgentContext, AgentMessage } from '../../src/agents/types';

// Mock existing systems
vi.mock('../../src/engine/ContextEngine', () => ({
  default: { getContext: () => ({}) }
}));
vi.mock('../../src/engine/MemorySystem', () => ({
  default: { getRecentMemories: () => [] }
}));
vi.mock('../../src/engine/PlanningEngine', () => ({
  default: { getCurrentPlan: () => null }
}));
vi.mock('../../src/tools/ToolRuntime', () => ({
  default: { getAllTools: () => [] }
}));

// Concrete implementation of BaseAgent for testing
class TestAgent extends BaseAgent {
  public messagesReceived: AgentMessage[] = [];
  public tasksExecuted: AgentTask[] = [];

  protected async handleMessage(message: AgentMessage): Promise<void> {
    this.messagesReceived.push(message);
  }

  public async initialize(): Promise<void> {}
  public async start(): Promise<void> {}
  public async pause(): Promise<void> {}
  public async resume(): Promise<void> {}
  public async stop(): Promise<void> {}

  public async executeTask(task: AgentTask): Promise<AgentResult> {
    this.tasksExecuted.push(task);
    return { success: true, output: 'Task completed' };
  }
}

describe('Agent Runtime Infrastructure', () => {
  let registry: AgentRegistry;
  let messageBus: AgentMessageBus;
  let manager: AgentManager;
  let initialContext: AgentContext;

  beforeEach(() => {
    registry = new AgentRegistry();
    messageBus = new AgentMessageBus();
    initialContext = {
      sharedData: new Map(),
      contextEngineState: {} as any,
      memorySystemState: [],
      planningEngineState: null,
      browserAutomationState: {},
      toolRuntimeState: []
    };
    manager = new AgentManager(registry, messageBus, initialContext);
  });

  it('should register and retrieve agents', () => {
    const agent = new TestAgent('agent-1', 'Test Agent', [], messageBus, initialContext);
    registry.registerAgent(agent);
    expect(registry.getAgent('agent-1')).toBe(agent);
    expect(registry.getAllAgents()).toContain(agent);
  });

  it('should handle agent lifecycle via manager', async () => {
    const agent = new TestAgent('agent-1', 'Test Agent', [], messageBus, initialContext);
    registry.registerAgent(agent);
    
    const initializeSpy = vi.spyOn(agent, 'initialize');
    const startSpy = vi.spyOn(agent, 'start');
    
    await manager.initializeAgent('agent-1');
    expect(initializeSpy).toHaveBeenCalled();
    
    await manager.startAgent('agent-1');
    expect(startSpy).toHaveBeenCalled();
  });

  it('should facilitate inter-agent communication via message bus', async () => {
    const agent1 = new TestAgent('agent-1', 'Agent 1', [], messageBus, initialContext);
    const agent2 = new TestAgent('agent-2', 'Agent 2', [], messageBus, initialContext);
    registry.registerAgent(agent1);
    registry.registerAgent(agent2);

    const message: AgentMessage = {
      senderId: 'agent-1',
      recipientId: 'agent-2',
      type: 'test',
      payload: { hello: 'world' },
      timestamp: Date.now()
    };

    await manager.sendMessage(message);
    expect(agent2.messagesReceived).toContainEqual(message);
  });

  it('should assign and execute tasks', async () => {
    const agent = new TestAgent('agent-1', 'Test Agent', [], messageBus, initialContext);
    registry.registerAgent(agent);

    const task: AgentTask = {
      id: 'task-1',
      goal: 'Perform test task',
      instructions: ['Step 1', 'Step 2'],
      status: 'pending',
      createdAt: Date.now()
    };

    await manager.assignTask(task);
    
    // Since task execution is asynchronous and involves a queue, 
    // we might need to wait or check if it's completed.
    // In our implementation, processQueue is called immediately.
    
    expect(agent.tasksExecuted).toHaveLength(1);
    expect(agent.tasksExecuted[0].id).toBe('task-1');
    expect(task.status).toBe('completed');
  });

  it('should manage shared context', () => {
    const agent = new TestAgent('agent-1', 'Test Agent', [], messageBus, initialContext);
    registry.registerAgent(agent);

    manager.updateSharedContext({ sharedData: new Map([['key', 'value']]) });
    
    expect(manager.getSharedContext().sharedData.get('key')).toBe('value');
    // In our implementation, updateSharedContext pushes to all agents
    // We can't directly check agent's private context, but we can verify the manager's state
  });
});
