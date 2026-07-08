import { IPluginAPI } from '../common/types/plugin';
import BrowserManager from './BrowserManager';
import Storage from './Storage';

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

  async executeCommand(id: string, ...args: any[]): Promise<any> {
    const callback = this.commandCallbacks.get(id);
    if (callback) {
      return callback();
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
}
