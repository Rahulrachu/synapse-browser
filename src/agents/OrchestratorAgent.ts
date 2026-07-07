
import { BaseAgent } from './BaseAgent';
import {
  AgentId,
  AgentCapability,
  AgentTask,
  AgentResult,
  AgentContext,
  AgentMessage
} from './types';
import { AgentMessageBus } from './AgentMessageBus';
import AgentLogger from './AgentLogger';
import { AgentManager } from './AgentManager';
import { PlannerAgent } from './PlannerAgent';

export class OrchestratorAgent extends BaseAgent {
  private agentManager: AgentManager;
  private plannerAgent: PlannerAgent; // Reference to the PlannerAgent

  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext, agentManager: AgentManager, plannerAgent: PlannerAgent) {
    const capabilities: AgentCapability[] = [
      {
        name: 'goal_reception',
        description: 'Receives high-level user goals for execution.'
      },
      {
        name: 'task_decomposition',
        description: 'Breaks down user goals into executable subtasks using the Planner Agent.'
      },
      {
        name: 'agent_selection',
        description: 'Decides which specialized agents to invoke for each subtask based on capabilities.'
      },
      {
        name: 'task_execution_management',
        description: 'Manages the execution of tasks, including dependency ordering and parallel execution.'
      },
      {
        name: 'failure_recovery',
        description: 'Automatically retries failed tasks or initiates replanning.'
      },
      {
        name: 'progress_tracking',
        description: 'Monitors and tracks the progress of all subtasks.'
      },
      {
        name: 'result_aggregation',
        description: 'Collects and aggregates results from various agents to form a final answer.'
      },
      {
        name: 'cancellation_handling',
        description: 'Handles requests to cancel ongoing tasks.'
      }
    ];
    super(id, 'Orchestrator Agent', capabilities, messageBus, initialContext);
    this.agentManager = agentManager;
    this.plannerAgent = plannerAgent;

    // Listen for task completion/failure events from the AgentManager
    this.agentManager.on('taskCompleted', this.handleSubtaskCompletion.bind(this));
    this.agentManager.on('taskFailed', this.handleSubtaskFailure.bind(this));
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    AgentLogger.debug(`OrchestratorAgent received message: ${message.type}`, this.id);

    switch (message.type) {
      case 'goal_submitted':
        await this.executeTask({
          id: `orchestrator-goal-${Date.now()}`,
          goal: message.payload.goal,
          instructions: ['Orchestrate the execution of the user goal.'],
          status: 'pending',
          createdAt: Date.now(),
          agentId: this.id
        });
        break;
      case 'task_assigned':
        if (message.payload.task.agentId === this.id) {
          await this.executeTask(message.payload.task);
        }
        break;
    }
  }

  public async initialize(): Promise<void> {
    AgentLogger.info('OrchestratorAgent initialized', this.id);
  }

  public async start(): Promise<void> {
    AgentLogger.info('OrchestratorAgent started', this.id);
  }

  public async pause(): Promise<void> {
    AgentLogger.info('OrchestratorAgent paused', this.id);
  }

  public async resume(): Promise<void> {
    AgentLogger.info('OrchestratorAgent resumed', this.id);
  }

  public async stop(): Promise<void> {
    AgentLogger.info('OrchestratorAgent stopped', this.id);
  }

  public async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`OrchestratorAgent executing task: ${task.goal}`, this.id);
    
    // Check if this is a recursive call for the same goal
    if (task.context?.isOrchestrated && task.goal.toLowerCase().includes('orchestrate the execution of')) {
       AgentLogger.info(`Preventing recursive orchestration for: ${task.goal}`, this.id);
       return { success: true, output: `Direct execution of: ${task.goal}` };
    }

    task.status = 'in-progress';
    task.startedAt = Date.now();

    try {
      // 1. Decompose the goal into subtasks using the PlannerAgent
      // If the goal already starts with "Orchestrate", we want the actual subtasks, 
      // not another orchestration task.
      let planGoal = task.goal;
      const prefixes = [
        'orchestrate the execution of: ',
        'orchestrate the execution of ',
        'orchestrate the coding project',
        'orchestrate '
      ];
      
      for (const prefix of prefixes) {
        if (planGoal.toLowerCase().startsWith(prefix)) {
          planGoal = planGoal.substring(prefix.length);
          break;
        }
      }

      // Force direct execution by setting a flag in the context for the planner
      const subtasks = await this.plannerAgent.generateExecutionPlan(planGoal, { 
        forceDirect: task.context?.forceDirect || true 
      });
      AgentLogger.info(`OrchestratorAgent decomposed goal into ${subtasks.length} subtasks.`, this.id);

      const results: AgentResult[] = [];
      for (const subtask of subtasks) {
        // Prevent infinite loops by marking the subtask
        subtask.context = { ...subtask.context, isOrchestrated: true };

        AgentLogger.info(`OrchestratorAgent assigning subtask: ${subtask.goal} to agent ${subtask.agentId || 'auto-select'}`, this.id);
        
        if (!subtask.id) {
          subtask.id = `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        const subtaskPromise = this.waitForSubtaskCompletion(subtask.id);
        await this.agentManager.assignTask(subtask);
        
        const subtaskResult = await subtaskPromise;
        results.push(subtaskResult);
        
        if (!subtaskResult.success) {
          throw new Error(`Subtask failed: ${subtask.goal}. Error: ${subtaskResult.error}`);
        }
      }

      // 2. Aggregate results (placeholder)
      const finalOutput = this.aggregateResults(task.goal, results);

      const agentResult: AgentResult = {
        success: true,
        output: finalOutput,
        executionTime: Date.now() - task.startedAt
      };

      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = agentResult;

      await this.messageBus.publish({
        senderId: this.id,
        recipientId: 'broadcast',
        type: 'orchestration_completed',
        payload: { taskId: task.id, goal: task.goal, result: finalOutput },
        timestamp: Date.now()
      });

      return agentResult;
    } catch (error: any) {
      const agentResult: AgentResult = {
        success: false,
        error: error.message,
        executionTime: Date.now() - task.startedAt
      };

      task.status = 'failed';
      task.completedAt = Date.now();
      task.result = agentResult;

      await this.messageBus.publish({
        senderId: this.id,
        recipientId: 'broadcast',
        type: 'orchestration_failed',
        payload: { taskId: task.id, error: error.message },
        timestamp: Date.now()
      });

      return agentResult;
    }
  }

  private async waitForSubtaskCompletion(subtaskId: string): Promise<AgentResult> {
    return new Promise((resolve) => {
      const onTaskCompleted = (taskId: string, result: AgentResult) => {
        if (taskId === subtaskId) {
          this.agentManager.off('taskCompleted', onTaskCompleted);
          this.agentManager.off('taskFailed', onTaskFailed);
          resolve(result);
        }
      };
      const onTaskFailed = (taskId: string, result: AgentResult) => {
        if (taskId === subtaskId) {
          this.agentManager.off('taskCompleted', onTaskCompleted);
          this.agentManager.off('taskFailed', onTaskFailed);
          resolve(result);
        }
      };
      this.agentManager.on('taskCompleted', onTaskCompleted);
      this.agentManager.on('taskFailed', onTaskFailed);
    });
  }

  private aggregateResults(goal: string, results: AgentResult[]): string {
    let aggregated = `Orchestration for goal: "${goal}"\n\n`;
    results.forEach((res, index) => {
      aggregated += `--- Subtask ${index + 1} ---\n`;
      if (res.success) {
        aggregated += `Status: Completed\nOutput: ${JSON.stringify(res.output, null, 2)}\n\n`;
      } else {
        aggregated += `Status: Failed\nError: ${res.error}\n\n`;
      }
    });
    return aggregated;
  }

  private handleSubtaskCompletion(taskId: string, result: AgentResult): void {
    AgentLogger.info(`OrchestratorAgent received subtask completion for ${taskId}`, this.id);
    // Potentially update internal state or trigger next steps
  }

  private handleSubtaskFailure(taskId: string, result: AgentResult): void {
    AgentLogger.error(`OrchestratorAgent received subtask failure for ${taskId}`, this.id, { error: result.error });
    // Implement retry logic or replanning here
  }
}
