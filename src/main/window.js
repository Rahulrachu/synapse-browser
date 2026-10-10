import * as electron from "electron";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const isDev = process.env.NODE_ENV === "development";
const currentDir = path.dirname(fileURLToPath(import.meta.url));
let mainWindow = null;
export function createWindow() {
  const packagedRoot = electron.app.getAppPath();
  const assetPath = (relativeToRoot, relativeToMain) => {
    const candidates = [path.join(packagedRoot, relativeToRoot), path.join(currentDir, relativeToMain)];
    return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
  };
  const preloadPath = assetPath("out/preload/preload.cjs", "../preload/preload.cjs");
  const rendererPath = isDev ? null : assetPath("out/renderer/index.html", "../renderer/index.html");
  mainWindow = new electron.BrowserWindow({
    width: 1600,
    height: 1e3,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(currentDir, "../../public/icon.png"),
  });
  if (isDev) {
    void mainWindow.loadURL("http://localhost:5173");
  } else {
    if (!fs.existsSync(preloadPath) || !rendererPath || !fs.existsSync(rendererPath)) {
      console.error("[Main] Packaged renderer assets missing", {
        preloadPath,
        rendererPath,
        appPath: packagedRoot,
        mainDir: currentDir,
      });
      void mainWindow.loadURL("about:blank");
    } else {
      void mainWindow.loadFile(rendererPath);
    }
  }
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("[Main] Renderer failed to load", { errorCode, errorDescription, validatedURL });
  });
  if (isDev && process.env.SYNAPSE_OPEN_DEVTOOLS === "1") {
    mainWindow.webContents.openDevTools();
  }
  setupContextMenu();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  return mainWindow;
}
function setupContextMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            electron.app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "CmdOrCtrl+Y", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", role: "reload" },
        { label: "Force Reload", accelerator: "CmdOrCtrl+Shift+R", role: "forceReload" },
        { label: "Toggle Dev Tools", accelerator: "F12", role: "toggleDevTools" },
      ],
    },
  ];
  electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(template));
}
export function getMainWindow() {
  return mainWindow;
}
