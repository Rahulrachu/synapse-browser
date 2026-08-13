import { app, ipcMain } from 'electron';
import { exec } from 'child_process';
import { createWindow } from './BrowserWindow.js';
import BrowserManager from './BrowserManager.js';
import BrowserAgentController from './BrowserAgentController.js';
import Storage from './Storage.js';
import SearchEngine from './SearchEngine.js';
import PlanningEngine from '../engine/PlanningEngine.js';
import AIModelProviderManager from './AIModelProviderManager.js';
import AgentLogger from '../agents/AgentLogger.js';
import AgentRuntime from './AgentRuntime.js';
import ProjectScaffoldService from './ProjectScaffoldService.js';
import SessionManager from './SessionManager.js';
import TabGroupManager from './TabGroupManager.js';
import PanelManager from './PanelManager.js';
import ProjectManager from './ProjectManager.js';
import ProfileManager from './ProfileManager.js';
import DownloadManager from './DownloadManager.js';
import GitManager from './GitManager.js';
import ContextEngine from './ContextEngine.js';
import AIServiceManager from './AIServiceManager.js';
import os from 'os';

let mainWindow: any = null;

app.on('ready', async () => {
  mainWindow = createWindow();
  new AgentRuntime(mainWindow);

  const savedTabs = await Storage.get('open-tabs');
  BrowserManager.restoreTabs(Array.isArray(savedTabs) ? savedTabs : []);

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

  ipcMain.handle('close-tab', async (_event, tabId: string) => {
    BrowserManager.closeTab(tabId);
    return BrowserManager.getAllTabsPayload();
  });

  ipcMain.handle('reopen-closed-tab', async () => {
    const tabId = BrowserManager.reopenClosedTab();
    return { tabId, ...BrowserManager.getAllTabsPayload() };
  });

  ipcMain.handle('get-recently-closed', async () => BrowserManager.getRecentlyClosed());

  ipcMain.handle('move-tab', async (_event, tabId: string, targetIndex: number) => {
    BrowserManager.moveTab(tabId, targetIndex);
    return BrowserManager.getAllTabsPayload();
  });

  ipcMain.handle('pin-tab', async (_event, tabId: string, pinned = true) => {
    return BrowserManager.setPinned(tabId, pinned);
  });

  ipcMain.handle('toggle-tab-mute', async (_event, tabId?: string) => {
    return BrowserManager.toggleMute(tabId);
  });

  ipcMain.handle('duplicate-tab', async (_event, tabId: string) => {
    const newTabId = BrowserManager.duplicateTab(tabId);
    return { newTabId, ...BrowserManager.getAllTabsPayload() };
  });

  ipcMain.handle('reload-hard', async () => BrowserManager.reload(true));
  ipcMain.handle('get-current-tab', async () => BrowserManager.getActiveTab());
  ipcMain.handle('open-devtools', async (_event, tabId?: string) => {
    const target = tabId || BrowserManager.getActiveTab()?.id;
    const view = target ? BrowserManager.getWebContents(target) : undefined;
    if (!view || view.webContents.isDestroyed()) return false;
    view.webContents.openDevTools({ mode: 'detach' });
    return true;
  });
  ipcMain.handle('close-devtools', async (_event, tabId?: string) => {
    const target = tabId || BrowserManager.getActiveTab()?.id;
    const view = target ? BrowserManager.getWebContents(target) : undefined;
    if (!view || view.webContents.isDestroyed()) return false;
    view.webContents.closeDevTools();
    return true;
  });

  ipcMain.handle('set-active-tab', async (_event, tabId: string) => {
    BrowserManager.setActiveTab(tabId);
    return BrowserManager.getAllTabsPayload();
  });



  ipcMain.handle('get-all-tabs', async () => BrowserManager.getAllTabsPayload());

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
ipcMain.handle('get-downloads', async () => DownloadManager.getDownloads());
ipcMain.handle('pause-download', async (_event, id: string) => DownloadManager.pause(id));
ipcMain.handle('resume-download', async (_event, id: string) => DownloadManager.resume(id));
ipcMain.handle('cancel-download', async (_event, id: string) => DownloadManager.cancel(id));
ipcMain.handle('open-download', async (_event, id: string) => DownloadManager.open(id));
ipcMain.handle('show-download-in-folder', async (_event, id: string) => { DownloadManager.showInFolder(id); return true; });
ipcMain.handle('remove-download', async (_event, id: string) => DownloadManager.remove(id));

ipcMain.handle('find-in-page', async (_event, text: string, options?: { forward?: boolean; matchCase?: boolean }) => BrowserManager.findInPage(text, options));
ipcMain.handle('stop-find-in-page', async (_event, action?: 'clearSelection' | 'keepSelection' | 'activateSelection') => { BrowserManager.stopFindInPage(action); return true; });
ipcMain.handle('zoom-in', async () => BrowserManager.setZoom(0.1));
ipcMain.handle('zoom-out', async () => BrowserManager.setZoom(-0.1));
ipcMain.handle('zoom-reset', async () => BrowserManager.resetZoom());
ipcMain.handle('print-page', async () => BrowserManager.print());
ipcMain.handle('save-page-pdf', async () => BrowserManager.savePdf());

ipcMain.handle('get-profiles', async () => ProfileManager.getProfiles());
ipcMain.handle('get-profile', async (_event, id: string) => ProfileManager.getProfile(id));
ipcMain.handle('create-profile', async (_event, name: string, avatar?: string) => ProfileManager.createProfile(name, avatar));
ipcMain.handle('update-profile', async (_event, id: string, patch: any) => ProfileManager.updateProfile(id, patch));
ipcMain.handle('delete-profile', async (_event, id: string) => ProfileManager.deleteProfile(id));

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

// Structured browser-agent takeover API. Actions are validated and executed in the main process.
ipcMain.handle('browser-agent:run', async (_event, action) => BrowserAgentController.run(action));

ipcMain.handle('go-back', async () => {
  return BrowserManager.goBack();
});

ipcMain.handle('go-forward', async () => {
  return BrowserManager.goForward();
});

ipcMain.handle('reload', async () => BrowserManager.reload());

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
ipcMain.handle('get-bookmarks', async (_event, profileId = 'default', query = '') => {
  return Storage.getBookmarks(profileId, query);
});

ipcMain.handle('get-bookmark-folders', async (_event, profileId = 'default') => {
  return Storage.getBookmarkFolders(profileId);
});

ipcMain.handle('create-bookmark-folder', async (_event, name: string, parentId: string | null = null, profileId = 'default') => {
  return Storage.createBookmarkFolder(name, parentId, profileId);
});

ipcMain.handle('update-bookmark-folder', async (_event, id: string, name: string, parentId?: string | null) => {
  return Storage.updateBookmarkFolder(id, name, parentId);
});

ipcMain.handle('delete-bookmark-folder', async (_event, id: string) => Storage.deleteBookmarkFolder(id));

ipcMain.handle('add-bookmark', async (_event, title: string, url: string, folderId: string | null = null, profileId = 'default', favicon?: string) => {
  return Storage.addBookmark(title, url, folderId, profileId, favicon);
});

ipcMain.handle('update-bookmark', async (_event, id: string, patch: any) => Storage.updateBookmark(id, patch));
ipcMain.handle('delete-bookmark', async (_event, id: string) => Storage.removeBookmark(id));

ipcMain.handle('get-history', async (_event, limit?: number, profileId = 'default', query = '') => {
  return Storage.getHistory(limit || 100, profileId, query);
});

ipcMain.handle('add-to-history', async (_event, url: string, title: string, profileId = 'default', favicon?: string) => {
  return Storage.addToHistory(url, title, profileId, favicon);
});

ipcMain.handle('delete-history-entry', async (_event, id: string, profileId = 'default') => Storage.deleteHistoryEntry(id, profileId));
ipcMain.handle('clear-history', async (_event, profileId = 'default', since?: number) => {
  Storage.clearHistory(profileId, since);
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

ipcMain.handle('unpin-tab', async (_event, tabId: string) => {
  return BrowserManager.setPinned(tabId, false);
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
