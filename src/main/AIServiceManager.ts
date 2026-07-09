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

/**
 * Manages AI service configurations and conversations, including persistence to the file system.
 */
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

  /**
   * Loads AI service configurations from the file system.
   * If the configuration file does not exist or is invalid, it logs an error and initializes an empty set of services.
   */
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

  /**
   * Adds a new AI service configuration.
   * @param service The type of AI service (e.g., 'chatgpt', 'claude').
   * @param name A user-friendly name for the service.
   * @param config Optional partial configuration to apply to the new service.
   * @returns The newly created and saved AI service configuration.
   */
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

  /**
   * Retrieves all registered AI service configurations.
   * @returns An array of all AI service configurations.
   */
  getServices(): AIServiceConfig[] {
    return Array.from(this.services.values());
  }

  /**
   * Retrieves a specific AI service configuration by its ID.
   * @param id The unique identifier of the AI service.
   * @returns The AI service configuration if found, otherwise `undefined`.
   */
  getService(id: string): AIServiceConfig | undefined {
    return this.services.get(id);
  }

  /**
   * Retrieves AI service configurations filtered by service type.
   * @param service The type of AI service to filter by.
   * @returns An array of AI service configurations matching the specified type.
   */
  getServicesByType(service: AIService): AIServiceConfig[] {
    return Array.from(this.services.values()).filter((s) => s.service === service);
  }

  /**
   * Updates an existing AI service configuration.
   * @param id The unique identifier of the AI service to update.
   * @param updates A partial object containing the fields to update.
   * @returns `true` if the service was updated successfully, `false` otherwise.
   */
  updateService(id: string, updates: Partial<AIServiceConfig>): boolean {
    const service = this.services.get(id);
    if (service) {
      Object.assign(service, updates);
      this.saveServices();
      return true;
    }
    return false;
  }

  /**
   * Deletes an AI service configuration by its ID.
   * @param id The unique identifier of the AI service to delete.
   * @returns `true` if the service was deleted successfully, `false` otherwise.
   */
  deleteService(id: string): boolean {
    if (this.services.delete(id)) {
      this.saveServices();
      return true;
    }
    return false;
  }

  /**
   * Enables an AI service.
   * @param id The unique identifier of the AI service to enable.
   * @returns `true` if the service was enabled successfully, `false` otherwise.
   */
  enableService(id: string): boolean {
    return this.updateService(id, { enabled: true });
  }

  /**
   * Disables an AI service.
   * @param id The unique identifier of the AI service to disable.
   * @returns `true` if the service was disabled successfully, `false` otherwise.
   */
  disableService(id: string): boolean {
    return this.updateService(id, { enabled: false });
  }

  /**
   * Creates a new AI conversation for a given service.
   * @param serviceId The ID of the AI service this conversation belongs to.
   * @param title An optional title for the conversation. Defaults to 'New Conversation'.
   * @returns The newly created and saved AI conversation.
   */
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

  /**
   * Retrieves a specific AI conversation by its ID.
   * @param id The unique identifier of the conversation.
   * @returns The AI conversation if found, otherwise `undefined`.
   */
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

  /**
   * Retrieves all AI conversations, optionally filtered by service ID.
   * Conversations are sorted by `lastModified` in descending order.
   * @param serviceId Optional. The ID of the AI service to filter conversations by.
   * @returns An array of AI conversations.
   */
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

  /**
   * Adds a new message to an existing conversation.
   * @param conversationId The ID of the conversation to add the message to.
   * @param role The role of the message sender ('user', 'assistant', or 'system').
   * @param content The text content of the message.
   * @returns The newly added message if successful, otherwise `null`.
   */
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

  /**
   * Updates the title of an existing conversation.
   * @param id The ID of the conversation to update.
   * @param title The new title for the conversation.
   * @returns `true` if the title was updated successfully, `false` otherwise.
   */
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

  /**
   * Deletes an AI conversation by its ID.
   * @param id The unique identifier of the conversation to delete.
   * @returns `true` if the conversation was deleted successfully, `false` otherwise.
   */
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

  /**
   * Saves the current state of AI service configurations to the file system.
   * This method is called internally after any modification to the services.
   */
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

  /**
   * Saves a single AI conversation to its respective file.
   * This method is called internally after any modification to a conversation.
   * @param conversation The AI conversation object to save.
   */
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
