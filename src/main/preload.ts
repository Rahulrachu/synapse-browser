import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_INVOKE_CHANNELS = [
  'create-tab', 'close-tab', 'set-active-tab', 'duplicate-tab', 'get-all-tabs',
  'set-browser-area-bounds', 'set-browser-view-visibility',
  'navigate-to', 'go-back', 'go-forward', 'reload', 'stop-loading',
  'get-current-url', 'get-current-title',
  'get-bookmarks', 'add-bookmark', 'delete-bookmark',
  'get-history', 'add-to-history', 'clear-history',
  'get-notes', 'save-note', 'delete-note',
  'get-prompts', 'save-prompt', 'delete-prompt',
  'get-sessions', 'get-session', 'save-session', 'update-session', 'delete-session', 'rename-session',
  'create-tab-group', 'get-tab-groups', 'delete-tab-group', 'add-tab-to-group', 'remove-tab-from-group',
  'pin-tab', 'unpin-tab', 'sleep-tab', 'wake-tab', 'set-tab-color', 'get-tab-properties',
  'create-layout', 'get-layouts', 'get-layout', 'update-layout', 'delete-layout', 'rename-layout',
  'create-conversation', 'get-conversation', 'get-conversations', 'add-message', 'update-conversation-title', 'delete-conversation',
  'add-project', 'get-projects', 'get-project', 'update-project-last-opened', 'delete-project', 'rename-project',
  'get-project-files', 'read-file', 'write-file', 'delete-file', 'create-file', 'create-directory',
  'set-git-project-path', 'get-git-status', 'get-git-commits', 'git-commit', 'git-push', 'git-pull', 'git-create-branch', 'git-switch-branch', 'get-git-branches', 'git-get-diff',
  'update-context', 'get-context', 'get-context-summary',
  'create-plan', 'update-plan-task', 'get-current-plan',
  'terminal-execute', 'get-diagnostics', 'get-system-stats',
  'agent:run', 'agent:cancel', 'agent:history'
];

const ALLOWED_RECEIVE_CHANNELS = [
  'agent:event', 'tab-updated', 'tabs-updated', 'project-creation-progress'
];

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => {
    if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Unauthorized IPC channel: ${channel}`));
  },
  on: (channel: string, fn: (...args: any[]) => void) => {
    if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
      const subscription = (_event: any, ...args: any[]) => fn(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    return () => {};
  },
  send: (channel: string, ...args: any[]) => {
    if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  }
});
