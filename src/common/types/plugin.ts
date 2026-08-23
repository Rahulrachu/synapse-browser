export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  permissions?: string[];
  contributions?: {
    commands?: PluginCommand[];
    panels?: PluginPanel[];
    menus?: PluginMenuItem[];
    shortcuts?: PluginShortcut[];
  };
}

export interface PluginCommand {
  id: string;
  title: string;
  callback: string;
}

export interface PluginPanel {
  id: string;
  title: string;
  icon: string; // Icon name from lucide-react
  component: string; // Component name to be loaded
}

export interface PluginMenuItem {
  id: string;
  label: string;
  parentId: 'file' | 'edit' | 'view' | 'help';
  command?: string;
}

export interface PluginShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  command: string;
}

export interface PluginInfo {
  manifest: PluginManifest;
  path: string;
  enabled: boolean;
  loaded: boolean;
}

export interface IPluginAPI {
  // Main process API
  registerCommand(id: string, callback: () => void): void;
  executeCommand(id: string, ...args: any[]): Promise<any>;
  
  // Storage API
  storage: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
  };
  
  // Browser API
  browser: {
    createTab(url: string): Promise<string>;
    getActiveTab(): Promise<any>;
  };

  // UI API
  notifications: {
    show(title: string, message: string): void;
  };

  // Memory API
  memory: {
    add(content: string, type?: string, metadata?: any, tags?: string[]): Promise<any>;
    search(query: string, k?: number): Promise<any[]>;
  };

  // Task Queue API
  taskQueue: {
    enqueue(job: { name: string; type: string; payload?: Record<string, any>; priority?: number; isPersistent?: boolean; maxRetries?: number; retryDelay?: number; metadata?: Record<string, any> }): Promise<any>;
    getJob(id: string): Promise<any>;
    getAllJobs(filter?: { status?: string; type?: string; name?: string }): Promise<any[]>;
    cancelJob(id: string): Promise<boolean>;
    pauseJob(id: string): Promise<boolean>;
    resumeJob(id: string): Promise<boolean>;
  };
}
