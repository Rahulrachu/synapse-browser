
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlannerAgent } from '../../src/agents/PlannerAgent';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentContext, AgentTask } from '../../src/agents/types';

// Mock existing systems
vi.mock('../../src/engine/PlanningEngine', () => ({
  default: { createPlan: vi.fn() }
}));
vi.mock('../../src/agents/AgentLogger');

describe('Planner Agent', () => {
  let messageBus: AgentMessageBus;
  let initialContext: AgentContext;
  let plannerAgent: PlannerAgent;

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
    plannerAgent = new PlannerAgent('planner-agent', messageBus, initialContext);
  });

  it('should analyze and decompose a goal into tasks', async () => {
    const goal = 'Search for the latest tech news and summarize it';
    const plan = await plannerAgent.generateExecutionPlan(goal);

    expect(plan).toHaveLength(3);
    expect(plan[0].goal).toContain('Research');
    expect(plan[1].goal).toContain('Execute');
    expect(plan[2].goal).toContain('Verify');
  });

  it('should map dependencies correctly', async () => {
    const goal = 'Test dependency mapping';
    const plan = await plannerAgent.generateExecutionPlan(goal);

    expect(plan[1].dependencies).toContain(plan[0].id);
    expect(plan[2].dependencies).toContain(plan[1].id);
  });

  it('should handle goal submission messages', async () => {
    const publishSpy = vi.spyOn(messageBus, 'publish');
    const goal = 'Automate my morning routine';
    
    // Simulate receiving a goal submission message
    await (plannerAgent as any).handleMessage({
      senderId: 'user',
      recipientId: 'planner-agent',
      type: 'goal_submitted',
      payload: { goal },
      timestamp: Date.now()
    });

    expect(publishSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'plan_generated',
      payload: expect.objectContaining({ goal })
    }));
  });

  it('should only execute planning tasks', async () => {
    const planningTask: AgentTask = {
      id: 'task-1',
      goal: 'Plan a research project',
      instructions: [],
      status: 'pending',
      createdAt: Date.now()
    };

    const result = await plannerAgent.executeTask(planningTask);
    expect(result.success).toBe(true);

    const nonPlanningTask: AgentTask = {
      id: 'task-2',
      goal: 'Click on a button',
      instructions: [],
      status: 'pending',
      createdAt: Date.now()
    };

    const result2 = await plannerAgent.executeTask(nonPlanningTask);
    expect(result2.success).toBe(false);
    expect(result2.error).toBe('PlannerAgent can only handle planning tasks.');
  });
});
