import { app, ipcMain } from 'electron';
import { createWindow } from './BrowserWindow';
import BrowserManager from './BrowserManager';
import Storage from './Storage';
import SessionManager from './SessionManager';
import TabGroupManager from './TabGroupManager';
import PanelManager from './PanelManager';
import AIServiceManager from './AIServiceManager';
import ProjectManager from './ProjectManager';
import GitManager from './GitManager';

let mainWindow: any = null;

app.on('ready', () => {
  mainWindow = createWindow();

  // Create initial tab
  BrowserManager.createTab('https://www.google.com');

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

ipcMain.handle('get-git-commit-history', async (event, limit?: number) => {
  return GitManager.getCommitHistory(limit);
});

ipcMain.handle('git-commit', async (event, message: string) => {
  return GitManager.commit(message);
});

ipcMain.handle('git-push', async () => {
  return GitManager.push();
});

ipcMain.handle('git-pull', async () => {
  return GitManager.pull();
});

ipcMain.handle('git-create-branch', async (event, branchName: string) => {
  return GitManager.createBranch(branchName);
});

ipcMain.handle('git-switch-branch', async (event, branchName: string) => {
  return GitManager.switchBranch(branchName);
});

ipcMain.handle('git-get-branches', async () => {
  return GitManager.getBranches();
});

ipcMain.handle('git-get-diff', async (event, filePath?: string) => {
  return GitManager.getDiff(filePath);
});
