import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface Task {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'decision' | 'parallel' | 'sequential';
  handler: string;
  parameters: Record<string, any>;
  dependencies: string[];
  timeout?: number;
  retries?: number;
  critical?: boolean;
  approvalRequired?: boolean;
}

export interface TaskGraph {
  id: string;
  name: string;
  tasks: Task[];
  entryPoint: string;
  exitPoint: string;
  createdAt: number;
  metadata: Record<string, any>;
}

export interface TaskExecution {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'paused';
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: string;
  retryCount: number;
  logs: string[];
}

export interface ExecutionContext {
  graphId: string;
  executionId: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  taskExecutions: Map<string, TaskExecution>;
  variables: Record<string, any>;
  checkpoints: Map<string, ExecutionCheckpoint>;
}

export interface ExecutionCheckpoint {
  taskId: string;
  timestamp: number;
  state: Record<string, any>;
}

export class TaskGraphManager extends EventEmitter {
  private graphs: Map<string, TaskGraph> = new Map();
  private executions: Map<string, ExecutionContext> = new Map();
  private storagePath: string;

  constructor(storagePath: string) {
    super();
    this.storagePath = storagePath;
    this.ensureStorageDirectory();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  createGraph(name: string, description: string): TaskGraph {
    const graph: TaskGraph = {
      id: `graph-${Date.now()}`,
      name,
      description,
      tasks: [],
      entryPoint: '',
      exitPoint: '',
      createdAt: Date.now(),
      metadata: {},
    };

    this.graphs.set(graph.id, graph);
    return graph;
  }

  addTask(graphId: string, task: Task): void {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    graph.tasks.push(task);

    if (graph.tasks.length === 1) {
      graph.entryPoint = task.id;
    }
    graph.exitPoint = task.id;
  }

  setEntryPoint(graphId: string, taskId: string): void {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const task = graph.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in graph`);
    }

    graph.entryPoint = taskId;
  }

  setExitPoint(graphId: string, taskId: string): void {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const task = graph.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in graph`);
    }

