
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
import BrowserAutomation from '../main/BrowserAutomation.js';
import BrowserManager from '../main/BrowserManager.js';

export class BrowserAgent extends BaseAgent {
  constructor(id: AgentId, messageBus: AgentMessageBus, initialContext: AgentContext) {
    const capabilities: AgentCapability[] = [
      {
        name: 'browser_navigation',
        description: 'Navigate to specific URLs and manage tabs.'
      },
      {
        name: 'element_interaction',
        description: 'Click elements, type text into forms, and submit data.'
      },
      {
        name: 'content_extraction',
        description: 'Extract page source, DOM information, and capture screenshots.'
      },
      {
        name: 'page_waiting',
        description: 'Wait for page loads and specific elements to appear.'
      }
    ];
    super(id, 'Browser Agent', capabilities, messageBus, initialContext);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    AgentLogger.debug(`BrowserAgent received message: ${message.type}`, this.id);
    
    switch (message.type) {
      case 'task_assigned':
        if (message.payload.task.agentId === this.id) {
          await this.executeTask(message.payload.task);
        }
        break;
    }
  }

  public async initialize(): Promise<void> {
    AgentLogger.info('BrowserAgent initialized', this.id);
  }

  public async start(): Promise<void> {
    AgentLogger.info('BrowserAgent started', this.id);
  }

  public async pause(): Promise<void> {
    AgentLogger.info('BrowserAgent paused', this.id);
  }

  public async resume(): Promise<void> {
    AgentLogger.info('BrowserAgent resumed', this.id);
  }

  public async stop(): Promise<void> {
    AgentLogger.info('BrowserAgent stopped', this.id);
  }

  public async executeTask(task: AgentTask): Promise<AgentResult> {
    AgentLogger.info(`BrowserAgent executing task: ${task.goal}`, this.id);
    task.status = 'in-progress';
    task.startedAt = Date.now();

    try {
      let result;
      // Parse the goal/instructions to determine the action
      // In a real scenario, this would be guided by an LLM or structured commands
      const goal = task.goal.toLowerCase();
      
      if (goal.includes('navigate') || goal.includes('open')) {
        const url = this.extractUrl(task.goal) || (task.context && task.context.url);
        if (!url) throw new Error('No URL provided for navigation');
        result = await BrowserAutomation.navigate(url);
      } else if (goal.includes('click')) {
        const selector = this.extractSelector(task.goal) || (task.context && task.context.selector);
        if (!selector) throw new Error('No selector provided for click');
        result = await BrowserAutomation.clickElement(selector);
      } else if (goal.includes('type')) {
        const selector = this.extractSelector(task.goal) || (task.context && task.context.selector);
        const text = this.extractText(task.goal) || (task.context && task.context.text);
        if (!selector || !text) throw new Error('Selector or text missing for typing');
        result = await BrowserAutomation.typeText(selector, text);
      } else if (goal.includes('screenshot')) {
        result = await BrowserAutomation.takeScreenshot();
      } else if (goal.includes('extract') || goal.includes('get source')) {
        result = await BrowserAutomation.getPageSource();
      } else if (goal.includes('browser automation')) {
        // Default to a generic navigation or status check for generic browser automation goals
        result = await BrowserAutomation.navigate('about:blank');
      } else {
        throw new Error(`Unsupported browser action in goal: ${task.goal}`);
      }

      const agentResult: AgentResult = {
        success: result.success,
        output: result.data,
        error: result.message,
        executionTime: Date.now() - task.startedAt
      };

      task.status = agentResult.success ? 'completed' : 'failed';
      task.completedAt = Date.now();
      task.result = agentResult;

      // Report back through message bus
      await this.messageBus.publish({
        senderId: this.id,
        recipientId: 'broadcast',
        type: 'task_completed',
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
        type: 'task_failed',
        payload: { taskId: task.id, error: error.message },
        timestamp: Date.now()
      });

      return agentResult;
    }
  }

  private extractUrl(text: string): string | null {
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
  }

  private extractSelector(text: string): string | null {
    // Simple heuristic for selectors in quotes
    const match = text.match(/['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  }

  private extractText(text: string): string | null {
    // Look for text after "type" or in second set of quotes
    const matches = [...text.matchAll(/['"]([^'"]+)['"]/g)];
    return matches.length >= 2 ? matches[1][1] : null;
  }
}
