
import { BaseAgent } from './BaseAgent';
import {
  AgentId,
  AgentName,
  AgentCapability,
  AgentTask,
  AgentResult,
  AgentContext,
  AgentMessage
} from './types';
import { WriterAgent } from './WriterAgent'; // Import WriterAgent for capability checking
import { OrchestratorAgent } from './OrchestratorAgent'; // Import OrchestratorAgent for capability checking
import { AgentMessageBus } from './AgentMessageBus';
import AgentLogger from './AgentLogger';
import PlanningEngine from '../engine/PlanningEngine';

export class PlannerAgent extends BaseAgent {
  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    const capabilities: AgentCapability[] = [
      {
        name: 'goal_analysis',
        description: 'Analyze high-level user goals to determine requirements and constraints.'
      },
      {
        name: 'task_decomposition',
        description: 'Break down complex goals into a hierarchical structure of smaller, executable tasks.'
      },
      {
        name: 'dependency_mapping',
        description: 'Identify dependencies between tasks and build an execution graph.'
      },
      {
        name: 'prioritization',
        description: 'Assign priorities to tasks based on dependencies and goal urgency.'
      },
      {
        name: 'replanning',
        description: 'Adjust the plan dynamically based on task outcomes and environmental changes.'
      }
    ];
    super(id, 'Planner Agent', capabilities, messageBus, initialContext);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    AgentLogger.debug(`PlannerAgent received message: ${message.type}`, this.id);
    
