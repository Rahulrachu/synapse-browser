import { contextBridge, ipcRenderer } from 'electron';

// Whitelist of valid IPC channels for communication from renderer to main
const VALID_INVOKE_CHANNELS = [
  'get-downloads', 'open-downloads-folder', 'clear-downloads',
  'resize-browser-area', 'set-browser-view-visibility',
  'get-all-tabs', 'create-tab', 'close-tab', 'set-active-tab', 'navigate-to', 'go-back', 'go-forward', 'reload', 'duplicate-tab',
  'get-diagnostics', 'get-system-stats',
  'get-git-status', 'get-git-commits', 'get-git-branches', 'git-commit', 'git-push', 'git-pull', 'git-create-branch', 'git-switch-branch',
  'read-file', 'create-file', 'create-directory', 'delete-file',
  'create-project', 'analyze-repository', 'download-analysis-report',
  'get-bookmarks', 'add-bookmark', 'delete-bookmark',
  'create-research-collection', 'delete-research-collection', 'add-page-to-collection', 'remove-page-from-collection',
  'get-layouts', 'create-layout', 'delete-layout', 'get-layout',
  'get-ai-services', 'add-ai-service', 'get-conversation', 'get-conversations', 'create-conversation', 'add-message', 'ai-service-send-message',
  'ai:get-usage', 'ai:get-providers', 'ai:get-models', 'ai:set-config', 'ai:add-provider', 'ai:chat',
  'agent:run', 'agent:cancel', 'agent:history',
  'prompts:get-all', 'prompts:get-stats', 'prompts:save', 'prompts:delete', 'prompts:toggle-favorite', 'prompts:import',
  'memory:search', 'memory:get-by-type', 'memory:add', 'memory:delete', 'memory:update', 'memory:export', 'memory:import',
  'task-queue:get-all', 'task-queue:cancel', 'task-queue:pause', 'task-queue:resume', 'task-queue:clear-completed',
  'terminal-execute',
  'marketplace:search', 'marketplace:install', 'marketplace:uninstall', 'marketplace:check-updates',
  'plugin:get-all', 'plugin:enable', 'plugin:disable', 'plugin:reload',
  'skill:get-all', 'skill:search', 'skill:toggle',
  'workflow:get-all', 'workflow:save', 'workflow:delete', 'workflow:execute', 'workflow:import', 'workflow:export',
  'permission:get-all', 'permission:get-history', 'permission:update', 'permission:request',
  'agent-list', 'agent:get-history', 'agent:pause-task', 'agent:resume-task', 'agent:cancel-task', 'agent:retry-task',
  'delete-session', 'delete-tab-group', 'add-tab-to-group', 'remove-tab-from-group',
  'search:query', 'search:get-stats', 'search:get-providers', 'search:reindex'
];

const VALID_SEND_CHANNELS = [
  'command-new-file', 'command-open-file', 'command-save-file', 'command-analyze-project', 'command-project-summary',
  'command-git-status', 'command-git-commit', 'command-git-push',
  'command-explain-code', 'command-generate-docs', 'command-find-bugs', 'command-open-settings',
  'file-selected', 'open-recent-item', 'open-url', 'navigate-to-symbol',
  'event-bus:publish',
  'pause-download', 'resume-download', 'cancel-download', 'retry-download', 'open-file', 'open-folder'
];

const electronAPI = {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      if (VALID_INVOKE_CHANNELS.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      console.warn(`Blocked unauthorized IPC invoke on channel: ${channel}`);
      return Promise.reject(new Error(`Unauthorized IPC channel: ${channel}`));
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      // We allow listening to any channel for now, as it's main -> renderer
      const subscription = (event: any, ...args: any[]) => func(...args);
      (func as any)._subscription = subscription;
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      const subscription = (func as any)._subscription || func;
      ipcRenderer.removeListener(channel, subscription);
    },
    publish: (channel: string, ...args: any[]) => {
      if (VALID_SEND_CHANNELS.includes(channel)) {
        return ipcRenderer.send(channel, ...args);
      }
      console.warn(`Blocked unauthorized IPC send on channel: ${channel}`);
    },
    send: (channel: string, ...args: any[]) => {
      if (VALID_SEND_CHANNELS.includes(channel)) {
        return ipcRenderer.send(channel, ...args);
      }
      console.warn(`Blocked unauthorized IPC send on channel: ${channel}`);
    },
  },
  // Shorthands
  invoke: (channel: string, ...args: any[]) => {
    if (VALID_INVOKE_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Unauthorized IPC channel: ${channel}`));
  },
  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (event: any, ...args: any[]) => func(...args);
    (func as any)._subscription = subscription;
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  removeListener: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (func as any)._subscription || func;
    ipcRenderer.removeListener(channel, subscription);
  },
  send: (channel: string, ...args: any[]) => {
    if (VALID_SEND_CHANNELS.includes(channel)) {
      return ipcRenderer.send(channel, ...args);
    }
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);
