
import { EventEmitter } from 'events';
import { AgentId, AgentTask, AgentResult, AgentContext, AgentMessage } from './types';
import { AgentManager } from './AgentManager';
import AgentRuntime from './AgentRuntime';
import AgentLogger from './AgentLogger';
import TaskQueueManager from '../main/TaskQueueManager';
import EventBus from '../main/EventBus';
import PermissionManager from '../main/PermissionManager';
import MemoryManager from '../engine/MemoryManager';
import SearchEngine from '../main/SearchEngine';
import WorkflowEngine from '../main/WorkflowEngine';
import { Job } from '../common/types/job';

export class AgentOrchestrator extends EventEmitter {
  private manager: AgentManager;

  constructor(manager: AgentManager) {
    super();
    this.manager = manager;
    this.setupIPCHandlers();
    this.setupEventListeners();
  }

  private setupIPCHandlers() {
    const { ipcMain } = require('electron');
    
    ipcMain.handle('agent:orchestrate-goal', async (_: any, goal: string) => {
      return this.orchestrateGoal(goal);
    });

    ipcMain.handle('agent:pause-task', async (_: any, taskId: string) => {
      return this.pauseTask(taskId);
    });

    ipcMain.handle('agent:resume-task', async (_: any, taskId: string) => {
      return this.resumeTask(taskId);
    });

    ipcMain.handle('agent:cancel-task', async (_: any, taskId: string) => {
      return this.cancelTask(taskId);
    });

    ipcMain.handle('agent:retry-task', async (_: any, taskId: string) => {
      return this.retryTask(taskId);
    });

    ipcMain.handle('agent:get-history', async (_: any) => {
      return this.getExecutionHistory();
    });
  }

  private setupEventListeners() {
    this.manager.on('taskStarted', (taskId: string) => {
      this.publishEvent('agent:task-started', { taskId });
    });

    this.manager.on('taskCompleted', (taskId: string, result: AgentResult) => {
      this.publishEvent('agent:task-completed', { taskId, result });
      this.updateJobInQueue(taskId, { status: 'completed', result });
    });

    this.manager.on('taskFailed', (taskId: string, result: AgentResult) => {
      this.publishEvent('agent:task-failed', { taskId, result });
      this.updateJobInQueue(taskId, { status: 'failed', error: result.error });
    });
  }

  public async orchestrateGoal(goal: string): Promise<string> {
    AgentLogger.info(`Orchestrating goal: ${goal}`, 'orchestrator');

    // 1. Search memories for similar previous goals
    const similarMemories = await MemoryManager.searchMemories(goal, { type: 'history', k: 3 });
    AgentLogger.debug(`Found ${similarMemories.length} similar memories`, 'orchestrator');

    // 2. Search for relevant skills or workflows
    const searchResults = await SearchEngine.search({ text: goal, limit: 5, filters: ['skills', 'workflows'] });
    AgentLogger.debug(`Found ${searchResults.length} relevant skills/workflows`, 'orchestrator');
    
    const orchestrator = AgentRuntime.getRegistry().getAgent('orchestrator-agent');
    if (!orchestrator) {
      throw new Error('Orchestrator agent not found');
    }

    const task: AgentTask = {
      id: `task-${Date.now()}`,
      agentId: 'orchestrator-agent',
      goal,
      instructions: ['Analyze goal', 'Decompose into subtasks', 'Manage execution'],
      status: 'pending',
      createdAt: Date.now(),
      isBackground: true,
      allowPause: true
    };

    // Persist as a job
    await TaskQueueManager.enqueueJob({
      id: task.id,
      name: `Orchestration: ${goal}`,
      type: 'ai-task',
      status: 'queued',
      payload: { goal, taskId: task.id },
      metadata: { agentId: 'orchestrator-agent' }
    });

    await this.manager.assignTask(task);
    return task.id;
  }

  public async pauseTask(taskId: string): Promise<boolean> {
    AgentLogger.info(`Pausing task: ${taskId}`, 'orchestrator');
    await this.manager.pauseTask(taskId);
    await TaskQueueManager.pauseJob(taskId);
    this.publishEvent('agent:task-paused', { taskId });
    return true;
  }

  public async resumeTask(taskId: string): Promise<boolean> {
    AgentLogger.info(`Resuming task: ${taskId}`, 'orchestrator');
    await this.manager.resumeTask(taskId);
    await TaskQueueManager.resumeJob(taskId);
    this.publishEvent('agent:task-resumed', { taskId });
    return true;
  }

  public async cancelTask(taskId: string): Promise<boolean> {
    AgentLogger.info(`Cancelling task: ${taskId}`, 'orchestrator');
    await this.manager.cancelTask(taskId);
    await TaskQueueManager.cancelJob(taskId);
    this.publishEvent('agent:task-cancelled', { taskId });
    return true;
  }

  public async retryTask(taskId: string): Promise<boolean> {
    AgentLogger.info(`Retrying task: ${taskId}`, 'orchestrator');
    const job = await TaskQueueManager.getJob(taskId);
    if (job) {
      const task: AgentTask = {
        id: `${taskId}-retry-${Date.now()}`,
        goal: job.payload.goal,
        instructions: ['Retry failed task'],
        status: 'pending',
        createdAt: Date.now(),
        // metadata is not a property of AgentTask
      };
      await this.manager.assignTask(task);
      return true;
    }
    return false;
  }

  public async getExecutionHistory(): Promise<Job[]> {
    return TaskQueueManager.getAllJobs({ type: 'ai-task' });
  }

  private async updateJobInQueue(taskId: string, updates: any) {
    try {
      await TaskQueueManager.updateJob(taskId, updates);
    } catch (error) {
      AgentLogger.error(`Failed to update job ${taskId} in queue`, 'orchestrator', { error });
    }
  }

  private publishEvent(type: string, payload: any) {
    EventBus.publish({
      id: `evt-${Date.now()}`,
      type,
      category: 'system', // 'agent' is not a valid category in EventCategory
      source: 'AgentOrchestrator',
      payload,
      timestamp: Date.now(),
      priority: 1
    });
  }
}