    switch (message.type) {
      case 'goal_submitted':
        await this.handleGoalSubmission(message.payload.goal);
        break;
      case 'task_status_updated':
        await this.handleTaskStatusUpdate(message.payload.taskId, message.payload.status, message.payload.result);
        break;
    }
  }

  public async initialize(): Promise<void> {
    AgentLogger.info('PlannerAgent initialized', this.id);
  }

  public async start(): Promise<void> {
    AgentLogger.info('PlannerAgent started', this.id);
  }

  public async pause(): Promise<void> {
    AgentLogger.info('PlannerAgent paused', this.id);
  }

  public async resume(): Promise<void> {
    AgentLogger.info('PlannerAgent resumed', this.id);
  }

  public async stop(): Promise<void> {
    AgentLogger.info('PlannerAgent stopped', this.id);
  }

  public async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`PlannerAgent executing task: ${task.goal}`, this.id);
    
    if (task.goal.toLowerCase().includes('plan') || task.goal.toLowerCase().includes('break down')) {
      const plan = await this.generateExecutionPlan(task.goal);
      return { 
        success: true, 
        output: plan 
      };
    }

    return { 
      success: false, 
      error: 'PlannerAgent can only handle planning tasks.' 
    };
  }

  private async handleGoalSubmission(goal: string): Promise<void> {
    AgentLogger.info(`Handling goal submission: ${goal}`, this.id);
    const plan = await this.generateExecutionPlan(goal);
    
    // Broadcast the plan to other agents
    await this.messageBus.publish({
      senderId: this.id,
      recipientId: 'broadcast',
      type: 'plan_generated',
      payload: { goal, plan },
      timestamp: Date.now()
    });
  }

  private async handleTaskStatusUpdate(taskId: string, status: string, result?: any): Promise<void> {
    AgentLogger.info(`Task ${taskId} updated to ${status}`, this.id);
    // Logic for replanning if a critical task fails
    if (status === 'failed') {
      AgentLogger.warn(`Task ${taskId} failed. Triggering replanning...`, this.id);
      // TODO: Implement replanning logic
    }
  }

  /**
   * Generates a structured execution plan from a high-level goal.
   */
  public async generateExecutionPlan(goal: string): Promise<AgentTask[]> {
    AgentLogger.info(`Generating execution plan for: ${goal}`, this.id);
    
    // 1. Analyze goal (Placeholder for LLM-based analysis)
    const analysis = this.analyzeGoal(goal);
    
    // 2. Decompose into tasks
    const tasks = this.decomposeGoal(goal, analysis);
    
    // 3. Map dependencies
    const tasksWithDependencies = this.mapDependencies(tasks);
    
    // 4. Prioritize
    const prioritizedTasks = this.prioritizeTasks(tasksWithDependencies);

    // Integrate with existing PlanningEngine
    PlanningEngine.createPlan(goal, prioritizedTasks.map(t => t.goal));

    return prioritizedTasks;
  }

  private analyzeGoal(goal: string): any {
    // This would typically involve an LLM call
    // This would typically involve an LLM call to determine required capabilities
    // For now, we'll use a simple keyword-based approach
    const requiredCapabilities: AgentCapability['name'][] = [];

    if (goal.toLowerCase().includes('report') || goal.toLowerCase().includes('document') || goal.toLowerCase().includes('summarize') || goal.toLowerCase().includes('changelog') || goal.toLowerCase().includes('blog')) {
      requiredCapabilities.push('report_generation'); // Example capability from WriterAgent
    }
    if (goal.toLowerCase().includes('research') || goal.toLowerCase().includes('information')) {
      requiredCapabilities.push('information_gathering'); // Example capability from ResearchAgent
    }
    if (goal.toLowerCase().includes('build') || goal.toLowerCase().includes('code') || goal.toLowerCase().includes('implement')) {
      requiredCapabilities.push('code_generation'); // Example capability from CodingAgent
    }
    if (goal.toLowerCase().includes('review') || goal.toLowerCase().includes('audit')) {
      requiredCapabilities.push('code_review'); // Example capability from ReviewerAgent
    }

    // If multiple capabilities are needed, or the task is complex, suggest Orchestrator
    let category = 'general';
    let complexity = 'medium';
    if (requiredCapabilities.length > 1 || goal.split(' ').length > 10) {
      category = 'orchestration';
      complexity = 'high';
    }

    return {
      category,
      complexity,
      requiredCapabilities
    };
  }

  private decomposeGoal(goal: string, analysis: any): AgentTask[] {
    const tasks: AgentTask[] = [];

    if (analysis.category === 'orchestration') {
      // If orchestration is needed, assign the main goal to the OrchestratorAgent
      tasks.push({
        id: `task-${Date.now()}-orchestrate`,
        agentId: 'orchestrator-agent',
        goal: `Orchestrate the execution of: ${goal}`,
        instructions: ['Break down into subtasks', 'Assign to appropriate agents', 'Manage execution'],
        status: 'pending',
        createdAt: Date.now(),
        priority: 1
      });
    } else if (analysis.requiredCapabilities.includes('report_generation')) {
      // If writing is the primary capability, assign to WriterAgent
      tasks.push({
        id: `task-${Date.now()}-write`,
        agentId: 'writer-agent',
        goal: `Generate content for: ${goal}`,
        instructions: ['Produce polished output', 'Collaborate with other agents if needed'],
        status: 'pending',
        createdAt: Date.now(),
        priority: 1
      });
    } else if (analysis.requiredCapabilities.includes('information_gathering')) {
      // If research is the primary capability, assign to ResearchAgent
      tasks.push({
        id: `task-${Date.now()}-research`,
        agentId: 'research-agent',
        goal: `Research information for: ${goal}`,
        instructions: ['Gather data from various sources', 'Summarize findings'],
        status: 'pending',
        createdAt: Date.now(),
        priority: 1
      });
    } else if (analysis.requiredCapabilities.includes('code_generation')) {
      // If coding is the primary capability, assign to CodingAgent
      tasks.push({
        id: `task-${Date.now()}-code`,
        agentId: 'coding-agent',
        goal: `Generate code for: ${goal}`,
        instructions: ['Write code based on requirements', 'Ensure functionality'],
        status: 'pending',
        createdAt: Date.now(),
        priority: 1
      });
    } else if (analysis.requiredCapabilities.includes('code_review')) {
      // If review is the primary capability, assign to ReviewerAgent
      tasks.push({
        id: `task-${Date.now()}-review`,
        agentId: 'reviewer-agent',
        goal: `Review content for: ${goal}`,
        instructions: ['Perform quality checks', 'Provide feedback'],
        status: 'pending',
        createdAt: Date.now(),
        priority: 1
      });
    } else {
      // Default decomposition for general tasks
      tasks.push(
        {
          id: `task-${Date.now()}-1`,
          goal: `Understand requirements for: ${goal}`,
          instructions: ['Analyze the goal', 'Identify necessary steps'],
          status: 'pending',
          createdAt: Date.now(),
          priority: 1
        },
        {
          id: `task-${Date.now()}-2`,
          goal: `Execute primary action for: ${goal}`,
          instructions: ['Perform the main task'],
          status: 'pending',
          createdAt: Date.now(),
          priority: 2
        },
        {
          id: `task-${Date.now()}-3`,
          goal: `Verify and finalize for: ${goal}`,
          instructions: ['Check results', 'Prepare final output'],
          status: 'pending',
          createdAt: Date.now(),
          priority: 3
        }
      );
    }
    return tasks;
  }

  private mapDependencies(tasks: AgentTask[]): AgentTask[] {
    // Set dependencies: task 2 depends on task 1, task 3 depends on task 2
    if (tasks.length >= 3) {
      tasks[1].dependencies = [tasks[0].id];
      tasks[2].dependencies = [tasks[1].id];
    }
    return tasks;
  }

  private prioritizeTasks(tasks: AgentTask[]): AgentTask[] {
    // Sort by priority (lower number = higher priority)
    return tasks.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }
}
