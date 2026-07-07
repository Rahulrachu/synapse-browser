
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
import MemorySystem from '../engine/MemorySystem';

export interface WriterTaskContext {
  format?: 'markdown' | 'html' | 'pdf' | 'plain';
  template?: string;
  data?: any;
  audience?: string;
  tone?: string;
}

export class WriterAgent extends BaseAgent {
  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    const capabilities: AgentCapability[] = [
      {
        name: 'report_generation',
        description: 'Generate detailed reports based on research findings or data.'
      },
      {
        name: 'documentation_writing',
        description: 'Produce technical documentation, READMEs, and guides.'
      },
      {
        name: 'content_summarization',
        description: 'Create concise summaries of long-form content or research.'
      },
      {
        name: 'changelog_creation',
        description: 'Generate changelogs and release notes from commit history or task lists.'
      },
      {
        name: 'blog_post_drafting',
        description: 'Draft blog posts, tutorials, and articles.'
      }
    ];
    super(id, 'Writer Agent', capabilities, messageBus, initialContext);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    AgentLogger.debug(`WriterAgent received message: ${message.type}`, this.id);
    
    switch (message.type) {
      case 'task_assigned':
        if (message.payload.task.agentId === this.id) {
          await this.executeTask(message.payload.task);
        }
        break;
      case 'research_completed':
        // Automatically offer to summarize or report on completed research
        AgentLogger.info(`WriterAgent notified of research completion: ${message.payload.topic}`, this.id);
        break;
    }
  }

  public async initialize(): Promise<void> {
    AgentLogger.info('WriterAgent initialized', this.id);
  }

  public async start(): Promise<void> {
    AgentLogger.info('WriterAgent started', this.id);
  }

  public async pause(): Promise<void> {
    AgentLogger.info('WriterAgent paused', this.id);
  }

  public async resume(): Promise<void> {
    AgentLogger.info('WriterAgent resumed', this.id);
  }

  public async stop(): Promise<void> {
    AgentLogger.info('WriterAgent stopped', this.id);
  }

  public async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`WriterAgent executing task: ${task.goal}`, this.id);
    task.status = 'in-progress';
    task.startedAt = Date.now();

    try {
      let output: any;
      const goal = task.goal.toLowerCase();
      const context: WriterTaskContext = task.context || {};

      if (goal.includes('report')) {
        output = await this.generateReport(task.goal, context);
      } else if (goal.includes('documentation') || goal.includes('readme') || goal.includes('guide')) {
        output = await this.generateDocumentation(task.goal, context);
      } else if (goal.includes('summary') || goal.includes('summarize')) {
        output = await this.summarizeContent(task.goal, context);
      } else if (goal.includes('changelog') || goal.includes('release notes')) {
        output = await this.generateChangelog(task.goal, context);
      } else if (goal.includes('blog') || goal.includes('post') || goal.includes('article')) {
        output = await this.draftBlogPost(task.goal, context);
      } else {
        output = await this.genericWrite(task.goal, context);
      }

      const agentResult: AgentResult = {
        success: true,
        output,
        executionTime: Date.now() - task.startedAt
      };

      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = agentResult;

      // Add to Memory System
      MemorySystem.addMemory('project', `Writer completed task: ${task.goal}`, { outputSnippet: typeof output === 'string' ? output.substring(0, 100) : 'Structured data' });

      // Report back through message bus
      await this.messageBus.publish({
        senderId: this.id,
        recipientId: 'broadcast',
        type: 'writing_completed',
        payload: { taskId: task.id, goal: task.goal, result: output },
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
        type: 'writing_failed',
        payload: { taskId: task.id, error: error.message },
        timestamp: Date.now()
      });

      return agentResult;
    }
  }

  private async generateReport(goal: string, context: WriterTaskContext): Promise<string> {
    AgentLogger.info('Generating report...', this.id);
    // Placeholder for LLM-based report generation
    return `# Report: ${goal}\n\nThis is a generated report based on the requested goal.\n\n## Findings\n- Placeholder finding 1\n- Placeholder finding 2\n\n## Conclusion\nGenerated by Synapse Writer Agent.`;
  }

  private async generateDocumentation(goal: string, context: WriterTaskContext): Promise<string> {
    AgentLogger.info('Generating documentation...', this.id);
    return `# Documentation: ${goal}\n\n## Overview\nDescription of the system or feature.\n\n## Usage\nHow to use this component.\n\n## API Reference\nDetailed API descriptions.`;
  }

  private async summarizeContent(goal: string, context: WriterTaskContext): Promise<string> {
    AgentLogger.info('Summarizing content...', this.id);
    return `Summary of: ${goal}\n\nKey points:\n1. Point A\n2. Point B\n3. Point C`;
  }

  private async generateChangelog(goal: string, context: WriterTaskContext): Promise<string> {
    AgentLogger.info('Generating changelog...', this.id);
    return `# Changelog\n\n## [Unreleased]\n### Added\n- New feature X\n### Fixed\n- Bug Y`;
  }

  private async draftBlogPost(goal: string, context: WriterTaskContext): Promise<string> {
    AgentLogger.info('Drafting blog post...', this.id);
    return `# ${goal}\n\nPublished on: ${new Date().toLocaleDateString()}\n\nIntroduction goes here...\n\nBody content...`;
  }

  private async genericWrite(goal: string, context: WriterTaskContext): Promise<string> {
    AgentLogger.info('Performing generic writing task...', this.id);
    return `Generated content for: ${goal}`;
  }
}
