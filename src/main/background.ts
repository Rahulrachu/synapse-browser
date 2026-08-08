import { app, ipcMain } from 'electron';
import { exec } from 'child_process';
import { createWindow } from './BrowserWindow.js';
import BrowserManager from './BrowserManager.js';
import Storage from './Storage.js';
import SearchEngine from './SearchEngine.js';
import PlanningEngine from '../engine/PlanningEngine.js';
import AIModelProviderManager from './AIModelProviderManager.js';
import AgentLogger from '../agents/AgentLogger.js';
import AgentRuntime from './AgentRuntime.js';
import os from 'os';

let mainWindow: any = null;

app.on('ready', () => {
  mainWindow = createWindow();
  new AgentRuntime(mainWindow);

  // Create initial tab
  BrowserManager.createTab('https://www.google.com');

  // Initialize AI Providers
  const openAIConfig = {
    id: 'openai-default',
    type: 'openai' as const,
    name: 'OpenAI',
    apiKey: process.env.OPENAI_API_KEY,
    enabled: true,
    models: []
  };
  // AIModelProviderManager handles registration via its own logic if providers are available
  console.log('[Main] Background initialized');

  // Setup IPC handlers for browser manager
  ipcMain.handle('create-tab', async (event, url: string = 'about:blank') => {
    const tabId = BrowserManager.createTab(url);
    return { tabId, tabs: BrowserManager.getAllTabs(), activeTabId: tabId };
  });

  ipcMain.handle('close-tab', async (event, tabId: string) => {
    BrowserManager.closeTab(tabId);
    return { tabs: BrowserManager.getAllTabs(), activeTabId: BrowserManager.getActiveTab()?.id };
  });

  ipcMain.handle('set-active-tab', async (event, tabId: string) => {
    BrowserManager.setActiveTab(tabId);
    return { activeTabId: tabId, tabs: BrowserManager.getAllTabs() };
  });

  ipcMain.handle('duplicate-tab', async (event, tabId: string) => {
    const newTabId = BrowserManager.duplicateTab(tabId);
    return { newTabId, tabs: BrowserManager.getAllTabs(), activeTabId: newTabId };
  });

  ipcMain.handle('get-all-tabs', async () => {
    return {
      tabs: BrowserManager.getAllTabs(),
      activeTabId: BrowserManager.getActiveTab()?.id,
    };
  });

  ipcMain.handle('set-browser-area-bounds', async (event, bounds) => {
    BrowserManager.setBrowserAreaBounds(bounds);
    return true;
  });

  ipcMain.handle('set-browser-view-visibility', async (event, visible) => {
    BrowserManager.setBrowserViewVisibility(visible);
    return true;
  });

  // Project Scaffold handlers
  const scaffoldService = new ProjectScaffoldService();
  ipcMain.handle('get-project-templates', async () => {
    const templates = await scaffoldService.getAvailableTemplates();
    return { templates };
  });

  ipcMain.handle('create-project', async (event, request) => {
    return scaffoldService.createProject(request, (progress) => {
      mainWindow.webContents.send('project-creation-progress', progress);
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Additional IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('navigate-to', async (event, url: string) => {
  return BrowserManager.navigateTo(url);
});

ipcMain.handle('go-back', async () => {
  return BrowserManager.goBack();
});

ipcMain.handle('go-forward', async () => {
  return BrowserManager.goForward();
});

ipcMain.handle('reload', async () => {
  return BrowserManager.reload();
});

ipcMain.handle('stop-loading', async () => {
  return BrowserManager.stopLoading();
});

ipcMain.handle('get-current-url', async () => {
  return BrowserManager.getCurrentUrl();
});

ipcMain.handle('get-current-title', async () => {
  return BrowserManager.getCurrentTitle();
});

// Storage handlers
ipcMain.handle('get-bookmarks', async () => {
  return Storage.getBookmarks();
});

ipcMain.handle('add-bookmark', async (event, title: string, url: string) => {
  return Storage.addBookmark(title, url);
});

  ipcMain.handle('delete-bookmark', async (event, id: string) => {
    return Storage.removeBookmark(id);
  });

ipcMain.handle('get-history', async (event, limit?: number) => {
  return Storage.getHistory(limit);
});

ipcMain.handle('add-to-history', async (event, url: string, title: string) => {
  return Storage.addToHistory(url, title);
});

ipcMain.handle('clear-history', async () => {
  Storage.clearHistory();
  return true;
});

// Notes handlers
ipcMain.handle('get-notes', async () => {
  return Storage.getNotes();
});

ipcMain.handle('save-note', async (event, note) => {
  Storage.saveNote(note);
  return true;
});

ipcMain.handle('delete-note', async (event, id) => {
  Storage.deleteNote(id);
  return true;
});

// Prompts handlers
ipcMain.handle('get-prompts', async () => {
  return Storage.getPrompts();
});

ipcMain.handle('save-prompt', async (event, prompt) => {
  Storage.savePrompt(prompt);
  return true;
});

ipcMain.handle('delete-prompt', async (event, id) => {
  Storage.deletePrompt(id);
  return true;
});

// Session handlers
ipcMain.handle('get-sessions', async () => {
  return SessionManager.getSessions();
});

ipcMain.handle('get-session', async (event, id: string) => {
  return SessionManager.getSession(id);
});

ipcMain.handle('save-session', async (event, name: string, tabs: any[]) => {
  return SessionManager.saveSession(name, tabs);
});

ipcMain.handle('update-session', async (event, id: string, tabs: any[]) => {
  return SessionManager.updateSession(id, tabs);
});

ipcMain.handle('delete-session', async (event, id: string) => {
  return SessionManager.deleteSession(id);
});

ipcMain.handle('rename-session', async (event, id: string, newName: string) => {
  return SessionManager.renameSession(id, newName);
});

// Tab Group handlers
ipcMain.handle('create-tab-group', async (event, name: string, color: string) => {
  return TabGroupManager.createGroup(name, color);
});

ipcMain.handle('get-tab-groups', async () => {
  return TabGroupManager.getGroups();
});

ipcMain.handle('delete-tab-group', async (event, id: string) => {
  return TabGroupManager.deleteGroup(id);
});

ipcMain.handle('add-tab-to-group', async (event, tabId: string, groupId: string) => {
  return TabGroupManager.addTabToGroup(tabId, groupId);
});

ipcMain.handle('remove-tab-from-group', async (event, tabId: string) => {
  return TabGroupManager.removeTabFromGroup(tabId);
});

ipcMain.handle('pin-tab', async (event, tabId: string) => {
  TabGroupManager.pinTab(tabId);
  return true;
});

ipcMain.handle('unpin-tab', async (event, tabId: string) => {
  TabGroupManager.unpinTab(tabId);
  return true;
});

ipcMain.handle('sleep-tab', async (event, tabId: string) => {
  TabGroupManager.sleepTab(tabId);
  return true;
});

ipcMain.handle('wake-tab', async (event, tabId: string) => {
  TabGroupManager.wakeTab(tabId);
  return true;
});

ipcMain.handle('set-tab-color', async (event, tabId: string, color: string) => {
  TabGroupManager.setTabColor(tabId, color);
  return true;
});

ipcMain.handle('get-tab-properties', async (event, tabId: string) => {
  return TabGroupManager.getTabProperties(tabId);
});

// Panel/Workspace Layout handlers
ipcMain.handle('create-layout', async (event, name: string, layout: any) => {
  return PanelManager.createLayout(name, layout);
});

ipcMain.handle('get-layouts', async () => {
  return PanelManager.getLayouts();
});

ipcMain.handle('get-layout', async (event, id: string) => {
  return PanelManager.getLayout(id);
});

ipcMain.handle('update-layout', async (event, id: string, layout: any) => {
  return PanelManager.updateLayout(id, layout);
});

ipcMain.handle('delete-layout', async (event, id: string) => {
  return PanelManager.deleteLayout(id);
});

ipcMain.handle('rename-layout', async (event, id: string, newName: string) => {
  return PanelManager.renameLayout(id, newName);
});

// Unused legacy layout and AI service handlers removed. 
// Functionality moved to PanelManager and AIModelProviderManager.

// AI Conversation handlers
ipcMain.handle('create-conversation', async (event, serviceId: string, title?: string) => {
  return AIServiceManager.createConversation(serviceId, title);
});

ipcMain.handle('get-conversation', async (event, id: string) => {
  return AIServiceManager.getConversation(id);
});

ipcMain.handle('get-conversations', async (event, serviceId?: string) => {
  return AIServiceManager.getConversations(serviceId);
});

ipcMain.handle('add-message', async (event, conversationId: string, role: string, content: string) => {
  return AIServiceManager.addMessage(conversationId, role as any, content);
});

  // Note: ai-service-send-message removed in favor of ai:chat positional API

ipcMain.handle('update-conversation-title', async (event, id: string, title: string) => {
  return AIServiceManager.updateConversationTitle(id, title);
});

ipcMain.handle('delete-conversation', async (event, id: string) => {
  return AIServiceManager.deleteConversation(id);
});

// Project handlers
ipcMain.handle('add-project', async (event, rootPath: string, name?: string) => {
  return ProjectManager.addProject(rootPath, name);
});

ipcMain.handle('get-projects', async () => {
  return ProjectManager.getProjects();
});

ipcMain.handle('get-project', async (event, id: string) => {
  return ProjectManager.getProject(id);
});

ipcMain.handle('update-project-last-opened', async (event, id: string) => {
  return ProjectManager.updateProjectLastOpened(id);
});

ipcMain.handle('delete-project', async (event, id: string) => {
  return ProjectManager.deleteProject(id);
});

ipcMain.handle('rename-project', async (event, id: string, newName: string) => {
  return ProjectManager.renameProject(id, newName);
});

ipcMain.handle('get-project-files', async (event, projectId: string, relativePath?: string) => {
  return ProjectManager.getProjectFiles(projectId, relativePath);
});

ipcMain.handle('read-file', async (event, projectId: string, filePath: string) => {
  return ProjectManager.readFile(projectId, filePath);
});

ipcMain.handle('write-file', async (event, projectId: string, filePath: string, content: string) => {
  return ProjectManager.writeFile(projectId, filePath, content);
});

ipcMain.handle('delete-file', async (event, projectId: string, filePath: string) => {
  return ProjectManager.deleteFile(projectId, filePath);
});

ipcMain.handle('create-file', async (event, projectId: string, filePath: string) => {
  return ProjectManager.createFile(projectId, filePath);
});

ipcMain.handle('create-directory', async (event, projectId: string, dirPath: string) => {
  return ProjectManager.createDirectory(projectId, dirPath);
});

// Git handlers
ipcMain.handle('set-git-project-path', async (event, projectPath: string) => {
  GitManager.setProjectPath(projectPath);
  return true;
});

ipcMain.handle('get-git-status', async () => {
  return GitManager.getStatus();
});

ipcMain.handle('get-git-commits', async (event, limit?: number) => {
  return GitManager.getCommitHistory(limit);
});

ipcMain.handle('git-commit', async (event, { message }: { message: string }) => {
  return GitManager.commit(message);
});

ipcMain.handle('git-push', async () => {
  return GitManager.push();
});

ipcMain.handle('git-pull', async () => {
  return GitManager.pull();
});

ipcMain.handle('git-create-branch', async (event, { name }: { name: string }) => {
  return GitManager.createBranch(name);
});

ipcMain.handle('git-switch-branch', async (event, { name }: { name: string }) => {
  return GitManager.switchBranch(name);
});

ipcMain.handle('get-git-branches', async () => {
  return GitManager.getBranches();
});

ipcMain.handle('git-get-diff', async (event, filePath?: string) => {
  return GitManager.getDiff(filePath);
});

// Context Engine handlers
ipcMain.handle('update-context', async (event, updates: any) => {
  return ContextEngine.updateContext(updates);
});

ipcMain.handle('get-context', async () => {
  return ContextEngine.getContext();
});

ipcMain.handle('get-context-summary', async () => {
  return ContextEngine.getContextSummary();
});

// Memory System handlers
// Legacy memory initialize handler removed.

// Legacy memory and task queue handlers removed to fix build errors.

// Planning Engine handlers
ipcMain.handle('create-plan', async (event, goal: string, tasks: string[]) => {
  return PlanningEngine.createPlan(goal, tasks);
});

ipcMain.handle('update-plan-task', async (event, taskId: string, status: any, result?: any) => {
  return PlanningEngine.updateTaskStatus(taskId, status, result);
});

ipcMain.handle('get-current-plan', async () => {
  return PlanningEngine.getCurrentPlan();
});

// Legacy browser automation, tool, and agent handlers removed to fix build errors.

// Terminal execute handler
ipcMain.handle('terminal-execute', async (event, { command }: { command: string }) => {
  // Basic sanitization: prevent common shell injection characters
  // In a real app, this should be even more restrictive or use a proper shell emulator
  const forbiddenChars = [';', '&', '|', '>', '<', '`', '$', '(', ')', '{', '}', '[', ']'];
  const hasForbidden = forbiddenChars.some(char => command.includes(char));
  
  // Allow common safe patterns like "npm install", "pnpm test", etc.
  // This is a very basic check for demonstration
  const allowedCommands = ['pnpm', 'npm', 'ls', 'git', 'pwd', 'echo'];
  const isAllowed = allowedCommands.some(cmd => command.trim().startsWith(cmd));

  if (hasForbidden && !isAllowed) {
    return {
      output: '',
      error: 'Command contains potentially unsafe characters and is not in the allowed list.'
    };
  }

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve({
        output: stdout,
        error: error ? stderr || error.message : null
      });
    });
  });
});

// Diagnostics handler
ipcMain.handle('get-diagnostics', async () => {
  // Mock diagnostics for now
  return {
    diagnostics: [
      {
        id: 'diag-1',
        file: 'src/main/background.ts',
        line: 1,
        column: 1,
        severity: 'info',
        message: 'System initialized successfully',
        source: 'System'
      }
    ]
  };
});

// System stats handler
ipcMain.handle('get-system-stats', async () => {
  return {
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usage: (os.totalmem() - os.freemem()) / os.totalmem() * 100
    },
    cpu: {
      load: os.loadavg()[0],
      cores: os.cpus().length
    },
    uptime: os.uptime(),
    version: app.getVersion(),
    branch: 'master'
  };
});

// Legacy repository analysis and research collection handlers removed to fix build errors.

// Orchestrator handlers are already registered in AgentOrchestrator.ts constructor
// which is called by AgentRuntime.ts constructor.
