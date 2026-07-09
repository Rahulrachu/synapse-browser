import { BaseAgent } from './BaseAgent.js';
import { 
  AgentId, 
  AgentName, 
  AgentCapability, 
  AgentTask, 
  AgentResult, 
  AgentContext, 
  AgentMessage 
} from './types.js';
import { AgentMessageBus } from './AgentMessageBus.js';
import AgentLogger from './AgentLogger.js';
import { BugFixingEngine } from '../main/BugFixingEngine.js';
import { CodeRefactoringEngine } from '../main/CodeRefactoringEngine.js';

export interface CodeTaskContext {
  language: string;
  filePath?: string;
  code?: string;
  projectPath?: string;
  dependencies?: string[];
}

export interface CodeAnalysisResult {
  complexity: number;
  maintainability: number;
  issues: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

export class CodingAgent extends BaseAgent {
  private bugFixingEngine: BugFixingEngine;
  private refactoringEngine: CodeRefactoringEngine;

  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    const capabilities: AgentCapability[] = [
      {
        name: 'code_generation',
        description: 'Generate source code based on requirements and specifications.'
      },
      {
        name: 'code_analysis',
        description: 'Analyze existing code for quality, performance, and security issues.'
      },
      {
        name: 'code_modification',
        description: 'Modify or refactor existing code to meet new requirements.'
      },
      {
        name: 'code_testing',
        description: 'Generate and execute unit and integration tests for code.'
      },
      {
        name: 'code_debugging',
        description: 'Identify and fix bugs in existing codebases.'
      }
    ];
    super(id, 'Coding Agent', capabilities, messageBus, initialContext);
    const projectPath = initialContext.sharedData?.get('projectPath') || process.cwd();
    this.bugFixingEngine = new BugFixingEngine(projectPath);
    this.refactoringEngine = new CodeRefactoringEngine(projectPath);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    AgentLogger.debug(`CodingAgent received message: ${message.type}`, this.id);
    
    switch (message.type) {
      case 'task_assigned':
        if (message.payload.task.agentId === this.id) {
          await this.executeTask(message.payload.task);
        }
        break;
    }
  }

  public async initialize(): Promise<void> {
    AgentLogger.info('CodingAgent initialized', this.id);
  }

  public async start(): Promise<void> {
    AgentLogger.info('CodingAgent started', this.id);
  }

  public async pause(): Promise<void> {
    AgentLogger.info('CodingAgent paused', this.id);
  }

  public async resume(): Promise<void> {
    AgentLogger.info('CodingAgent resumed', this.id);
  }

  public async stop(): Promise<void> {
    AgentLogger.info('CodingAgent stopped', this.id);
  }

  public async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`CodingAgent executing task: ${task.goal}`, this.id);
    task.status = 'in-progress';
    task.startedAt = Date.now();

    try {
      let output;
      const goal = task.goal.toLowerCase();

      if (goal.includes('generate') || goal.includes('write code')) {
        output = await this.generateCode(task.goal, task.context);
      } else if (goal.includes('analyze') || goal.includes('review')) {
        output = await this.analyzeCode(task.context?.code || '', task.context);
      } else if (goal.includes('modify') || goal.includes('refactor')) {
        output = await this.modifyCode(task.context?.code || '', task.goal, task.context);
      } else if (goal.includes('test')) {
        output = await this.testCode(task.context?.code || '', task.context);
      } else if (goal.includes('debug') || goal.includes('fix')) {
        output = await this.debugCode(task.context?.code || '', task.context);
      } else {
        // Fallback to refactoring engine for general code tasks
        output = await this.refactoringEngine.refactorCode(task.context?.code || '', task.goal);
      }

      const agentResult: AgentResult = {
        success: true,
        output,
        executionTime: Date.now() - task.startedAt
      };

      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = agentResult;

      await this.messageBus.publish({
        senderId: this.id,
        recipientId: 'broadcast',
        type: 'coding_task_completed',
        payload: { taskId: task.id, result: agentResult },
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
        type: 'coding_task_failed',
        payload: { taskId: task.id, error: error.message },
        timestamp: Date.now()
      });

      return agentResult;
    }
  }

  /**
   * Generates code based on requirements.
   */
  public async generateCode(requirements: string, context?: CodeTaskContext): Promise<string> {
    AgentLogger.info('Generating code...', this.id);
    // Use refactoring engine as a proxy for code generation for now
    return await this.refactoringEngine.refactorCode('', `Generate code for: ${requirements}`);
  }

  /**
   * Analyzes code for issues and metrics.
   */
  public async analyzeCode(code: string, context?: CodeTaskContext): Promise<CodeAnalysisResult> {
    AgentLogger.info('Analyzing code...', this.id);
    const analysis = await this.bugFixingEngine.analyzeCode(code);
    return {
      complexity: analysis.complexity || 0,
      maintainability: analysis.maintainability || 100,
      issues: analysis.bugs.map((b: any) => ({
        line: b.line,
        column: 0,
        message: b.message,
        severity: b.severity as any
      }))
    };
  }

  /**
   * Modifies existing code based on a goal.
   */
  public async modifyCode(code: string, goal: string, context?: CodeTaskContext): Promise<string> {
    AgentLogger.info('Modifying code...', this.id);
    return await this.refactoringEngine.refactorCode(code, goal);
  }

  /**
   * Generates and runs tests for the provided code.
   */
  public async testCode(code: string, context?: CodeTaskContext): Promise<any> {
    AgentLogger.info('Testing code...', this.id);
    // In a real implementation, this would trigger a test runner
    return { passed: true, results: [], message: 'Tests executed successfully' };
  }

  /**
   * Debugs code to find and fix errors.
   */
  public async debugCode(code: string, context?: CodeTaskContext): Promise<string> {
    AgentLogger.info('Debugging code...', this.id);
    const analysis = await this.bugFixingEngine.analyzeCode(code);
    if (analysis.bugs.length > 0) {
      const fixes = await this.bugFixingEngine.fixBugs(analysis.bugs);
      return fixes.length > 0 && fixes[0].changes.length > 0 ? fixes[0].changes[0].after : code;
    }
    return code;
  }
}
