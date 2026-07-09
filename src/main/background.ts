import { app, ipcMain } from 'electron';
import { createWindow } from './BrowserWindow.js';
import BrowserManager from './BrowserManager.js';
import Storage from './Storage.js';
import SessionManager from './SessionManager.js';
import TabGroupManager from './TabGroupManager.js';
import PanelManager from './PanelManager.js';
import AIServiceManager from './AIServiceManager.js';
import ProjectManager from './ProjectManager.js';
import GitManager from './GitManager.js';
import PluginManager from './PluginManager.js';
import ExtensionRepositoryService from './ExtensionRepositoryService.js';
import WorkflowManager from './WorkflowManager.js';
import SkillRegistry from './SkillRegistry.js';
import PermissionManager from './PermissionManager.js';
import ContextEngine from '../engine/ContextEngine.js';
import MemorySystem from '../engine/MemorySystem.js';
import MemoryManager from '../engine/MemoryManager.js';
import TaskQueueManager from './TaskQueueManager.js';
import NotificationService from './NotificationService.js';
import EventBus from './EventBus.js';
import SearchEngine from './SearchEngine.js';
import { 
  BrowserTabProvider, 
  NoteProvider, 
  ProjectProvider, 
  WorkflowProvider, 
  SkillProvider, 
  PluginProvider, 
  MarketplaceProvider, 
  DownloadProvider, 
  MemoryProvider 
} from './SearchProviders.js';
import PlanningEngine from '../engine/PlanningEngine.js';
import AIModelProviderManager from './AIModelProviderManager.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { OllamaProvider } from './providers/OllamaProvider.js';
import PromptManager from './PromptManager.js';
import BrowserAutomation from './BrowserAutomation.js';
import { ToolRegistry, initializeTools } from '../tools/index.js';
import AgentRuntime from '../agents/AgentRuntime.js';
import AgentLogger from '../agents/AgentLogger.js';

let mainWindow: any = null;

