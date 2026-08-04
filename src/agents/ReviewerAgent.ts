import { AgentId, AgentName, AgentCapability, AgentTask, AgentResult, AgentContext, AgentMessage } from './types.js';
import { AgentMessageBus } from './AgentMessageBus.js';
import AgentLogger from './AgentLogger.js';
import { BaseAgent } from './BaseAgent.js';

const REVIEWER_CAPABILITIES: AgentCapability[] = [
  { name: 'code_review', description: 'Review code for quality' },
  { name: 'quality_check', description: 'Check code quality metrics' },
  { name: 'security_audit', description: 'Audit code for security issues' },
  { name: 'performance_review', description: 'Review code performance' },
];

export class ReviewerAgent extends BaseAgent {
  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    super(id, 'reviewer-agent' as AgentName, REVIEWER_CAPABILITIES, messageBus, initialContext);
  }
  async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`${this.id}: Executing review task: ${task.goal}`, this.id);
    return { success: true, output: { type: 'review', content: `Review complete for: ${task.goal}` } };
  }
  async initialize(): Promise<void> { AgentLogger.info(`${this.id}: Initialized`, this.id); }
  async start(): Promise<void> { AgentLogger.info(`${this.id}: Started`, this.id); }
  async pause(): Promise<void> { AgentLogger.info(`${this.id}: Paused`, this.id); }
  async resume(): Promise<void> { AgentLogger.info(`${this.id}: Resumed`, this.id); }
  async stop(): Promise<void> { AgentLogger.info(`${this.id}: Stopped`, this.id); }
  protected async handleMessage(message: AgentMessage): Promise<void> {
    AgentLogger.info(`${this.id}: Received message: ${message.type}`, this.id);
  }
}
export default ReviewerAgent;
