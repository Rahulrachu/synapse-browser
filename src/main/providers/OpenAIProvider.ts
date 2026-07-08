
import { BaseAIProvider } from '../AIModelProviderManager';
import { 
  AIProviderType, 
  AIModel, 
  AIProviderConfig, 
  AIChatMessage, 
  AIChatOptions, 
  AIChatResponse, 
  AIStreamChunk,
  AIProviderHealth
} from '../../common/types/ai';
import axios from 'axios';

export class OpenAIProvider extends BaseAIProvider {
  public readonly type: AIProviderType = 'openai';

  constructor(config: AIProviderConfig) {
    super(config);
  }

  public async chat(messages: AIChatMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const model = options?.model || this.config.defaultModel || 'gpt-3.5-turbo';
    const response = await axios.post(
      `${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
      {
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        cost: this.calculateCost(data.model, data.usage.prompt_tokens, data.usage.completion_tokens)
      }
    };
  }

  public async streamChat(messages: AIChatMessage[], options?: AIChatOptions, onChunk?: (chunk: AIStreamChunk) => void): Promise<void> {
    // Implementation for streaming would go here using fetch or a library that supports SSE
    console.log('Streaming not yet implemented for OpenAI');
  }

  public async checkHealth(): Promise<AIProviderHealth> {
    const start = Date.now();
    try {
      await axios.get(`${this.config.baseUrl || 'https://api.openai.com/v1'}/models`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
      });
      return {
        providerId: this.config.id,
        status: 'healthy',
        latency: Date.now() - start,
        lastChecked: Date.now()
      };
    } catch (error: any) {
      return {
        providerId: this.config.id,
        status: 'unreachable',
        latency: Date.now() - start,
        lastChecked: Date.now(),
        error: error.message
      };
    }
  }

  public async getAvailableModels(): Promise<AIModel[]> {
    return [
      { id: 'gpt-4', name: 'GPT-4', provider: 'openai', contextWindow: 8192, capabilities: ['chat', 'vision'] },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', contextWindow: 4096, capabilities: ['chat'] }
    ];
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Simplified cost calculation
    const rates: Record<string, { input: number, output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };
    const rate = rates[model] || { input: 0, output: 0 };
    return (promptTokens / 1000) * rate.input + (completionTokens / 1000) * rate.output;
  }
}
