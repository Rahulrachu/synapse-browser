import { app, BrowserWindow, ipcMain, Menu, dialog, session } from 'electron';
import path from 'path';
import { isDev } from '../common/utils';
import BrowserManager from './BrowserManager';
import DownloadManager from './DownloadManager';

let mainWindow: BrowserWindow | null = null;

export function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  setupIPC();
  setupContextMenu();
  DownloadManager.setupDownloadHandler(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function setupIPC() {
  if (!mainWindow) return;

  // Browser navigation
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

// Download handlers
ipcMain.handle('get-downloads', async () => {
  return DownloadManager.getDownloads();
});

ipcMain.handle('open-downloads-folder', async () => {
  DownloadManager.openDownloadsFolder();
  return true;
});

ipcMain.handle('clear-downloads', async () => {
  DownloadManager.clearDownloads();
  return true;
});

  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-app-path', () => app.getAppPath());
  ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

  // Browser area management
  ipcMain.handle('resize-browser-area', async (event, bounds: { x: number; y: number; width: number; height: number }) => {
    BrowserManager.setBrowserAreaBounds(bounds);
    return true;
  });

  ipcMain.handle('duplicate-tab', async (event, tabId: string) => {
    const newTabId = BrowserManager.duplicateTab(tabId);
    return {
      tabs: BrowserManager.getAllTabs(),
      activeTabId: newTabId,
    };
  });
}

function setupContextMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [
          {
            label: 'Exit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
          { label: 'Toggle Dev Tools', accelerator: 'F12', role: 'toggleDevTools' },
        ],
      },
    ])
  );
}

export function getMainWindow() {
  return mainWindow;
}
