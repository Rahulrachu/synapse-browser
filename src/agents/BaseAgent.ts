
import { AgentId, AgentName, AgentCapability, AgentTask, AgentResult, AgentContext, AgentMessage } from './types';
import { AgentMessageBus } from './AgentMessageBus';

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

  protected abstract handleMessage(message: AgentMessage): Promise<void>;
  public abstract initialize(): Promise<void>;
  public abstract start(): Promise<void>;
  public abstract pause(): Promise<void>;
  public abstract resume(): Promise<void>;
  public abstract stop(): Promise<void>;
  public abstract executeTask(task: AgentTask): Promise<AgentResult>;
}
