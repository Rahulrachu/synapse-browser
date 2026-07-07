
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentRegistry } from '../../src/agents/AgentRegistry';
import { AgentMessageBus } from '../../src/agents/AgentMessageBus';
import { AgentManager } from '../../src/agents/AgentManager';
import { AgentContext, AgentTask } from '../../src/agents/types';
import { PlannerAgent } from '../../src/agents/PlannerAgent';
import { ResearchAgent } from '../../src/agents/ResearchAgent';
import { BrowserAgent } from '../../src/agents/BrowserAgent';
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

describe('Workflow 1: Research Project Integration', () => {
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
    const writerAgent = new WriterAgent('writer-agent', messageBus, initialContext);
    const reviewerAgent = new ReviewerAgent('reviewer-agent', messageBus, initialContext);
    const orchestratorAgent = new OrchestratorAgent('orchestrator-agent', messageBus, initialContext, manager, plannerAgent);

    registry.registerAgent(plannerAgent);
    registry.registerAgent(researchAgent);
    registry.registerAgent(browserAgent);
    registry.registerAgent(writerAgent);
    registry.registerAgent(reviewerAgent);
    registry.registerAgent(orchestratorAgent);
  });

  it('should successfully execute a research project workflow', async () => {
    const goal = 'Research Rust async runtimes and generate a report. Please break this down into research and writing steps.';
    
    // Submit goal to message bus (Orchestrator listens for this)
    await messageBus.publish({
      senderId: 'user',
      recipientId: 'broadcast',
      type: 'goal_submitted',
      payload: { goal },
      timestamp: Date.now()
    });

    // In a real scenario, the Orchestrator would start the process.
    // We'll trigger the Orchestrator's execution manually for the test.
    const orchestrator = registry.getAgent('orchestrator-agent') as OrchestratorAgent;
    
    const task: AgentTask = {
      id: 'research-orchestrator-task',
      goal,
      instructions: ['Orchestrate the research project.'],
      status: 'pending',
      createdAt: Date.now(),
      agentId: 'orchestrator-agent',
      context: { forceDirect: true }
    };

    // Execute the orchestrator task
    // We wrap this in a promise because executeTask will wait for subtasks, 
    // which are processed by the AgentManager's queue.
    const executionPromise = orchestrator.executeTask(task);
    
    // The test might hang if the queue isn't processing or events aren't firing.
    // We ensure the manager is ready to process.
    const result = await executionPromise;

    // Verify the result
    expect(result.success).toBe(true);
    expect(result.output).toContain('Orchestration for goal: "Research Rust async runtimes and generate a report. Please break this down into research and writing steps."');
    expect(result.output).toContain('--- Subtask');
    
    // Verify that multiple agents were involved (via logs or mock checks if possible)
    // Since our current implementation uses mocks/placeholders for LLM calls, 
    // we verify the structure and flow.
  });
});
