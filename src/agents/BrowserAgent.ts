import { AgentId, AgentName, AgentCapability, AgentTask, AgentResult, AgentContext, AgentMessage } from './types.js';
import { AgentMessageBus } from './AgentMessageBus.js';
import AgentLogger from './AgentLogger.js';
import { BaseAgent } from './BaseAgent.js';

const BROWSER_CAPABILITIES: AgentCapability[] = [
  { name: 'web_browsing', description: 'Navigate and browse web pages' },
  { name: 'content_extraction', description: 'Extract content from web pages' },
  { name: 'url_analysis', description: 'Analyze and validate URLs' },
  { name: 'screenshot', description: 'Take screenshots of web pages' },
];

export class BrowserAgent extends BaseAgent {
  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    super(id, 'browser-agent' as AgentName, BROWSER_CAPABILITIES, messageBus, initialContext);
  }
  async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`${this.id}: Executing browser task: ${task.goal}`, this.id);
    return { success: true, output: { type: 'browser_result', content: `Browse result for: ${task.goal}` } };
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
export default BrowserAgent;
