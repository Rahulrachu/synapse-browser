
import { AgentRegistry } from './AgentRegistry';
import { AgentMessageBus } from './AgentMessageBus';
import { AgentManager } from './AgentManager';
import { AgentContext } from './types';
import ContextEngine from '../engine/ContextEngine';
import MemorySystem from '../engine/MemorySystem';
import PlanningEngine from '../engine/PlanningEngine';
import ToolRuntime from '../tools/ToolRuntime';
import { PlannerAgent } from './PlannerAgent';
import { BrowserAgent } from './BrowserAgent';

class AgentRuntime {
  private registry: AgentRegistry;
  private messageBus: AgentMessageBus;
  private manager: AgentManager;

  constructor() {
    this.registry = new AgentRegistry();
    this.messageBus = new AgentMessageBus();
    
    const initialContext: AgentContext = {
      sharedData: new Map(),
      contextEngineState: ContextEngine.getContext(),
      memorySystemState: MemorySystem.getRecentMemories(),
      planningEngineState: PlanningEngine.getCurrentPlan(),
      browserAutomationState: {},
      toolRuntimeState: ToolRuntime.getAllTools()
    };

    this.manager = new AgentManager(this.registry, this.messageBus, initialContext);

    // Register Planner Agent
    const plannerAgent = new PlannerAgent('planner-agent', this.messageBus, initialContext);
    this.registry.registerAgent(plannerAgent);

    // Register Browser Agent
    const browserAgent = new BrowserAgent('browser-agent', this.messageBus, initialContext);
    this.registry.registerAgent(browserAgent);
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
