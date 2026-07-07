
import { AgentRegistry } from './AgentRegistry';
import { AgentMessageBus } from './AgentMessageBus';
import { BaseAgent } from './BaseAgent';
import { AgentId, AgentTask, AgentResult, AgentContext, AgentMessage } from './types';
import { EventEmitter } from 'events';
import AgentLogger from './AgentLogger';

export class AgentManager extends EventEmitter {
  private registry: AgentRegistry;
  private messageBus: AgentMessageBus;
  private executionQueue: AgentTask[] = [];
  private isProcessingQueue: boolean = false;
  private sharedAgentContext: AgentContext; // Shared context for all agents

  constructor(registry: AgentRegistry, messageBus: AgentMessageBus, initialContext: AgentContext) {
    super();
    this.registry = registry;
    this.messageBus = messageBus;
    this.sharedAgentContext = initialContext;
  }

  public async initializeAgent(agentId: AgentId): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      AgentLogger.error(`Failed to initialize agent: Agent with ID ${agentId} not found.`);
      throw new Error(`Agent with ID ${agentId} not found.`);
    }
    AgentLogger.info(`Initializing agent: ${agent.name} (${agentId})`, agentId);
    await agent.initialize();
    this.emit('agentInitialized', agentId);
  }

  public async startAgent(agentId: AgentId): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found.`);
    }
    await agent.start();
    this.emit('agentStarted', agentId);
  }

  public async pauseAgent(agentId: AgentId): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found.`);
    }
    await agent.pause();
    this.emit('agentPaused', agentId);
  }

  public async resumeAgent(agentId: AgentId): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found.`);
    }
    await agent.resume();
    this.emit('agentResumed', agentId);
  }

  public async stopAgent(agentId: AgentId): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found.`);
    }
    await agent.stop();
    this.emit('agentStopped', agentId);
  }

  public updateSharedContext(updates: Partial<AgentContext>) {
    this.sharedAgentContext = { ...this.sharedAgentContext, ...updates };
    this.emit('sharedContextUpdated', this.sharedAgentContext);
    // Optionally, push updates to all active agents
    this.registry.getAllAgents().forEach(agent => agent.updateContext(this.sharedAgentContext));
  }

  public getSharedContext(): AgentContext {
    return this.sharedAgentContext;
  }

  public async assignTask(task: AgentTask): Promise<void> {
    AgentLogger.info(`Task assigned: ${task.goal}`, task.agentId, { taskId: task.id });
    this.executionQueue.push(task);
    this.emit('taskAssigned', task.id);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }
    this.isProcessingQueue = true;

    while (this.executionQueue.length > 0) {
      const task = this.executionQueue.shift();
      if (!task) continue;

      this.emit('taskStarted', task.id);
      let result: AgentResult;

      try {
        const agent = task.agentId ? this.registry.getAgent(task.agentId) : this.findAgentForTask(task);
        if (!agent) {
          throw new Error(`No agent found to handle task: ${task.goal}`);
        }
        
        AgentLogger.info(`Task started: ${task.goal} by agent ${agent.name}`, agent.id, { taskId: task.id });

        // Update agent's context with the latest shared context and task-specific context
        agent.updateContext({ ...this.sharedAgentContext, currentTask: task, ...task.context });

        result = await agent.executeTask(task);
        task.status = result.success ? 'completed' : 'failed';
        task.result = result;
        
        if (result.success) {
          AgentLogger.info(`Task completed successfully: ${task.goal}`, agent.id, { taskId: task.id, result });
        } else {
          AgentLogger.error(`Task failed: ${task.goal}`, agent.id, { taskId: task.id, error: result.error });
        }
      } catch (error: any) {
        AgentLogger.error(`Error executing task: ${task.goal}`, undefined, { taskId: task.id, error: error.message });
        result = { success: false, error: error.message };
        task.status = 'failed';
        task.result = result;
      }

      this.emit('taskCompleted', task.id, result);
    }

    this.isProcessingQueue = false;
  }

  private findAgentForTask(task: AgentTask): BaseAgent | undefined {
    // TODO: Implement more sophisticated task-to-agent matching based on capabilities
    // For now, just return the first registered agent as a placeholder
    const allAgents = this.registry.getAllAgents();
    if (allAgents.length > 0) {
      return allAgents[0];
    }
    return undefined;
  }

  public async sendMessage(message: AgentMessage): Promise<void> {
    await this.messageBus.publish(message);
    this.emit('messageSent', message);
  }
}
