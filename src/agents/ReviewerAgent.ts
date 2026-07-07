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
import { AgentMessageBus } from './AgentMessageBus';
import AgentLogger from './AgentLogger';
import { BugFixingEngine } from '../main/BugFixingEngine';

export interface ReviewTaskContext {
  code: string;
  language: string;
  filePath?: string;
  previousReviewId?: string;
  rules?: string[];
}

export interface ReviewComment {
  line?: number;
  column?: number;
  message: string;
  severity: 'info' | 'warning' | 'error';
  category: 'style' | 'bug' | 'security' | 'performance' | 'documentation';
}

export interface ReviewResult {
  reviewId: string;
  approved: boolean;
  comments: ReviewComment[];
  metrics: {
    score: number;
    issuesFound: number;
  };
}

export class ReviewerAgent extends BaseAgent {
  private bugFixingEngine: BugFixingEngine;

  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    const capabilities: AgentCapability[] = [
      {
        name: 'code_review',
        description: 'Review source code for logic, style, and adherence to best practices.'
      },
      {
        name: 'quality_assurance',
        description: 'Perform quality checks and ensure code meets project standards.'
      },
      {
        name: 'bug_detection',
        description: 'Identify potential bugs and edge cases in proposed code changes.'
      },
      {
        name: 'security_audit',
        description: 'Analyze code for security vulnerabilities and risks.'
      },
      {
        name: 'documentation_review',
        description: 'Verify that code is properly documented and comments are accurate.'
      }
    ];
    super(id, 'Reviewer Agent', capabilities, messageBus, initialContext);
    const projectPath = initialContext.sharedData?.get('projectPath') || process.cwd();
    this.bugFixingEngine = new BugFixingEngine(projectPath);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    AgentLogger.debug(`ReviewerAgent received message: ${message.type}`, this.id);
    
    switch (message.type) {
      case 'task_assigned':
        if (message.payload.task.agentId === this.id) {
          await this.executeTask(message.payload.task);
        }
        break;
      case 'coding_task_completed':
        AgentLogger.info(`ReviewerAgent notified of completed coding task: ${message.payload.taskId}`, this.id);
        break;
    }
  }

  public async initialize(): Promise<void> {
    AgentLogger.info('ReviewerAgent initialized', this.id);
  }

  public async start(): Promise<void> {
    AgentLogger.info('ReviewerAgent started', this.id);
  }

  public async pause(): Promise<void> {
    AgentLogger.info('ReviewerAgent paused', this.id);
  }

  public async resume(): Promise<void> {
    AgentLogger.info('ReviewerAgent resumed', this.id);
  }

  public async stop(): Promise<void> {
    AgentLogger.info('ReviewerAgent stopped', this.id);
  }

  public async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`ReviewerAgent executing task: ${task.goal}`, this.id);
    task.status = 'in-progress';
    task.startedAt = Date.now();

    try {
      let output;
      const goal = task.goal.toLowerCase();
      const code = task.context?.code || '';

      if (goal.includes('security') || goal.includes('audit')) {
        output = await this.performSecurityAudit(code, task.context);
      } else if (goal.includes('quality') || goal.includes('check')) {
        output = await this.checkQuality(code, task.context);
      } else if (goal.includes('documentation') || goal.includes('docs')) {
        output = await this.reviewDocumentation(code, task.context);
      } else {
        output = await this.reviewCode(code, task.context);
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
        type: 'review_completed',
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
        type: 'review_failed',
        payload: { taskId: task.id, error: error.message },
        timestamp: Date.now()
      });

      return agentResult;
    }
  }

  public async reviewCode(code: string, context?: ReviewTaskContext): Promise<ReviewResult> {
    AgentLogger.info('Reviewing code...', this.id);
    const analysis = await this.bugFixingEngine.analyzeCode(code);
    const comments: ReviewComment[] = analysis.bugs.map((b: any) => ({
      line: b.line,
      message: b.message,
      severity: b.severity as any,
      category: 'bug'
    }));

    return {
      reviewId: `rev-${Date.now()}`,
      approved: comments.filter(c => c.severity === 'error').length === 0,
      comments,
      metrics: {
        score: Math.max(0, 100 - comments.length * 10),
        issuesFound: comments.length
      }
    };
  }

  public async performSecurityAudit(code: string, context?: ReviewTaskContext): Promise<ReviewResult> {
    AgentLogger.info('Performing security audit...', this.id);
    const result = await this.reviewCode(code, context);
    result.reviewId = `sec-${Date.now()}`;
    return result;
  }

  public async checkQuality(code: string, context?: ReviewTaskContext): Promise<ReviewResult> {
    AgentLogger.info('Checking code quality...', this.id);
    const result = await this.reviewCode(code, context);
    result.reviewId = `qual-${Date.now()}`;
    return result;
  }

  public async reviewDocumentation(code: string, context?: ReviewTaskContext): Promise<ReviewResult> {
    AgentLogger.info('Reviewing documentation...', this.id);
    const result = await this.reviewCode(code, context);
    result.reviewId = `doc-${Date.now()}`;
    return result;
  }
}
