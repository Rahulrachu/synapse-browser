import { AgentId, AgentName, AgentCapability, AgentTask, AgentResult, AgentContext, AgentMessage } from './types.js';
import { AgentMessageBus } from './AgentMessageBus.js';
import AgentLogger from './AgentLogger.js';
import { BaseAgent } from './BaseAgent.js';

const CODING_CAPABILITIES: AgentCapability[] = [
  { name: 'code_generation', description: 'Generate code from specifications' },
  { name: 'code_modification', description: 'Modify existing code based on requirements' },
  { name: 'code_review', description: 'Review code for quality and best practices' },
  { name: 'debugging', description: 'Diagnose and fix bugs in code' },
];

export class CodingAgent extends BaseAgent {
  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    super(id, 'coding-agent' as AgentName, CODING_CAPABILITIES, messageBus, initialContext);
  }
  async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`${this.id}: Executing coding task: ${task.goal}`, this.id);
    return { success: true, output: { type: 'code', content: `// Generated code for: ${task.goal}` } };
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
export default CodingAgent;
