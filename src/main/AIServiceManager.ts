import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export type AIService = 'chatgpt' | 'claude' | 'gemini' | 'deepseek' | 'grok' | 'openrouter' | 'ollama' | 'lm-studio';

export interface AIServiceConfig {
  id: string;
  service: AIService;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
  createdAt: number;
}

export interface AIConversation {
  id: string;
  serviceId: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  lastModified: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

class AIServiceManager {
  private dataDir: string;
  private configFile: string;
  private conversationsDir: string;
  private services: Map<string, AIServiceConfig> = new Map();

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.configFile = path.join(this.dataDir, 'ai-services.json');
    this.conversationsDir = path.join(this.dataDir, 'conversations');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.conversationsDir)) {
      fs.mkdirSync(this.conversationsDir, { recursive: true });
    }

    this.loadServices();
  }

  private loadServices(): void {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
        data.forEach((service: AIServiceConfig) => {
          this.services.set(service.id, service);
        });
      }
    } catch (error) {
      console.error('Failed to load AI services:', error);
    }
  }

  addService(service: AIService, name: string, config: Partial<AIServiceConfig> = {}): AIServiceConfig {
    const serviceConfig: AIServiceConfig = {
      id: Date.now().toString(),
      service,
      name,
      enabled: true,
      createdAt: Date.now(),
      ...config,
    };
    this.services.set(serviceConfig.id, serviceConfig);
    this.saveServices();
    return serviceConfig;
  }

  getServices(): AIServiceConfig[] {
    return Array.from(this.services.values());
  }

  getService(id: string): AIServiceConfig | undefined {
    return this.services.get(id);
  }

  getServicesByType(service: AIService): AIServiceConfig[] {
    return Array.from(this.services.values()).filter((s) => s.service === service);
  }

  updateService(id: string, updates: Partial<AIServiceConfig>): boolean {
    const service = this.services.get(id);
    if (service) {
      Object.assign(service, updates);
      this.saveServices();
      return true;
    }
    return false;
  }

  deleteService(id: string): boolean {
    if (this.services.delete(id)) {
      this.saveServices();
      return true;
    }
    return false;
  }

  enableService(id: string): boolean {
    return this.updateService(id, { enabled: true });
  }

  disableService(id: string): boolean {
    return this.updateService(id, { enabled: false });
  }

  createConversation(serviceId: string, title: string = 'New Conversation'): AIConversation {
    const conversation: AIConversation = {
      id: Date.now().toString(),
      serviceId,
      title,
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    this.saveConversation(conversation);
    return conversation;
  }

  getConversation(id: string): AIConversation | undefined {
    try {
      const filePath = path.join(this.conversationsDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
    return undefined;
  }

  getConversations(serviceId?: string): AIConversation[] {
    try {
      const files = fs.readdirSync(this.conversationsDir);
      const conversations: AIConversation[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.conversationsDir, file);
          const conv = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (!serviceId || conv.serviceId === serviceId) {
            conversations.push(conv);
          }
        }
      }

      return conversations.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return [];
    }
  }

  addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string): AIMessage | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return null;

    const message: AIMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
    };

    conversation.messages.push(message);
    conversation.lastModified = Date.now();
    this.saveConversation(conversation);

    return message;
  }

  updateConversationTitle(id: string, title: string): boolean {
    const conversation = this.getConversation(id);
    if (conversation) {
      conversation.title = title;
      conversation.lastModified = Date.now();
      this.saveConversation(conversation);
      return true;
    }
    return false;
  }

  deleteConversation(id: string): boolean {
    try {
      const filePath = path.join(this.conversationsDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
    return false;
  }

  private saveServices(): void {
    try {
      fs.writeFileSync(
        this.configFile,
        JSON.stringify(Array.from(this.services.values()), null, 2)
      );
    } catch (error) {
      console.error('Failed to save AI services:', error);
    }
  }

  private saveConversation(conversation: AIConversation): void {
    try {
      const filePath = path.join(this.conversationsDir, `${conversation.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }
}

export default new AIServiceManager();
