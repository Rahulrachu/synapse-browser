
import { AgentRegistry } from './AgentRegistry';
import { AgentMessageBus } from './AgentMessageBus';
import { BaseAgent } from './BaseAgent';
import { AgentId, AgentTask, AgentResult, AgentContext, AgentMessage, AgentCapability } from './types';
import ToolRuntime from '../tools/ToolRuntime';
import { EventEmitter } from 'events';
import AgentLogger from './AgentLogger';

export class AgentManager extends EventEmitter {
  private registry: AgentRegistry;
  private messageBus: AgentMessageBus;
  private executionQueue: AgentTask[] = [];
  private isProcessingQueue: boolean = false;
  private sharedAgentContext: AgentContext; // Shared context for all agents

  constructor(registry: AgentRegistry, messageBus: AgentMessageBus, initialContext: AgentContext, toolRuntime: typeof ToolRuntime) {
    super();
    this.registry = registry;
    this.messageBus = messageBus;
    this.sharedAgentContext = initialContext;
    this.toolRuntime = toolRuntime;
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
    // Add task to the queue, prioritizing based on priority field if available
    if (task.priority !== undefined) {
      let inserted = false;
      for (let i = 0; i < this.executionQueue.length; i++) {
        if ((this.executionQueue[i].priority || 0) > task.priority) {
          this.executionQueue.splice(i, 0, task);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        this.executionQueue.push(task);
      }
    } else {
      this.executionQueue.push(task);
    }
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

      if (task.status === 'paused') {
        AgentLogger.info(`Task ${task.id} is paused, re-queueing.`, undefined, { taskId: task.id });
        this.executionQueue.push(task); // Re-add to the end of the queue
        continue;
      }

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
        if (result.success) {
          task.status = 'completed';
        } else {
          if (task.maxRetries !== undefined && (task.retryCount || 0) < task.maxRetries) {
            task.retryCount = (task.retryCount || 0) + 1;
            task.status = 'pending'; // Reset status to pending for retry
            this.executionQueue.unshift(task); // Re-add to the front of the queue for immediate retry
            AgentLogger.warn(`Task ${task.id} failed, retrying (${task.retryCount}/${task.maxRetries}).`, undefined, { taskId: task.id });
          } else {
            task.status = 'failed';
          }
        }
        task.result = result;
        
        if (result.success) {
          AgentLogger.info(`Task completed successfully: ${task.goal}`, agent.id, { taskId: task.id, result });
        } else {
          AgentLogger.error(`Task failed: ${task.goal}`, agent.id, { taskId: task.id, error: result.error });
        }
      } catch (error: any) {
        AgentLogger.error(`Error executing task: ${task.goal}`, undefined, { taskId: task.id, error: error.message });
        result = { success: false, error: error.message };
        if (task.maxRetries !== undefined && (task.retryCount || 0) < task.maxRetries) {
          task.retryCount = (task.retryCount || 0) + 1;
          task.status = 'pending'; // Reset status to pending for retry
          this.executionQueue.unshift(task); // Re-add to the front of the queue for immediate retry
          AgentLogger.warn(`Task ${task.id} failed, retrying (${task.retryCount}/${task.maxRetries}).`, undefined, { taskId: task.id });
        } else {
          task.status = 'failed';
        }
        task.result = result;
      }

      this.emit('taskCompleted', task.id, result);
    }

    this.isProcessingQueue = false;
  }

  private findAgentForTask(task: AgentTask): BaseAgent | undefined {
    // A more sophisticated approach would involve an LLM to map task goals to required capabilities.
    // For now, we'll do a keyword-based matching to agent capabilities.
    const allAgents = this.registry.getAllAgents();
    
    // Simple keyword-to-capability mapping (can be expanded or replaced by LLM)
    const taskKeywords = task.goal.toLowerCase().split(' ');
    
    for (const agent of allAgents) {
      const agentCapabilities = agent.getCapabilities();
      for (const capability of agentCapabilities) {
        // Check if any of the agent's capabilities match keywords in the task goal
        if (taskKeywords.some(keyword => capability.name.toLowerCase().includes(keyword) || capability.description.toLowerCase().includes(keyword))) {
          // Further, check if the agent has access to tools required by its capabilities
          // This is a simplified check; a real implementation would be more granular
          const requiredToolCapabilities = this.mapAgentCapabilityToToolCapability(capability.name);
          const hasRequiredTools = requiredToolCapabilities.every(reqCap => this.toolRuntime.findToolsByCapability(reqCap).length > 0);
          
          if (hasRequiredTools) {
            return agent;
          }
        }
      }
    }
    
    // Fallback: if no specific agent is found, return the Orchestrator if available, or the first agent
    const orchestrator = this.registry.getAgent('orchestrator-agent');
    if (orchestrator) return orchestrator;

    if (allAgents.length > 0) {
      return allAgents[0];
    }
    return undefined;
  }

  private mapAgentCapabilityToToolCapability(agentCapabilityName: string): string[] {
    // This mapping would ideally be more dynamic or LLM-driven
    switch (agentCapabilityName) {
      case 'information_gathering':
        return ['web_browsing', 'data_extraction'];
      case 'code_generation':
        return ['file_editing', 'code_execution'];
      case 'report_generation':
        return ['file_writing', 'document_formatting'];
      // Add more mappings as needed
      default:
        return [];
    }
  }

  public async sendMessage(message: AgentMessage): Promise<void> {
    await this.messageBus.publish(message);
    this.emit("messageSent", message);
  }

  public async pauseTask(taskId: AgentId): Promise<void> {
    const taskIndex = this.executionQueue.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.executionQueue[taskIndex].status = 'paused';
      AgentLogger.info(`Task ${taskId} paused.`, undefined, { taskId });
      this.emit('taskPaused', taskId);
    } else {
      AgentLogger.warn(`Attempted to pause non-existent or already completed task ${taskId}.`, undefined, { taskId });
    }
  }

  public async resumeTask(taskId: AgentId): Promise<void> {
    const taskIndex = this.executionQueue.findIndex(t => t.id === taskId);
    if (taskIndex !== -1 && this.executionQueue[taskIndex].status === 'paused') {
      this.executionQueue[taskIndex].status = 'pending';
      AgentLogger.info(`Task ${taskId} resumed.`, undefined, { taskId });
      this.emit('taskResumed', taskId);
      this.processQueue(); // Trigger queue processing in case it was idle
    } else {
      AgentLogger.warn(`Attempted to resume non-paused or non-existent task ${taskId}.`, undefined, { taskId });
    }
  }

  public async cancelTask(taskId: AgentId): Promise<void> {
    const taskIndex = this.executionQueue.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.executionQueue[taskIndex].status = 'cancelled';
      AgentLogger.info(`Task ${taskId} cancelled.`, undefined, { taskId });
      this.emit('taskCancelled', taskId);
    } else {
      AgentLogger.warn(`Attempted to cancel non-existent or already completed task ${taskId}.`, undefined, { taskId });
    }
  }
}
