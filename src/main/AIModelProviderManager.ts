
import { ipcMain } from 'electron';
import { 
  AIProviderType, 
  AIModel, 
  AIProviderConfig, 
  AIChatMessage, 
  AIChatOptions, 
  AIChatResponse, 
  AIStreamChunk,
  AIProviderHealth
} from '../common/types/ai.js';
import EventBus from './EventBus.js';
import AIServiceManager from './AIServiceManager.js';
import PromptManager from './PromptManager.js';

export abstract class BaseAIProvider {
  public abstract readonly type: AIProviderType;
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  public getConfig(): AIProviderConfig {
    return this.config;
  }

  public updateConfig(updates: Partial<AIProviderConfig>) {
    this.config = { ...this.config, ...updates };
  }

  public abstract chat(messages: AIChatMessage[], options?: AIChatOptions): Promise<AIChatResponse>;
  public abstract streamChat(messages: AIChatMessage[], options?: AIChatOptions, onChunk?: (chunk: AIStreamChunk) => void): Promise<void>;
  public abstract checkHealth(): Promise<AIProviderHealth>;
  public abstract getAvailableModels(): Promise<AIModel[]>;
}

class AIModelProviderManager {
  private providers: Map<string, BaseAIProvider> = new Map();
  private usageStats: Map<string, any> = new Map();

  constructor() {
    this.setupIPCHandlers();
  }

  private setupIPCHandlers() {
    ipcMain.handle('ai:get-providers', () => this.getProvidersInfo());
    ipcMain.handle('ai:get-models', (_, providerId: string) => this.getModels(providerId));
    ipcMain.handle('ai:chat', async (_, providerId: string, messages: AIChatMessage[], options?: AIChatOptions) => {
      return this.chat(providerId, messages, options);
    });
    ipcMain.handle('ai:set-config', (_, providerId: string, updates: Partial<AIProviderConfig>) => {
      const provider = this.getProvider(providerId);
      if (provider) {
        provider.updateConfig(updates);
        return true;
      }
      return false;
    });
    ipcMain.handle('ai:check-health', async (_, providerId: string) => {
      const provider = this.getProvider(providerId);
      if (provider) return await provider.checkHealth();
      return null;
    });
    ipcMain.handle('ai:get-usage', () => Array.from(this.usageStats.values()));
    ipcMain.handle('ai:chat-with-prompt', async (_, providerId: string, promptId: string, variables: Record<string, string>, options?: AIChatOptions) => {
      return this.chatWithPrompt(providerId, promptId, variables, options);
    });
  }

  public async chatWithPrompt(providerId: string, promptId: string, variables: Record<string, string>, options?: AIChatOptions): Promise<AIChatResponse> {
    // Use the public method of PromptManager
    const prompt = (PromptManager as any).getPromptById(promptId);
    if (!prompt) throw new Error(`Prompt ${promptId} not found`);

    let content = prompt.content;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    const messages: AIChatMessage[] = [
      { role: prompt.type === 'system' ? 'system' : 'user', content }
    ];

    return this.chat(providerId, messages, options);
  }

  public registerProvider(provider: BaseAIProvider) {
    this.providers.set(provider.getConfig().id, provider);
    console.log(`[AIModelProviderManager] Registered provider: ${provider.getConfig().name} (${provider.type})`);
  }

  public getProvider(id: string): BaseAIProvider | undefined {
    return this.providers.get(id);
  }

  public async chat(providerId: string, messages: AIChatMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const provider = this.getProvider(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);
    
    const response = await provider.chat(messages, options);
    this.trackUsage(providerId, response.usage);
    return response;
  }

  private trackUsage(providerId: string, usage: AIChatResponse['usage']) {
    const stats = this.usageStats.get(providerId) || { providerId, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 };
    stats.promptTokens += usage.promptTokens;
    stats.completionTokens += usage.completionTokens;
    stats.totalTokens += usage.totalTokens;
    stats.cost += usage.cost || 0;
    this.usageStats.set(providerId, stats);
    
    EventBus.publish({
      id: `usage-${Date.now()}`,
      type: 'ai:usage-updated',
      category: 'system',
      source: 'AIModelProviderManager',
      payload: stats,
      timestamp: Date.now(),
      priority: 1
    });
  }

  private getProvidersInfo() {
    return Array.from(this.providers.values()).map(p => ({
      id: p.getConfig().id,
      name: p.getConfig().name,
      type: p.type,
      enabled: p.getConfig().enabled
    }));
  }

  private async getModels(providerId: string): Promise<AIModel[]> {
    const provider = this.getProvider(providerId);
    if (!provider) return [];
    return provider.getAvailableModels();
  }
}

export default new AIModelProviderManager();
