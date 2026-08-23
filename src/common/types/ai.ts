
export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProviderType;
  contextWindow: number;
  capabilities: string[];
  pricing?: {
    input: number; // per 1k tokens
    output: number; // per 1k tokens
  };
}

export interface AIProviderConfig {
  id: string;
  type: AIProviderType;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  models: AIModel[];
  defaultModel?: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface AIChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
  };
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  usage?: AIChatResponse['usage'];
}

export interface AIProviderHealth {
  providerId: string;
  status: 'healthy' | 'degraded' | 'unreachable';
  latency: number;
  lastChecked: number;
  error?: string;
}