    graph.exitPoint = taskId;
  }

  validateGraph(graphId: string): { valid: boolean; errors: string[] } {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      return { valid: false, errors: [`Graph ${graphId} not found`] };
    }

    const errors: string[] = [];

    if (!graph.entryPoint) {
      errors.push('Graph must have an entry point');
    }

    if (!graph.exitPoint) {
      errors.push('Graph must have an exit point');
    }

    // Check for circular dependencies
    if (this.hasCyclicDependencies(graph)) {
      errors.push('Graph contains circular dependencies');
    }

    // Check that all dependencies exist
    const taskIds = new Set(graph.tasks.map((t) => t.id));
    graph.tasks.forEach((task) => {
      task.dependencies.forEach((dep) => {
        if (!taskIds.has(dep)) {
          errors.push(`Task ${task.id} depends on non-existent task ${dep}`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private hasCyclicDependencies(graph: TaskGraph): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = graph.tasks.find((t) => t.id === taskId);
      if (!task) return false;

      for (const dep of task.dependencies) {
        if (!visited.has(dep)) {
          if (hasCycleDFS(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const task of graph.tasks) {
      if (!visited.has(task.id)) {
        if (hasCycleDFS(task.id)) {
          return true;
        }
      }
    }

    return false;
  }

  async executeGraph(graphId: string, variables?: Record<string, any>): Promise<ExecutionContext> {
    const graph = this.graphs.get(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const validation = this.validateGraph(graphId);
    if (!validation.valid) {
      throw new Error(`Graph validation failed: ${validation.errors.join('; ')}`);
    }

    const execution: ExecutionContext = {
      graphId,
      executionId: `exec-${Date.now()}`,
      startTime: Date.now(),
      status: 'running',
      taskExecutions: new Map(),
      variables: variables || {},
      checkpoints: new Map(),
    };

    this.executions.set(execution.executionId, execution);
    this.emit('execution-start', execution);

    try {
      await this.executeTasksRecursively(graph, graph.entryPoint, execution);
      execution.status = 'completed';
      execution.endTime = Date.now();
    } catch (err) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      this.emit('execution-error', { execution, error: err });
    }

    this.emit('execution-end', execution);
    this.saveExecution(execution);

    return execution;
  }

  private async executeTasksRecursively(
    graph: TaskGraph,
    taskId: string,
    execution: ExecutionContext,
    visited: Set<string> = new Set()
  ): Promise<void> {
    if (visited.has(taskId)) {
      return;
    }

    visited.add(taskId);

    const task = graph.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check dependencies
    for (const dep of task.dependencies) {
      const depExecution = execution.taskExecutions.get(dep);
      if (!depExecution || depExecution.status !== 'completed') {
        // Execute dependency first
        await this.executeTasksRecursively(graph, dep, execution, visited);
      }
    }

    // Execute task
    const taskExecution: TaskExecution = {
      taskId,
      status: 'pending',
      retryCount: 0,
      logs: [],
    };

    execution.taskExecutions.set(taskId, taskExecution);

    try {
      await this.executeTask(task, taskExecution, execution);
      taskExecution.status = 'completed';
      taskExecution.endTime = Date.now();

      // Create checkpoint
      this.createCheckpoint(execution, taskId);

      this.emit('task-complete', { task, execution: taskExecution });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';

      // Retry logic
      if ((task.retries || 0) > taskExecution.retryCount) {
        taskExecution.retryCount++;
        taskExecution.logs.push(`Retry attempt ${taskExecution.retryCount}`);
        await this.executeTasksRecursively(graph, taskId, execution, new Set(visited));
      } else {
        taskExecution.status = 'failed';
        taskExecution.error = error;
        taskExecution.endTime = Date.now();

        if (task.critical) {
          throw err;
        }

        this.emit('task-failed', { task, execution: taskExecution, error });
      }
    }

    // Execute next tasks in sequence
    const nextTasks = graph.tasks.filter((t) => t.dependencies.includes(taskId));
    for (const nextTask of nextTasks) {
      if (nextTask.type === 'sequential') {
        await this.executeTasksRecursively(graph, nextTask.id, execution, visited);
      }
    }
  }

  private async executeTask(
    task: Task,
    execution: TaskExecution,
    context: ExecutionContext
  ): Promise<void> {
    execution.status = 'running';
    execution.startTime = Date.now();

    const timeout = task.timeout || 30000;

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Task ${task.id} exceeded timeout of ${timeout}ms`));
      }, timeout);
    });

    try {
      // Simulate task execution
      const taskPromise = this.simulateTaskExecution(task, context);
      execution.result = await Promise.race([taskPromise, timeoutPromise]);
      execution.logs.push(`Task completed successfully`);
    } catch (err) {
      throw err;
    }
  }

  private async simulateTaskExecution(
    task: Task,
    context: ExecutionContext
  ): Promise<any> {
    // In production, this would invoke the actual task handler
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          taskId: task.id,
          success: true,
          timestamp: Date.now(),
        });
      }, 100);
    });
  }

  private createCheckpoint(execution: ExecutionContext, taskId: string): void {
    const checkpoint: ExecutionCheckpoint = {
      taskId,
      timestamp: Date.now(),
      state: {
        variables: { ...execution.variables },
        completedTasks: Array.from(execution.taskExecutions.entries())
          .filter(([_, exec]) => exec.status === 'completed')
          .map(([id]) => id),
      },
    };

    execution.checkpoints.set(taskId, checkpoint);
  }

  async rollback(executionId: string, toTaskId?: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const targetCheckpoint = toTaskId
      ? execution.checkpoints.get(toTaskId)
      : Array.from(execution.checkpoints.values()).pop();

    if (!targetCheckpoint) {
      throw new Error('No checkpoint available for rollback');
    }

    // Restore state from checkpoint
    execution.variables = targetCheckpoint.state.variables;

    // Mark tasks as skipped
    execution.taskExecutions.forEach((exec, taskId) => {
      if (!targetCheckpoint.state.completedTasks.includes(taskId)) {
        exec.status = 'skipped';
      }
    });

    this.emit('rollback-complete', { execution, checkpoint: targetCheckpoint });
  }

  private saveExecution(execution: ExecutionContext): void {
    const filePath = path.join(this.storagePath, `${execution.executionId}.json`);
    const data = {
      ...execution,
      taskExecutions: Array.from(execution.taskExecutions.entries()),
      checkpoints: Array.from(execution.checkpoints.entries()),
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  getExecution(executionId: string): ExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  listExecutions(graphId?: string): ExecutionContext[] {
    const executions = Array.from(this.executions.values());
    return graphId ? executions.filter((e) => e.graphId === graphId) : executions;
  }

  saveGraph(graph: TaskGraph): void {
    const filePath = path.join(this.storagePath, `${graph.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(graph, null, 2));
  }

  loadGraph(graphId: string): TaskGraph | null {
    const filePath = path.join(this.storagePath, `${graphId}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  }
}
