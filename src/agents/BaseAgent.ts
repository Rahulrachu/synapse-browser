
import { AgentId, AgentName, AgentCapability, AgentTask, AgentResult, AgentContext, AgentMessage } from './types.js';
import { AgentMessageBus } from './AgentMessageBus.js';
import AgentLogger from './AgentLogger.js';
import AIModelProviderManager from '../main/AIModelProviderManager.js';
import { AIChatMessage, AIChatOptions, AIChatResponse } from '../common/types/ai.js';

export abstract class BaseAgent {
  public readonly id: AgentId;
  public readonly name: AgentName;
  protected capabilities: AgentCapability[];
  protected messageBus: AgentMessageBus;
  protected context: AgentContext;

  constructor(id: AgentId, name: AgentName, capabilities: AgentCapability[], messageBus: AgentMessageBus, initialContext: AgentContext) {
    this.id = id;
    this.name = name;
    this.capabilities = capabilities;
    this.messageBus = messageBus;
    this.context = initialContext;

    this.messageBus.subscribe(this.id, this.handleMessage.bind(this));
  }

  public getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  public updateContext(newContext: Partial<AgentContext>) {
    this.context = { ...this.context, ...newContext };
  }

  protected async requestHelp(recipientId: AgentId, goal: string, context?: any): Promise<AgentResult> {
    const correlationId = `help-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    AgentLogger.info(`Agent ${this.id} requesting help from ${recipientId}: ${goal}`, this.id);

    return new Promise((resolve) => {
      const handler = async (message: AgentMessage) => {
        if (message.correlationId === correlationId && message.type === 'help_response') {
          this.messageBus.unsubscribe(this.id, handler);
          resolve(message.payload.result);
        }
      };

      this.messageBus.subscribe(this.id, handler);

      this.messageBus.publish({
        senderId: this.id,
        recipientId,
        type: 'help_request',
        payload: { goal, context },
        timestamp: Date.now(),
        correlationId
      });
    });
  }

  protected async delegate(recipientId: AgentId, task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`Agent ${this.id} delegating task to ${recipientId}: ${task.goal}`, this.id);
    task.parentId = this.context.currentTask?.id;
    
    const correlationId = `delegate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve) => {
      const handler = async (message: AgentMessage) => {
        if (message.correlationId === correlationId && message.type === 'delegation_result') {
          this.messageBus.unsubscribe(this.id, handler);
          resolve(message.payload.result);
        }
      };

      this.messageBus.subscribe(this.id, handler);

      this.messageBus.publish({
        senderId: this.id,
        recipientId,
        type: 'delegation',
        payload: { task },
        timestamp: Date.now(),
        correlationId
      });
    });
  }

  protected async callAI(messages: AIChatMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const providerId = this.context.preferredProvider || 'openai-default';
    AgentLogger.debug(`Agent ${this.id} calling AI via ${providerId}`, this.id);
    return await AIModelProviderManager.chat(providerId, messages, options);
  }

  protected abstract handleMessage(message: AgentMessage): Promise<void>;
  public abstract initialize(): Promise<void>;
  public abstract start(): Promise<void>;
  public abstract pause(): Promise<void>;
  public abstract resume(): Promise<void>;
  public abstract stop(): Promise<void>;
  public abstract executeTask(task: AgentTask): Promise<AgentResult>;
}