app.on('ready', () => {
  mainWindow = createWindow();

  // Initialize Tool Runtime
  initializeTools();

  // Initialize Memory Manager
  MemoryManager.initialize();

  // Initialize Task Queue Manager
  TaskQueueManager.initialize();

  // Initialize Prompt Manager
  // (Instance is created and handlers setup on import)
  console.log('[Main] PromptManager initialized');

  // Set main window for NotificationService
  NotificationService.setMainWindow(mainWindow);

  // Create initial tab
  BrowserManager.createTab('https://www.google.com');

  // Set default git path to the project itself for testing
  GitManager.setProjectPath(app.getAppPath());

  // Discover and load plugins
  PluginManager.discoverPlugins();

  // Initialize Search Engine
  SearchEngine.registerProvider(new BrowserTabProvider());
  SearchEngine.registerProvider(new NoteProvider());
  SearchEngine.registerProvider(new ProjectProvider());
  SearchEngine.registerProvider(new WorkflowProvider());
  SearchEngine.registerProvider(new SkillProvider());
  SearchEngine.registerProvider(new PluginProvider());
  SearchEngine.registerProvider(new MarketplaceProvider());
  SearchEngine.registerProvider(new DownloadProvider());
  SearchEngine.registerProvider(new MemoryProvider());

  // Initialize AI Providers
  const openAIConfig = {
    id: 'openai-default',
    type: 'openai' as const,
    name: 'OpenAI',
    apiKey: process.env.OPENAI_API_KEY,
    enabled: true,
    models: []
  };
  AIModelProviderManager.registerProvider(new OpenAIProvider(openAIConfig));

  const ollamaConfig = {
    id: 'ollama-local',
    type: 'ollama' as const,
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434',
    enabled: true,
    models: []
  };
  AIModelProviderManager.registerProvider(new OllamaProvider(ollamaConfig));

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

ipcMain.handle('remove-bookmark', async (event, id: string) => {
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

ipcMain.handle('create-vertical-split', async (event, leftTab: string, rightTab: string) => {
  return PanelManager.createVerticalSplit(leftTab, rightTab);
});

ipcMain.handle('create-horizontal-split', async (event, topTab: string, bottomTab: string) => {
  return PanelManager.createHorizontalSplit(topTab, bottomTab);
});

ipcMain.handle('create-grid-layout', async (event, tabs: string[]) => {
  return PanelManager.createGridLayout(tabs);
});

ipcMain.handle('add-panel-to-layout', async (event, layoutId: string, tabId: string, position: string) => {
  return PanelManager.addPanelToLayout(layoutId, tabId, position as any);
});

ipcMain.handle('remove-panel-from-layout', async (event, layoutId: string, panelId: string) => {
  return PanelManager.removePanelFromLayout(layoutId, panelId);
});

ipcMain.handle('resize-panel', async (event, layoutId: string, panelId: string, newSize: number) => {
  return PanelManager.resizePanel(layoutId, panelId, newSize);
});

// AI Service handlers
ipcMain.handle('add-ai-service', async (event, service: string, name: string, config: any) => {
  return AIServiceManager.addService(service as any, name, config);
});

ipcMain.handle('get-ai-services', async () => {
  return AIServiceManager.getServices();
});

ipcMain.handle('get-ai-service', async (event, id: string) => {
  return AIServiceManager.getService(id);
});

ipcMain.handle('get-ai-services-by-type', async (event, service: string) => {
  return AIServiceManager.getServicesByType(service as any);
});

ipcMain.handle('update-ai-service', async (event, id: string, updates: any) => {
  return AIServiceManager.updateService(id, updates);
});

ipcMain.handle('delete-ai-service', async (event, id: string) => {
  return AIServiceManager.deleteService(id);
});

ipcMain.handle('enable-ai-service', async (event, id: string) => {
  return AIServiceManager.enableService(id);
});

ipcMain.handle('disable-ai-service', async (event, id: string) => {
  return AIServiceManager.disableService(id);
});

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
ipcMain.handle('memory:initialize', async () => {
  return MemoryManager.initialize();
});

ipcMain.handle('memory:add', async (_, entry) => {
  const result = await MemoryManager.addMemory(entry);
  EventBus.publish({
    id: Date.now().toString(),
    type: 'memory:added',
    category: 'system',
    source: 'MemoryManager',
    payload: result,
    timestamp: Date.now(),
    priority: 1
  });
  return result;
});

ipcMain.handle('memory:get', async (_, id) => {
  return MemoryManager.getMemory(id);
});

ipcMain.handle('memory:update', async (_, id, updates) => {
  const result = await MemoryManager.updateMemory(id, updates);
  if (result) {
    EventBus.publish({
      id: Date.now().toString(),
      type: 'memory:updated',
      category: 'system',
      source: 'MemoryManager',
      payload: result,
      timestamp: Date.now(),
      priority: 1
    });
  }
  return result;
});

ipcMain.handle('memory:delete', async (_, id) => {
  const result = await MemoryManager.deleteMemory(id);
  if (result) {
    EventBus.publish({
      id: Date.now().toString(),
      type: 'memory:deleted',
      category: 'system',
      source: 'MemoryManager',
      payload: { id },
      timestamp: Date.now(),
      priority: 1
    });
  }
  return result;
});

ipcMain.handle('memory:search', async (_, query, options) => {
  return MemoryManager.searchMemories(query, options);
});

ipcMain.handle('memory:get-by-type', async (_, type, options) => {
  return MemoryManager.getMemoriesByType(type, options);
});

ipcMain.handle('memory:import', async (_, json) => {
  return MemoryManager.importMemories(json);
});

ipcMain.handle('memory:export', async (_, type) => {
  return MemoryManager.exportMemories(type);
});

// Task Queue handlers
ipcMain.handle('task-queue:enqueue', async (_, job) => TaskQueueManager.enqueueJob(job));
ipcMain.handle('task-queue:get-all', async (_, filter) => TaskQueueManager.getAllJobs(filter));
ipcMain.handle('task-queue:get', async (_, id) => TaskQueueManager.getJob(id));
ipcMain.handle('task-queue:cancel', async (_, id) => TaskQueueManager.cancelJob(id));
ipcMain.handle('task-queue:pause', async (_, id) => TaskQueueManager.pauseJob(id));
ipcMain.handle('task-queue:resume', async (_, id) => TaskQueueManager.resumeJob(id));
ipcMain.handle('task-queue:clear-completed', async () => TaskQueueManager.clearCompletedJobs());

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

// Browser Automation handlers
ipcMain.handle('automation-navigate', async (event, url: string, tabId?: string) => {
  return BrowserAutomation.navigate(url, tabId);
});

ipcMain.handle('automation-click', async (event, selector: string, tabId?: string) => {
  return BrowserAutomation.clickElement(selector, tabId);
});

ipcMain.handle('automation-type', async (event, selector: string, text: string, tabId?: string) => {
  return BrowserAutomation.typeText(selector, text, tabId);
});

ipcMain.handle('automation-execute-js', async (event, code: string, tabId?: string) => {
  return BrowserAutomation.executeJavaScript(code, tabId);
});

ipcMain.handle('automation-get-source', async (event, tabId?: string) => {
  return BrowserAutomation.getPageSource(tabId);
});

ipcMain.handle('automation-screenshot', async (event, tabId?: string) => {
  return BrowserAutomation.takeScreenshot(tabId);
});

ipcMain.handle('automation-scroll', async (event, x: number, y: number, tabId?: string) => {
  return BrowserAutomation.scroll(x, y, tabId);
});

ipcMain.handle('automation-get-cookies', async (event, tabId?: string) => {
  return BrowserAutomation.getCookies(tabId);
});

// Tool Runtime handlers
ipcMain.handle('tool-list', async () => {
  return ToolRegistry.getAllTools();
});

ipcMain.handle('tool-invoke', async (event, id: string, input: any, options?: any) => {
  return ToolRegistry.invoke(id, input, options);
});

ipcMain.handle('tool-history', async () => {
  return ToolRegistry.getHistory();
});

// Agent Runtime handlers
ipcMain.handle('agent-list', async () => {
  return AgentRuntime.getRegistry().getAllAgents().map(a => ({
    id: a.id,
    name: a.name,
    capabilities: a.getCapabilities()
  }));
});

ipcMain.handle('agent-initialize', async (event, agentId: string) => {
  return AgentRuntime.getManager().initializeAgent(agentId);
});

ipcMain.handle('agent-start', async (event, agentId: string) => {
  return AgentRuntime.getManager().startAgent(agentId);
});

ipcMain.handle('agent-stop', async (event, agentId: string) => {
  return AgentRuntime.getManager().stopAgent(agentId);
});

ipcMain.handle('agent-pause', async (event, agentId: string) => {
  const agent = AgentRuntime.getRegistry().getAgent(agentId);
  if (agent) await agent.pause();
  return true;
});

ipcMain.handle('agent-resume', async (event, agentId: string) => {
  const agent = AgentRuntime.getRegistry().getAgent(agentId);
  if (agent) await agent.resume();
  return true;
});

ipcMain.handle('agent-assign-task', async (event, task: any) => {
  return AgentRuntime.getManager().assignTask(task);
});

ipcMain.handle('agent-get-logs', async (event, filter?: any) => {
  return AgentLogger.getLogs(filter);
});

ipcMain.handle('agent-sync-context', async () => {
  return AgentRuntime.syncContext();
});

// Orchestrator handlers are already registered in AgentOrchestrator.ts constructor
// which is called by AgentRuntime.ts constructor.
