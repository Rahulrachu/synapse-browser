import { IPluginAPI } from '../common/types/plugin';
import { Skill } from '../common/types/skill';
import { SynapseEvent, SubscriptionOptions, EventCallback } from '../common/types/event';
import BrowserManager from './BrowserManager';
import Storage from './Storage';
import SkillRegistry from './SkillRegistry';
import EventBus from './EventBus';
import PermissionManager from './PermissionManager';
import { JobStatus } from '../common/types/job';

export class PluginAPI implements IPluginAPI {
  private pluginId: string;
  private commandCallbacks: Map<string, () => void> = new Map();

  constructor(pluginId: string) {
    this.pluginId = pluginId;
  }

  registerCommand(id: string, callback: () => void): void {
    this.commandCallbacks.set(id, callback);
  }

  async executeWorkflowAction(id: string, params: any): Promise<void> {
    const callback = this.commandCallbacks.get(id);
    if (callback) {
      await callback();
    }
  }

  registerSkill(skill: Omit<Skill, 'source' | 'author' | 'version'>): void {
    SkillRegistry.registerSkill({
      ...skill,
      author: `Plugin: ${this.pluginId}`,
      version: '1.0.0',
      source: 'plugin',
      enabled: true
    } as Skill);
  }

  events = {
    publish: (type: string, payload: any, category: any = 'plugin') => {
      EventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        category,
        source: `plugin:${this.pluginId}`,
        payload,
        timestamp: Date.now(),
        priority: 0
      });
    },
    subscribe: (type: string, callback: EventCallback, options?: SubscriptionOptions) => {
      return EventBus.subscribe(type, callback, options);
    }
  };

  async executeCommand(id: string, ...args: any[]): Promise<any> {
    const callback = this.commandCallbacks.get(id);
    if (callback) {
      // Check for 'plugin:command' permission
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'command');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'command',
          reason: `Execute plugin command: ${id}`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for command: ${id}`);
      }
      return await callback();
    }
    throw new Error(`Command ${id} not found in plugin ${this.pluginId}`);
  }

  storage = {
    get: async (key: string) => {
      return Storage.get(`plugin:${this.pluginId}:${key}`);
    },
    set: async (key: string, value: any) => {
      return Storage.set(`plugin:${this.pluginId}:${key}`, value);
    }
  };

  browser = {
    createTab: async (url: string) => {
      return BrowserManager.createTab(url);
    },
    getActiveTab: async () => {
      return BrowserManager.getActiveTab();
    }
  };

  notifications = {
    show: (title: string, message: string) => {
      // Integration with NotificationCenter would go here
      console.log(`Notification from ${this.pluginId}: ${title} - ${message}`);
    }
  };

  memory = {
    add: async (content: string, type: any = 'short_term', metadata: any = {}, tags: string[] = []) => {
      // Check for 'memory:write' permission
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'memory:write');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'memory:write',
          reason: `Plugin ${this.pluginId} wants to add a memory`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for memory:write`);
      }
      const { default: MemoryManager } = await import('../engine/MemoryManager');
      return await MemoryManager.addMemory({
        content,
        type,
        metadata,
        tags,
        source: `plugin:${this.pluginId}`
      });
    },
    search: async (query: string, k: number = 5) => {
      // Check for 'memory:read' permission
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'memory:read');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'memory:read',
          reason: `Plugin ${this.pluginId} wants to search memories`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for memory:read`);
      }
      const { default: MemoryManager } = await import('../engine/MemoryManager');
      return await MemoryManager.searchMemories(query, { k });
    }
  };

  taskQueue = {
    enqueue: async (job: { name: string; type: string; payload?: Record<string, any>; priority?: number; isPersistent?: boolean; maxRetries?: number; retryDelay?: number; metadata?: Record<string, any> }) => {
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'task-queue:write');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'task-queue:write',
          reason: `Plugin ${this.pluginId} wants to enqueue a job`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for task-queue:write`);
      }
      const { default: TaskQueueManager } = await import('./TaskQueueManager');
      return await TaskQueueManager.enqueueJob(job);
    },
    getJob: async (id: string) => {
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'task-queue:read');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'task-queue:read',
          reason: `Plugin ${this.pluginId} wants to get job details`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for task-queue:read`);
      }
      const { default: TaskQueueManager } = await import('./TaskQueueManager');
      return await TaskQueueManager.getJob(id);
    },
    getAllJobs: async (filter?: { status?: JobStatus; type?: string; name?: string }) => {
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'task-queue:read');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'task-queue:read',
          reason: `Plugin ${this.pluginId} wants to get all jobs`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for task-queue:read`);
      }
      const { default: TaskQueueManager } = await import('./TaskQueueManager');
      return await TaskQueueManager.getAllJobs(filter);
    },
    cancelJob: async (id: string) => {
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'task-queue:write');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'task-queue:write',
          reason: `Plugin ${this.pluginId} wants to cancel a job`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for task-queue:write`);
      }
      const { default: TaskQueueManager } = await import('./TaskQueueManager');
      return await TaskQueueManager.cancelJob(id);
    },
    pauseJob: async (id: string) => {
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'task-queue:write');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'task-queue:write',
          reason: `Plugin ${this.pluginId} wants to pause a job`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for task-queue:write`);
      }
      const { default: TaskQueueManager } = await import('./TaskQueueManager');
      return await TaskQueueManager.pauseJob(id);
    },
    resumeJob: async (id: string) => {
      const hasPermission = await PermissionManager.checkPermission(`plugin:${this.pluginId}`, 'task-queue:write');
      if (!hasPermission) {
        const granted = await PermissionManager.requestPermission({
          id: `req-${Date.now()}`,
          scope: `plugin:${this.pluginId}`,
          resource: 'task-queue:write',
          reason: `Plugin ${this.pluginId} wants to resume a job`,
          timestamp: Date.now()
        });
        if (!granted) throw new Error(`Permission denied for task-queue:write`);
      }
      const { default: TaskQueueManager } = await import('./TaskQueueManager');
      return await TaskQueueManager.resumeJob(id);
    },
  };
}
