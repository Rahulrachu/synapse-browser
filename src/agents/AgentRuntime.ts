
import { AgentRegistry } from './AgentRegistry';
import { AgentMessageBus } from './AgentMessageBus';
import { AgentManager } from './AgentManager';
import { AgentContext } from './types';
import ContextEngine from '../engine/ContextEngine';
import MemorySystem from '../engine/MemorySystem';
import PlanningEngine from '../engine/PlanningEngine';
import ToolRuntime from '../tools/ToolRuntime';
import { PlannerAgent } from './PlannerAgent';
import { ResearchAgent } from './ResearchAgent';
import { CodingAgent } from './CodingAgent';
import { ReviewerAgent } from './ReviewerAgent';
import { WriterAgent } from './WriterAgent';
import { OrchestratorAgent } from './OrchestratorAgent';
import { BrowserAgent } from './BrowserAgent';
import { AgentOrchestrator } from './AgentOrchestrator';

class AgentRuntime {
  private registry: AgentRegistry;
  private messageBus: AgentMessageBus;
  private manager: AgentManager;
  private orchestrator: AgentOrchestrator;

  constructor() {
    this.registry = new AgentRegistry();
    this.messageBus = new AgentMessageBus();
    
    const sharedData = new Map();
    sharedData.set('projectPath', process.cwd());

    const initialContext: AgentContext = {
      sharedData,
      contextEngineState: ContextEngine.getContext(),
      memorySystemState: MemorySystem.getRecentMemories(),
      planningEngineState: PlanningEngine.getCurrentPlan(),
      browserAutomationState: {},
      toolRuntimeState: ToolRuntime.getAllTools()
    };

    this.manager = new AgentManager(this.registry, this.messageBus, initialContext, ToolRuntime);

    // Register Planner Agent
    const plannerAgent = new PlannerAgent('planner-agent', this.messageBus, initialContext);
    this.registry.registerAgent(plannerAgent);

    // Register Browser Agent
    const browserAgent = new BrowserAgent('browser-agent', this.messageBus, initialContext);
    this.registry.registerAgent(browserAgent);

    // Register Research Agent
    const researchAgent = new ResearchAgent('research-agent', this.messageBus, initialContext);
    this.registry.registerAgent(researchAgent);

    // Register Coding Agent
    const codingAgent = new CodingAgent('coding-agent', this.messageBus, initialContext);
    this.registry.registerAgent(codingAgent);

    // Register Reviewer Agent
    const reviewerAgent = new ReviewerAgent('reviewer-agent', this.messageBus, initialContext);
    this.registry.registerAgent(reviewerAgent);

    // Register Writer Agent
    const writerAgent = new WriterAgent('writer-agent', this.messageBus, initialContext);
    this.registry.registerAgent(writerAgent);

    // Register Orchestrator Agent
    const orchestratorAgent = new OrchestratorAgent('orchestrator-agent', this.messageBus, initialContext, this.manager, plannerAgent);
    this.registry.registerAgent(orchestratorAgent);

    // Initialize Orchestrator Service
    this.orchestrator = new AgentOrchestrator(this.manager);
  }

  public getRegistry(): AgentRegistry {
    return this.registry;
  }

  public getMessageBus(): AgentMessageBus {
    return this.messageBus;
  }

  public getManager(): AgentManager {
    return this.manager;
  }

  public getOrchestrator(): AgentOrchestrator {
    return this.orchestrator;
  }

  /**
   * Synchronize the agent context with the current state of other systems.
   */
  public syncContext() {
    this.manager.updateSharedContext({
      contextEngineState: ContextEngine.getContext(),
      memorySystemState: MemorySystem.getRecentMemories(),
      planningEngineState: PlanningEngine.getCurrentPlan(),
      toolRuntimeState: ToolRuntime.getAllTools()
    });
  }
}

export default new AgentRuntime();
