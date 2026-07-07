
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRegistry } from '../../src/agents/AgentRegistry';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentManager } from '../../src/agents/AgentManager';
import { AgentContext, AgentTask } from '../../src/agents/types';
import { PlannerAgent } from '../../src/agents/PlannerAgent';
import { ResearchAgent } from '../../src/agents/ResearchAgent';
import { BrowserAgent } from '../../src/agents/BrowserAgent';
import { CodingAgent } from '../../src/agents/CodingAgent';
import { WriterAgent } from '../../src/agents/WriterAgent';
import { ReviewerAgent } from '../../src/agents/ReviewerAgent';
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

describe('Workflow 2: Coding Project Integration', () => {
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
    const researchAgent = new ResearchAgent('research-agent', messageBus, initialContext);
    const browserAgent = new BrowserAgent('browser-agent', messageBus, initialContext);
    const codingAgent = new CodingAgent('coding-agent', messageBus, initialContext);
    const writerAgent = new WriterAgent('writer-agent', messageBus, initialContext);
    const reviewerAgent = new ReviewerAgent('reviewer-agent', messageBus, initialContext);
    const orchestratorAgent = new OrchestratorAgent('orchestrator-agent', messageBus, initialContext, manager, plannerAgent);

    registry.registerAgent(plannerAgent);
    registry.registerAgent(researchAgent);
    registry.registerAgent(browserAgent);
    registry.registerAgent(codingAgent);
    registry.registerAgent(writerAgent);
    registry.registerAgent(reviewerAgent);
    registry.registerAgent(orchestratorAgent);
  });

  it('should successfully execute a coding project workflow', async () => {
    const goal = 'Build a React Todo app. Please research best practices, write the code, and review it.';
    
    const orchestrator = registry.getAgent('orchestrator-agent') as OrchestratorAgent;
    
    const task: AgentTask = {
      id: 'coding-orchestrator-task',
      goal,
      instructions: ['Orchestrate the coding project.'],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'orchestrator-agent'
    };

    const result = await orchestrator.executeTask(task);

    expect(result.success).toBe(true);
    expect(result.output).toContain('Orchestration for goal');
    
    // Check if the result includes contributions from research, coding, and reviewer agents
    // The aggregateResults method uses JSON.stringify(res.output)
    expect(result.output).toContain('Research findings for');
    expect(result.output).toContain('Generated content for');
    expect(result.output).toContain('Code generation placeholder');
    expect(result.output).toContain('reviewId');
  });
});
