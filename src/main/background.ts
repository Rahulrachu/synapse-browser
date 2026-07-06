import { app, ipcMain } from 'electron';
import { createWindow } from './BrowserWindow';
import BrowserManager from './BrowserManager';
import Storage from './Storage';
import SessionManager from './SessionManager';

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
