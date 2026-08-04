import { AgentId, AgentName, AgentCapability, AgentTask, AgentResult, AgentContext, AgentMessage } from './types.js';
import { AgentMessageBus } from './AgentMessageBus.js';
import AgentLogger from './AgentLogger.js';
import { BaseAgent } from './BaseAgent.js';
import { AgentManager } from './AgentManager.js';
import { PlannerAgent } from './PlannerAgent.js';

const ORCHESTRATOR_CAPABILITIES: AgentCapability[] = [
  { name: 'task_orchestration', description: 'Coordinate multiple agents' },
  { name: 'task_decomposition', description: 'Break down complex goals into subtasks' },
  { name: 'agent_coordination', description: 'Manage agent workflow' },
];

export class OrchestratorAgent extends BaseAgent {
  private agentManager: AgentManager;
  private plannerAgent: PlannerAgent;
  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext, manager: AgentManager, planner: PlannerAgent) {
    super(id, 'orchestrator-agent' as AgentName, ORCHESTRATOR_CAPABILITIES, messageBus, initialContext);
    this.agentManager = manager;
    this.plannerAgent = planner;
  }
  private decomposeTask(goal: string): { goal: string; agentId: string }[] {
    return [
      { goal: `Research: ${goal}`, agentId: 'research-agent' },
      { goal: `Implement: ${goal}`, agentId: 'coding-agent' },
      { goal: `Review: ${goal}`, agentId: 'reviewer-agent' },
    ];
  }
  async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`${this.id}: Orchestrating task: ${task.goal}`, this.id);
    const subtasks = this.decomposeTask(task.goal);
    for (const subtask of subtasks) {
      await this.messageBus.publish({
        senderId: this.id, recipientId: subtask.agentId || 'research-agent',
        type: 'task_assigned', payload: { task: subtask }, timestamp: Date.now(),
      });
    }
    task.status = 'completed';
    task.completedAt = Date.now();
    return { success: true, output: { type: 'orchestration', content: `Orchestrated: ${task.goal}` } };
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
export default OrchestratorAgent;
