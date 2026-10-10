import * as electron from "electron";
import * as child_process from "child_process";
import * as os from "os";
import { createWindow, getMainWindow } from "./window";
import { enforceSingleInstance, hardenAppWindow, installProcessGuards } from "./app/hardening";
import { startAutoUpdates } from "./app/updater";
import { storage } from "./services/Storage";
import { downloadManager } from "./services/DownloadManager";
import { browserManager } from "./browser/BrowserManager";
import { browserAgentController } from "./agent/BrowserAgentController";
import { planningEngine } from "./agent/PlanningEngine";
import { AgentRuntime } from "./agent/AgentRuntime";
import { ProjectScaffoldService } from "./services/ProjectScaffoldService";
import { sessionManager } from "./services/SessionManager";
import { tabGroupManager } from "./browser/TabGroupManager";
import { panelManager } from "./services/PanelManager";
import { projectManager } from "./services/ProjectManager";
import { profileManager } from "./services/ProfileManager";
import { gitManager } from "./services/GitManager";
import { contextEngine } from "./agent/ContextEngine";
import { aiServiceManager } from "./services/AIServiceManager";

let mainWindow = null;
installProcessGuards();
enforceSingleInstance(getMainWindow);
if (process.env.SYNAPSE_E2E === "1" || process.argv.includes("--e2e")) {
  electron.app.commandLine.appendSwitch("remote-debugging-address", "127.0.0.1");
  electron.app.commandLine.appendSwitch("remote-debugging-port", process.env.SYNAPSE_E2E_PORT || "9222");
  electron.app.commandLine.appendSwitch("remote-allow-origins", "*");
}
electron.app.on("ready", async () => {
  mainWindow = createWindow();
  hardenAppWindow(mainWindow);
  new AgentRuntime(mainWindow);
  const savedTabs = await storage.get("open-tabs");
  browserManager.restoreTabs(Array.isArray(savedTabs) ? savedTabs : []);
  ({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("[Main] Background initialized");
  startAutoUpdates();
  electron.ipcMain.handle("create-tab", async (event, url = "about:blank") => {
    const tabId = browserManager.createTab(url);
    return { tabId, tabs: browserManager.getAllTabs(), activeTabId: tabId };
  });
  electron.ipcMain.handle("close-tab", async (_event, tabId) => {
    browserManager.closeTab(tabId);
    return browserManager.getAllTabsPayload();
  });
  electron.ipcMain.handle("reopen-closed-tab", async () => {
    const tabId = browserManager.reopenClosedTab();
    return { tabId, ...browserManager.getAllTabsPayload() };
  });
  electron.ipcMain.handle("get-recently-closed", async () => browserManager.getRecentlyClosed());
  electron.ipcMain.handle("move-tab", async (_event, tabId, targetIndex) => {
    browserManager.moveTab(tabId, targetIndex);
    return browserManager.getAllTabsPayload();
  });
  electron.ipcMain.handle("pin-tab", async (_event, tabId, pinned = true) => {
    return browserManager.setPinned(tabId, pinned);
  });
  electron.ipcMain.handle("toggle-tab-mute", async (_event, tabId) => {
    return browserManager.toggleMute(tabId);
  });
  electron.ipcMain.handle("duplicate-tab", async (_event, tabId) => {
    const newTabId = browserManager.duplicateTab(tabId);
    return { newTabId, ...browserManager.getAllTabsPayload() };
  });
  electron.ipcMain.handle("reload-hard", async () => browserManager.reload(true));
  electron.ipcMain.handle("get-current-tab", async () => browserManager.getActiveTab());
  electron.ipcMain.handle("open-devtools", async (_event, tabId) => {
    const target = tabId || browserManager.getActiveTab()?.id;
    const view = target ? browserManager.getWebContents(target) : void 0;
    if (!view || view.webContents.isDestroyed()) return false;
    view.webContents.openDevTools({ mode: "detach" });
    return true;
  });
  electron.ipcMain.handle("close-devtools", async (_event, tabId) => {
    const target = tabId || browserManager.getActiveTab()?.id;
    const view = target ? browserManager.getWebContents(target) : void 0;
    if (!view || view.webContents.isDestroyed()) return false;
    view.webContents.closeDevTools();
    return true;
  });
  electron.ipcMain.handle("set-active-tab", async (_event, tabId) => {
    browserManager.setActiveTab(tabId);
    return browserManager.getAllTabsPayload();
  });
  electron.ipcMain.handle("get-all-tabs", async () => browserManager.getAllTabsPayload());
  electron.ipcMain.handle("set-browser-area-bounds", async (event, bounds) => {
    browserManager.setBrowserAreaBounds(bounds);
    return true;
  });
  electron.ipcMain.handle("set-browser-view-visibility", async (event, visible) => {
    browserManager.setBrowserViewVisibility(visible);
    return true;
  });
  const scaffoldService = new ProjectScaffoldService();
  electron.ipcMain.handle("get-project-templates", async () => {
    const templates = await scaffoldService.getAvailableTemplates();
    return { templates };
  });
  electron.ipcMain.handle("create-project", async (event, request) => {
    return scaffoldService.createProject(request, (progress) => {
      mainWindow.webContents.send("project-creation-progress", progress);
    });
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
electron.ipcMain.handle("get-downloads", async () => downloadManager.getDownloads());
electron.ipcMain.handle("pause-download", async (_event, id) => downloadManager.pause(id));
electron.ipcMain.handle("resume-download", async (_event, id) => downloadManager.resume(id));
electron.ipcMain.handle("cancel-download", async (_event, id) => downloadManager.cancel(id));
electron.ipcMain.handle("open-download", async (_event, id) => downloadManager.open(id));
electron.ipcMain.handle("show-download-in-folder", async (_event, id) => {
  downloadManager.showInFolder(id);
  return true;
});
electron.ipcMain.handle("remove-download", async (_event, id) => downloadManager.remove(id));
electron.ipcMain.handle("find-in-page", async (_event, text, options) =>
  browserManager.findInPage(text, options),
);
electron.ipcMain.handle("stop-find-in-page", async (_event, action) => {
  browserManager.stopFindInPage(action);
  return true;
});
electron.ipcMain.handle("zoom-in", async () => browserManager.setZoom(0.1));
electron.ipcMain.handle("zoom-out", async () => browserManager.setZoom(-0.1));
electron.ipcMain.handle("zoom-reset", async () => browserManager.resetZoom());
electron.ipcMain.handle("print-page", async () => browserManager.print());
electron.ipcMain.handle("save-page-pdf", async () => browserManager.savePdf());
electron.ipcMain.handle("get-profiles", async () => profileManager.getProfiles());
electron.ipcMain.handle("get-profile", async (_event, id) => profileManager.getProfile(id));
electron.ipcMain.handle("create-profile", async (_event, name, avatar) =>
  profileManager.createProfile(name, avatar),
);
electron.ipcMain.handle("update-profile", async (_event, id, patch) =>
  profileManager.updateProfile(id, patch),
);
electron.ipcMain.handle("delete-profile", async (_event, id) => profileManager.deleteProfile(id));
electron.ipcMain.handle("get-app-version", () => {
  return electron.app.getVersion();
});
electron.ipcMain.handle("get-app-path", () => {
  return electron.app.getAppPath();
});
electron.ipcMain.handle("get-user-data-path", () => {
  return electron.app.getPath("userData");
});
electron.ipcMain.handle("navigate-to", async (event, url) => {
  return browserManager.navigateTo(url);
});
electron.ipcMain.handle("browser-agent:run", async (_event, action) => browserAgentController.run(action));
electron.ipcMain.handle("go-back", async () => {
  return browserManager.goBack();
});
electron.ipcMain.handle("navigate-back", async () => browserManager.goBack());
electron.ipcMain.handle("go-forward", async () => {
  return browserManager.goForward();
});
electron.ipcMain.handle("navigate-forward", async () => browserManager.goForward());
electron.ipcMain.handle("reload", async () => browserManager.reload());
electron.ipcMain.handle("reload-tab", async () => browserManager.reload());
electron.ipcMain.handle("stop-loading", async () => {
  return browserManager.stopLoading();
});
electron.ipcMain.handle("get-current-url", async () => {
  return browserManager.getCurrentUrl();
});
electron.ipcMain.handle("get-current-title", async () => {
  return browserManager.getCurrentTitle();
});
electron.ipcMain.handle("get-bookmarks", async (_event, profileId = "default", query = "") => {
  return storage.getBookmarks(profileId, query);
});
electron.ipcMain.handle("get-bookmark-folders", async (_event, profileId = "default") => {
  return storage.getBookmarkFolders(profileId);
});
electron.ipcMain.handle(
  "create-bookmark-folder",
  async (_event, name, parentId = null, profileId = "default") => {
    return storage.createBookmarkFolder(name, parentId, profileId);
  },
);
electron.ipcMain.handle("update-bookmark-folder", async (_event, id, name, parentId) => {
  return storage.updateBookmarkFolder(id, name, parentId);
});
electron.ipcMain.handle("delete-bookmark-folder", async (_event, id) => storage.deleteBookmarkFolder(id));
electron.ipcMain.handle(
  "add-bookmark",
  async (_event, title, url, folderId = null, profileId = "default", favicon) => {
    return storage.addBookmark(title, url, folderId, profileId, favicon);
  },
);
electron.ipcMain.handle("update-bookmark", async (_event, id, patch) => storage.updateBookmark(id, patch));
electron.ipcMain.handle("delete-bookmark", async (_event, id) => storage.removeBookmark(id));
electron.ipcMain.handle("get-history", async (_event, limit, profileId = "default", query = "") => {
  return storage.getHistory(limit || 100, profileId, query);
});
electron.ipcMain.handle("add-to-history", async (_event, url, title, profileId = "default", favicon) => {
  return storage.addToHistory(url, title, profileId, favicon);
});
electron.ipcMain.handle("delete-history-entry", async (_event, id, profileId = "default") =>
  storage.deleteHistoryEntry(id, profileId),
);
electron.ipcMain.handle("clear-history", async (_event, profileId = "default", since) => {
  storage.clearHistory(profileId, since);
  return true;
});
electron.ipcMain.handle("get-notes", async () => {
  return storage.getNotes();
});
electron.ipcMain.handle("save-note", async (event, note) => {
  storage.saveNote(note);
  return true;
});
electron.ipcMain.handle("delete-note", async (event, id) => {
  storage.deleteNote(id);
  return true;
});
electron.ipcMain.handle("get-prompts", async () => {
  return storage.getPrompts();
});
electron.ipcMain.handle("save-prompt", async (event, prompt) => {
  storage.savePrompt(prompt);
  return true;
});
electron.ipcMain.handle("delete-prompt", async (event, id) => {
  storage.deletePrompt(id);
  return true;
});
electron.ipcMain.handle("get-sessions", async () => {
  return sessionManager.getSessions();
});
electron.ipcMain.handle("get-session", async (event, id) => {
  return sessionManager.getSession(id);
});
electron.ipcMain.handle("save-session", async (event, name, tabs) => {
  return sessionManager.saveSession(name, tabs);
});
electron.ipcMain.handle("update-session", async (event, id, tabs) => {
  return sessionManager.updateSession(id, tabs);
});
electron.ipcMain.handle("delete-session", async (event, id) => {
  return sessionManager.deleteSession(id);
});
electron.ipcMain.handle("rename-session", async (event, id, newName) => {
  return sessionManager.renameSession(id, newName);
});
electron.ipcMain.handle("create-tab-group", async (event, name, color) => {
  return tabGroupManager.createGroup(name, color);
});
electron.ipcMain.handle("get-tab-groups", async () => {
  return tabGroupManager.getGroups();
});
electron.ipcMain.handle("delete-tab-group", async (event, id) => {
  return tabGroupManager.deleteGroup(id);
});
electron.ipcMain.handle("add-tab-to-group", async (event, tabId, groupId) => {
  return tabGroupManager.addTabToGroup(tabId, groupId);
});
electron.ipcMain.handle("remove-tab-from-group", async (event, tabId) => {
  return tabGroupManager.removeTabFromGroup(tabId);
});
electron.ipcMain.handle("unpin-tab", async (_event, tabId) => {
  return browserManager.setPinned(tabId, false);
});
electron.ipcMain.handle("sleep-tab", async (event, tabId) => {
  tabGroupManager.sleepTab(tabId);
  return true;
});
electron.ipcMain.handle("wake-tab", async (event, tabId) => {
  tabGroupManager.wakeTab(tabId);
  return true;
});
electron.ipcMain.handle("set-tab-color", async (event, tabId, color) => {
  tabGroupManager.setTabColor(tabId, color);
  return true;
});
electron.ipcMain.handle("get-tab-properties", async (event, tabId) => {
  return tabGroupManager.getTabProperties(tabId);
});
electron.ipcMain.handle("create-layout", async (event, name, layout) => {
  return panelManager.createLayout(name, layout);
});
electron.ipcMain.handle("get-layouts", async () => {
  return panelManager.getLayouts();
});
electron.ipcMain.handle("get-layout", async (event, id) => {
  return panelManager.getLayout(id);
});
electron.ipcMain.handle("update-layout", async (event, id, layout) => {
  return panelManager.updateLayout(id, layout);
});
electron.ipcMain.handle("delete-layout", async (event, id) => {
  return panelManager.deleteLayout(id);
});
electron.ipcMain.handle("rename-layout", async (event, id, newName) => {
  return panelManager.renameLayout(id, newName);
});
electron.ipcMain.handle("create-conversation", async (event, serviceId, title) => {
  return aiServiceManager.createConversation(serviceId, title);
});
electron.ipcMain.handle("get-conversation", async (event, id) => {
  return aiServiceManager.getConversation(id);
});
electron.ipcMain.handle("get-conversations", async (event, serviceId) => {
  return aiServiceManager.getConversations(serviceId);
});
electron.ipcMain.handle("add-message", async (event, conversationId, role, content) => {
  return aiServiceManager.addMessage(conversationId, role, content);
});
electron.ipcMain.handle("update-conversation-title", async (event, id, title) => {
  return aiServiceManager.updateConversationTitle(id, title);
});
electron.ipcMain.handle("delete-conversation", async (event, id) => {
  return aiServiceManager.deleteConversation(id);
});
electron.ipcMain.handle("add-project", async (event, rootPath, name) => {
  return projectManager.addProject(rootPath, name);
});
electron.ipcMain.handle("get-projects", async () => {
  return projectManager.getProjects();
});
electron.ipcMain.handle("get-project", async (event, id) => {
  return projectManager.getProject(id);
});
electron.ipcMain.handle("update-project-last-opened", async (event, id) => {
  return projectManager.updateProjectLastOpened(id);
});
electron.ipcMain.handle("delete-project", async (event, id) => {
  return projectManager.deleteProject(id);
});
electron.ipcMain.handle("rename-project", async (event, id, newName) => {
  return projectManager.renameProject(id, newName);
});
electron.ipcMain.handle("get-project-files", async (event, projectId, relativePath) => {
  return projectManager.getProjectFiles(projectId, relativePath);
});
electron.ipcMain.handle("read-file", async (event, projectId, filePath) => {
  return projectManager.readFile(projectId, filePath);
});
electron.ipcMain.handle("write-file", async (event, projectId, filePath, content) => {
  return projectManager.writeFile(projectId, filePath, content);
});
electron.ipcMain.handle("delete-file", async (event, projectId, filePath) => {
  return projectManager.deleteFile(projectId, filePath);
});
electron.ipcMain.handle("create-file", async (event, projectId, filePath) => {
  return projectManager.createFile(projectId, filePath);
});
electron.ipcMain.handle("create-directory", async (event, projectId, dirPath) => {
  return projectManager.createDirectory(projectId, dirPath);
});
electron.ipcMain.handle("set-git-project-path", async (event, projectPath) => {
  gitManager.setProjectPath(projectPath);
  return true;
});
electron.ipcMain.handle("get-git-status", async () => {
  return gitManager.getStatus();
});
electron.ipcMain.handle("get-git-commits", async (event, limit) => {
  return gitManager.getCommitHistory(limit);
});
electron.ipcMain.handle("git-commit", async (event, { message }) => {
  return gitManager.commit(message);
});
electron.ipcMain.handle("git-push", async () => {
  return gitManager.push();
});
electron.ipcMain.handle("git-pull", async () => {
  return gitManager.pull();
});
electron.ipcMain.handle("git-create-branch", async (event, { name }) => {
  return gitManager.createBranch(name);
});
electron.ipcMain.handle("git-switch-branch", async (event, { name }) => {
  return gitManager.switchBranch(name);
});
electron.ipcMain.handle("get-git-branches", async () => {
  return gitManager.getBranches();
});
electron.ipcMain.handle("git-get-diff", async (event, filePath) => {
  return gitManager.getDiff(filePath);
});
electron.ipcMain.handle("update-context", async (event, updates) => {
  return contextEngine.updateContext(updates);
});
electron.ipcMain.handle("get-context", async () => {
  return contextEngine.getContext();
});
electron.ipcMain.handle("get-context-summary", async () => {
  return contextEngine.getContextSummary();
});
electron.ipcMain.handle("create-plan", async (event, goal, tasks) => {
  return planningEngine.createPlan(goal, tasks);
});
electron.ipcMain.handle("update-plan-task", async (event, taskId, status, result) => {
  return planningEngine.updateTaskStatus(taskId, status, result);
});
electron.ipcMain.handle("get-current-plan", async () => {
  return planningEngine.getCurrentPlan();
});
electron.ipcMain.handle("terminal-execute", async (event, { command }) => {
  const forbiddenChars = [";", "&", "|", ">", "<", "`", "$", "(", ")", "{", "}", "[", "]"];
  const hasForbidden = forbiddenChars.some((char) => command.includes(char));
  const allowedCommands = ["pnpm", "npm", "ls", "git", "pwd", "echo"];
  const isAllowed = allowedCommands.some((cmd) => command.trim().startsWith(cmd));
  if (hasForbidden && !isAllowed) {
    return {
      output: "",
      error: "Command contains potentially unsafe characters and is not in the allowed list.",
    };
  }
  return new Promise((resolve) => {
    child_process.exec(command, (error, stdout, stderr) => {
      resolve({
        output: stdout,
        error: error ? stderr || error.message : null,
      });
    });
  });
});
electron.ipcMain.handle("get-diagnostics", async () => {
  return {
    diagnostics: [
      {
        id: "diag-1",
        file: "src/main/background.ts",
        line: 1,
        column: 1,
        severity: "info",
        message: "System initialized successfully",
        source: "System",
      },
    ],
  };
});
electron.ipcMain.handle("get-system-stats", async () => {
  return {
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
    },
    cpu: {
      load: os.loadavg()[0],
      cores: os.cpus().length,
    },
    uptime: os.uptime(),
    version: electron.app.getVersion(),
    branch: "master",
  };
});
