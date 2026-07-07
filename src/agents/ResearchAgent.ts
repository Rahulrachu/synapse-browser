
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

export interface ResearchFinding {
  source: string;
  content: string;
  timestamp: number;
}

export interface ResearchSummary {
  topic: string;
  findings: ResearchFinding[];
  summary: string;
  sources: string[];
}

export class ResearchAgent extends BaseAgent {
  private findings: Map<string, ResearchFinding[]> = new Map();

  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    const capabilities: AgentCapability[] = [
      {
        name: 'information_gathering',
        description: 'Collect information from multiple web sources.'
      },
      {
        name: 'content_summarization',
        description: 'Summarize research findings into structured formats.'
      },
      {
        name: 'source_tracking',
        description: 'Maintain references and track the origin of research data.'
      },
      {
        name: 'duplicate_detection',
        description: 'Identify and filter redundant information across sources.'
      }
    ];
    super(id, 'Research Agent', capabilities, messageBus, initialContext);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    AgentLogger.debug(`ResearchAgent received message: ${message.type}`, this.id);
    
    switch (message.type) {
      case 'task_assigned':
        if (message.payload.task.agentId === this.id) {
          await this.executeTask(message.payload.task);
        }
        break;
      case 'browser_content_extracted':
        await this.handleBrowserContent(message.payload.url, message.payload.content);
        break;
    }
  }

  public async initialize(): Promise<void> {
    AgentLogger.info('ResearchAgent initialized', this.id);
  }

  public async start(): Promise<void> {
    AgentLogger.info('ResearchAgent started', this.id);
  }

  public async pause(): Promise<void> {
    AgentLogger.info('ResearchAgent paused', this.id);
  }

  public async resume(): Promise<void> {
    AgentLogger.info('ResearchAgent resumed', this.id);
  }

  public async stop(): Promise<void> {
    AgentLogger.info('ResearchAgent stopped', this.id);
  }

  public async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`ResearchAgent executing task: ${task.goal}`, this.id);
    task.status = 'in-progress';
    task.startedAt = Date.now();

    try {
      const topic = this.extractTopic(task.goal);
      const urls = task.context?.urls || [];
      
      if (urls.length === 0) {
        throw new Error('No URLs provided for research');
      }

      // 1. Coordinate with Browser Agent to visit URLs
      for (const url of urls) {
        await this.messageBus.publish({
          senderId: this.id,
          recipientId: 'browser-agent',
          type: 'task_assigned',
          payload: {
            task: {
              id: `research-subtask-${Date.now()}`,
              agentId: 'browser-agent',
              goal: `Navigate to ${url} and extract content`,
              instructions: [`Open ${url}`, 'Extract page source'],
              status: 'pending',
              createdAt: Date.now(),
              context: { url, action: 'extract' }
            }
          },
          timestamp: Date.now()
        });
      }

      // In a real scenario, we'd wait for all browser content to be returned
      // For this implementation, we'll simulate the gathering and summarization
      const summary = this.generateSummary(topic, urls);

      const agentResult: AgentResult = {
        success: true,
        output: summary,
        executionTime: Date.now() - task.startedAt
      };

      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = agentResult;

      // Add findings to Memory System
      MemorySystem.addMemory('project', `Research completed for ${topic}`, { summary });

      // Report back through message bus
      await this.messageBus.publish({
        senderId: this.id,
        recipientId: 'broadcast',
        type: 'research_completed',
        payload: { taskId: task.id, topic, result: summary },
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
        type: 'research_failed',
        payload: { taskId: task.id, error: error.message },
        timestamp: Date.now()
      });

      return agentResult;
    }
  }

  private async handleBrowserContent(url: string, content: string): Promise<void> {
    AgentLogger.info(`Received content from ${url}`, this.id);
    
    // Simple duplicate detection (placeholder)
    if (this.isDuplicate(content)) {
      AgentLogger.info(`Duplicate content detected from ${url}, skipping.`, this.id);
      return;
    }

    const finding: ResearchFinding = {
      source: url,
      content: this.cleanContent(content),
      timestamp: Date.now()
    };

    // Store finding under the current research topic (if any)
    // For now, we'll use a generic bucket
    const currentFindings = this.findings.get('current') || [];
    currentFindings.push(finding);
    this.findings.set('current', currentFindings);
  }

  private extractTopic(goal: string): string {
    return goal.replace(/research|about|on/gi, '').trim();
  }

  private cleanContent(content: string): string {
    // Basic cleaning logic
    return content.substring(0, 1000).trim();
  }

  private isDuplicate(content: string): boolean {
    // Placeholder for actual duplicate detection (e.g., hash comparison or similarity)
    return false;
  }

  private generateSummary(topic: string, urls: string[]): ResearchSummary {
    // Mock summary generation
    return {
      topic,
      findings: (this.findings.get('current') || []).map(f => ({
        source: f.source,
        content: f.content,
        timestamp: f.timestamp
      })),
      summary: `Research findings for ${topic} from ${urls.length} sources.`,
      sources: urls
    };
  }
}
