import { app, ipcMain } from 'electron';
import { createWindow } from './BrowserWindow';
import BrowserManager from './BrowserManager';
import Storage from './Storage';
import SessionManager from './SessionManager';
import TabGroupManager from './TabGroupManager';
import PanelManager from './PanelManager';

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
