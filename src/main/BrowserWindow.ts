import { app, BrowserWindow, ipcMain, Menu, dialog, session } from 'electron';
import path from 'path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
// import { isDev, getDirname } from '../common/utils.js';
const isDev = process.env.NODE_ENV === 'development';
// `URL.pathname` leaves a leading slash on Windows (for example `/C:/...`).
// Convert the module URL with Node's platform-aware helper before joining paths.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// import DownloadManager from './DownloadManager.js';

let mainWindow: BrowserWindow | null = null;

/**
 * Creates the main Electron browser window and initializes its properties.
 * Sets up IPC handlers, context menu, and download manager.
 * @returns The created BrowserWindow instance.
 */
export function createWindow() {
  const packagedRoot = app.getAppPath();
  // electron-vite emits out/main, out/preload, and out/renderer as siblings.
  // In a packaged app app.getAppPath() is the app root, while launching the
  // built main file directly makes it out/main. Resolve both layouts so the
  // renderer and preload never silently disappear in a release or smoke run.
  const assetPath = (relativeToRoot: string, relativeToMain: string) => {
    const candidates = [
      path.join(packagedRoot, relativeToRoot),
      path.join(__dirname, relativeToMain),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
  };
  const preloadPath = assetPath('out/preload/preload.cjs', '../preload/preload.cjs');
  const rendererPath = isDev ? null : assetPath('out/renderer/index.html', '../renderer/index.html');

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../../public/icon.png'),
  });

  if (isDev) {
    void mainWindow.loadURL('http://localhost:5173');
  } else {
    if (!fs.existsSync(preloadPath) || !rendererPath || !fs.existsSync(rendererPath)) {
      console.error('[Main] Packaged renderer assets missing', { preloadPath, rendererPath, appPath: packagedRoot, mainDir: __dirname });
      void mainWindow.loadURL('about:blank');
    } else {
      void mainWindow.loadFile(rendererPath);
    }
  }

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[Main] Renderer failed to load', { errorCode, errorDescription, validatedURL });
  });

  if (isDev && process.env.SYNAPSE_OPEN_DEVTOOLS === '1') {
    mainWindow.webContents.openDevTools();
  }

  setupContextMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
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
