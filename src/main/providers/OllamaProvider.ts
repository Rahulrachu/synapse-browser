
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

export class OllamaProvider extends BaseAIProvider {
  public readonly type: AIProviderType = 'ollama';

  constructor(config: AIProviderConfig) {
    super(config);
  }

  public async chat(messages: AIChatMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const model = options?.model || this.config.defaultModel || 'llama3';
    const response = await axios.post(
      `${this.config.baseUrl || 'http://localhost:11434'}/api/chat`,
      {
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens
        }
      }
    );

    const data = response.data;
    return {
      content: data.message.content,
      model: data.model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        cost: 0 // Local models are free
      }
    };
  }

  public async streamChat(messages: AIChatMessage[], options?: AIChatOptions, onChunk?: (chunk: AIStreamChunk) => void): Promise<void> {
    console.log('Streaming not yet implemented for Ollama');
  }

  public async checkHealth(): Promise<AIProviderHealth> {
    const start = Date.now();
    try {
      await axios.get(`${this.config.baseUrl || 'http://localhost:11434'}/api/tags`);
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
    try {
      const response = await axios.get(`${this.config.baseUrl || 'http://localhost:11434'}/api/tags`);
      return response.data.models.map((m: any) => ({
        id: m.name,
        name: m.name,
        provider: 'ollama',
        contextWindow: 4096,
        capabilities: ['chat']
      }));
    } catch {
      return [];
    }
  }
}
