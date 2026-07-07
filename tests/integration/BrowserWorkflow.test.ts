
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRegistry } from '../../src/agents/AgentRegistry';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentManager } from '../../src/agents/AgentManager';
import { AgentContext, AgentTask } from '../../src/agents/types';
import { PlannerAgent } from '../../src/agents/PlannerAgent';
import { BrowserAgent } from '../../src/agents/BrowserAgent';
import { OrchestratorAgent } from '../../src/agents/OrchestratorAgent';
import ToolRuntime from '../../src/tools/ToolRuntime';

// Mock existing systems
vi.mock('../../src/engine/ContextEngine', () => ({
  default: { getContext: () => ({}) }
}));
vi.mock('../../src/engine/MemorySystem', () => ({
  default: { 
    getRecentMemories: () => [],
    addMemory: vi.fn()
  }
}));
vi.mock('../../src/engine/PlanningEngine', () => ({
  default: { 
    getCurrentPlan: () => null,
    createPlan: vi.fn()
  }
}));
vi.mock('../../src/main/BrowserAutomation', () => ({
  default: { 
    navigate: vi.fn().mockResolvedValue({ success: true, data: 'Navigated to google.com' }),
    clickElement: vi.fn().mockResolvedValue({ success: true, data: 'Clicked element' }),
    typeText: vi.fn().mockResolvedValue({ success: true, data: 'Typed text' }),
    takeScreenshot: vi.fn().mockResolvedValue({ success: true, data: 'Screenshot data' }),
    getPageSource: vi.fn().mockResolvedValue({ success: true, data: 'Page source content' })
  }
}));

describe('Workflow 3: Browser Automation Integration', () => {
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
    manager = new AgentManager(registry, messageBus, initialContext, ToolRuntime);

    // Instantiate and register agents
    const plannerAgent = new PlannerAgent('planner-agent', messageBus, initialContext);
    const browserAgent = new BrowserAgent('browser-agent', messageBus, initialContext);
    const orchestratorAgent = new OrchestratorAgent('orchestrator-agent', messageBus, initialContext, manager, plannerAgent);

    registry.registerAgent(plannerAgent);
    registry.registerAgent(browserAgent);
    registry.registerAgent(orchestratorAgent);
  });

  it('should successfully execute a browser automation workflow', async () => {
    const goal = 'Navigate to https://google.com and search for "Synapse Browser".';
    
    const orchestrator = registry.getAgent('orchestrator-agent') as OrchestratorAgent;
    
    const task: AgentTask = {
      id: 'browser-orchestrator-task',
      goal,
      instructions: ['Orchestrate the browser task.'],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'orchestrator-agent'
    };

    const result = await orchestrator.executeTask(task);

    expect(result.success).toBe(true);
    expect(result.output).toContain('Orchestration for goal');
    
    // Check if the result includes contributions from the browser agent
    expect(result.output).toContain('Navigated to google.com');
  });
});
