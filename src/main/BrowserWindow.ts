import { app, BrowserWindow, ipcMain, Menu, dialog, session } from 'electron';
import path from 'path';
import { isDev, getDirname } from '../common/utils.js';

const __dirname = getDirname(import.meta.url);
import BrowserManager from './BrowserManager.js';
import DownloadManager from './DownloadManager.js';

let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main Electron browser window and initializes its properties.
 * Sets up IPC handlers, context menu, and download manager.
 * @returns The created BrowserWindow instance.
 */
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
    : `file://${path.join(__dirname, '../../dist/renderer/index.html')}`;

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

/**
 * Sets up Inter-Process Communication (IPC) handlers for various browser actions.
 * This allows the renderer process to communicate with the main process.
 */
function setupIPC() {
  if (!mainWindow) return;

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

  // Browser area management
  ipcMain.handle('resize-browser-area', async (event, bounds: { x: number; y: number; width: number; height: number }) => {
    BrowserManager.setBrowserAreaBounds(bounds);
    return true;
  });
}

/**
 * Sets up the application's context menu (right-click menu).
 */
function setupContextMenu() {
  const template: any[] = [
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
    ];

  // Add plugin menu items here if needed
  // PluginManager.getMenuContributions().forEach(...)

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/**
 * Retrieves the main BrowserWindow instance.
 * @returns The main BrowserWindow instance or null if it hasn't been created yet.
 */
export function getMainWindow() {
  return mainWindow;
}
