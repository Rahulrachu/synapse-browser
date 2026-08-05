import { WebContentsView, BrowserWindow, app, ipcMain } from "electron";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
class BrowserManager {
  constructor() {
    this.tabs = /* @__PURE__ */ new Map();
    this.activeTabId = null;
    this.tabViews = /* @__PURE__ */ new Map();
    this.currentBrowserBounds = null;
  }
  /**
   * Creates a new browser tab and its associated WebContentsView.
   * @param url The initial URL to load. Defaults to 'about:blank'.
   * @returns The unique ID of the newly created tab.
   */
  createTab(url = "about:blank") {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2) throw new Error("Main window not found");
    const tabId = Date.now().toString();
    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    const tabInfo = {
      id: tabId,
      viewId: view.webContents.id,
      url,
      title: "New Tab",
      isLoading: false,
      canGoBack: false,
      canGoForward: false
    };
    this.tabs.set(tabId, tabInfo);
    this.tabViews.set(tabId, view);
    this.activeTabId = tabId;
    this.setupWebContentsListeners(view.webContents, tabId);
    if (url !== "about:blank") {
      view.webContents.loadURL(url).catch((err) => {
        console.error("Failed to load URL:", err);
        view.webContents.loadURL("about:blank").catch(console.error);
      });
    } else {
      view.webContents.loadURL("about:blank").catch(console.error);
    }
    mainWindow2.contentView.addChildView(view);
    if (this.currentBrowserBounds) {
      view.setBounds(this.currentBrowserBounds);
    } else {
      view.setBounds({ x: 0, y: 0, width: mainWindow2.getBounds().width, height: mainWindow2.getBounds().height });
    }
    this.broadcastTabsUpdate();
    return tabId;
  }
  /**
   * Sets up event listeners for a tab's WebContents to track navigation, loading, and title changes.
   * @param wc The WebContents instance.
   * @param tabId The ID of the tab.
   */
  setupWebContentsListeners(wc, tabId) {
    wc.on("page-title-updated", (event, title) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.title = title;
        this.broadcastTabUpdate(tabId);
      }
    });
    wc.on("did-start-loading", () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.isLoading = true;
        this.broadcastTabUpdate(tabId);
      }
    });
    wc.on("did-stop-loading", () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.isLoading = false;
        this.broadcastTabUpdate(tabId);
      }
    });
    wc.on("did-navigate", (event, url) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        this.broadcastTabUpdate(tabId);
      }
    });
    wc.on("did-navigate-in-page", (event, url) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        this.broadcastTabUpdate(tabId);
      }
    });
    wc.on("did-start-navigation", () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.canGoBack = wc.canGoBack();
        tab.canGoForward = wc.canGoForward();
        this.broadcastTabUpdate(tabId);
      }
    });
    wc.on("did-stop-loading", () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.canGoBack = wc.canGoBack();
        tab.canGoForward = wc.canGoForward();
        this.broadcastTabUpdate(tabId);
      }
    });
  }
  /**
   * Broadcasts an update for a specific tab to the renderer process.
   * @param tabId The ID of the tab that was updated.
   */
  broadcastTabUpdate(tabId) {
    const mainWindow2 = getMainWindow();
    if (mainWindow2 && !mainWindow2.isDestroyed()) {
      const tab = this.tabs.get(tabId);
      mainWindow2.webContents.send("tab-updated", tab);
    }
  }
  /**
   * Retrieves information about a specific tab.
   * @param tabId The ID of the tab.
   * @returns The tab information or undefined if not found.
   */
  getTab(tabId) {
    return this.tabs.get(tabId);
  }
  /**
   * Retrieves the WebContentsView associated with a specific tab.
   * @param tabId The ID of the tab.
   * @returns The WebContentsView or undefined if not found.
   */
  getWebContents(tabId) {
    return this.tabViews.get(tabId);
  }
  /**
   * Retrieves information about all currently open tabs.
   * @returns An array of all tab information objects.
   */
  getAllTabs() {
    return Array.from(this.tabs.values());
  }
  /**
   * Closes a specific tab and destroys its associated WebContentsView.
   * @param tabId The ID of the tab to close.
   */
  closeTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (tab) {
      const view = this.tabViews.get(tabId);
      if (view) {
        const mainWindow2 = getMainWindow();
        if (mainWindow2 && !mainWindow2.isDestroyed()) {
          mainWindow2.contentView.removeChildView(view);
        }
        view.webContents.destroy();
      }
      this.tabs.delete(tabId);
      this.tabViews.delete(tabId);
      if (this.activeTabId === tabId) {
        const remainingTabs = Array.from(this.tabs.keys());
        this.activeTabId = remainingTabs[0] || null;
        this.updateActiveTabView();
      }
      this.broadcastTabsUpdate();
    }
  }
  /**
   * Sets the specified tab as the active (visible) tab.
   * @param tabId The ID of the tab to activate.
   */
  setActiveTab(tabId) {
    if (this.tabs.has(tabId)) {
      this.activeTabId = tabId;
      this.updateActiveTabView();
      this.broadcastTabsUpdate();
    }
  }
  /**
   * Updates the visibility and bounds of the WebContentsViews based on the currently active tab.
   */
  updateActiveTabView() {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2 || mainWindow2.isDestroyed()) return;
    for (const [tabId, view] of this.tabViews.entries()) {
      if (tabId === this.activeTabId) {
        view.setVisible(true);
        if (this.currentBrowserBounds) {
          view.setBounds(this.currentBrowserBounds);
        }
      } else {
        view.setVisible(false);
      }
    }
  }
  /**
   * Retrieves information about the currently active tab.
   * @returns The active tab information or null if no tab is active.
   */
  getActiveTab() {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }
  /**
   * Navigates the active tab to a specified URL.
   * @param url The URL to navigate to.
   * @returns True if navigation started successfully, false otherwise.
   */
  navigateTo(url) {
    if (!this.activeTabId) return false;
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;
    const view = this.tabViews.get(this.activeTabId);
    if (!view) return false;
    let finalUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("about:")) {
      finalUrl = "https://" + url;
    }
    view.webContents.loadURL(finalUrl).catch((err) => {
      console.error("Failed to load URL:", err);
    });
    return true;
  }
  /**
   * Navigates the active tab back in its history.
   * @returns True if navigation started successfully, false otherwise.
   */
  goBack() {
    if (!this.activeTabId) return false;
    const view = this.tabViews.get(this.activeTabId);
    if (!view) return false;
    if (view.webContents.canGoBack()) {
      view.webContents.goBack();
      return true;
    }
    return false;
  }
  /**
   * Navigates the active tab forward in its history.
   * @returns True if navigation started successfully, false otherwise.
   */
  goForward() {
    if (!this.activeTabId) return false;
    const view = this.tabViews.get(this.activeTabId);
    if (!view) return false;
    if (view.webContents.canGoForward()) {
      view.webContents.goForward();
      return true;
    }
    return false;
  }
  /**
   * Reloads the current page in the active tab.
   * @returns True if reload started successfully, false otherwise.
   */
  reload() {
    if (!this.activeTabId) return false;
    const view = this.tabViews.get(this.activeTabId);
    if (!view) return false;
    view.webContents.reload();
    return true;
  }
  /**
   * Stops the active tab from loading.
   * @returns True if stop command was sent successfully, false otherwise.
   */
  stopLoading() {
    if (!this.activeTabId) return false;
    const view = this.tabViews.get(this.activeTabId);
    if (!view) return false;
    view.webContents.stop();
    return true;
  }
  /**
   * Retrieves the URL of the currently active tab.
   * @returns The current URL or an empty string if no tab is active.
   */
  getCurrentUrl() {
    if (!this.activeTabId) return "";
    const tab = this.tabs.get(this.activeTabId);
    return tab?.url || "";
  }
  /**
   * Retrieves the title of the currently active tab.
   * @returns The current title or an empty string if no tab is active.
   */
  getCurrentTitle() {
    if (!this.activeTabId) return "";
    const tab = this.tabs.get(this.activeTabId);
    return tab?.title || "";
  }
  /**
   * Sets the bounds for the browser area. Called by the renderer process when the window resizes.
   * @param bounds The new bounds for the browser area.
   */
  setBrowserAreaBounds(bounds) {
    console.log(`[BrowserManager] Setting browser bounds:`, bounds);
    this.currentBrowserBounds = bounds;
    if (this.activeTabId) {
      const view = this.tabViews.get(this.activeTabId);
      if (view) {
        view.setBounds(bounds);
      }
    }
  }
  /**
   * Sets the visibility of all browser views. Used to hide them when overlays are open.
   * @param visible Whether the browser views should be visible.
   */
  setBrowserViewVisibility(visible) {
    console.log(`[BrowserManager] Setting browser visibility: ${visible}`);
    if (this.activeTabId) {
      const view = this.tabViews.get(this.activeTabId);
      if (view) {
        view.setVisible(visible);
      }
    }
  }
  /**
   * Duplicates an existing tab by creating a new tab with the same URL.
   * @param tabId The ID of the tab to duplicate.
   * @returns The ID of the newly created tab, or null if the original tab was not found.
   */
  duplicateTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;
    return this.createTab(tab.url);
  }
  /**
   * Broadcasts the full list of tabs and the active tab ID to the renderer process.
   */
  broadcastTabsUpdate() {
    const mainWindow2 = getMainWindow();
    if (mainWindow2 && !mainWindow2.isDestroyed()) {
      mainWindow2.webContents.send("tabs-updated", {
        tabs: this.getAllTabs(),
        activeTabId: this.activeTabId
      });
    }
  }
}
const BrowserManager$1 = new BrowserManager();
const isDev = process.env.NODE_ENV === "development";
const __dirname$1 = path.dirname(new URL(import.meta.url).pathname);
let mainWindow$1 = null;
function createWindow() {
  mainWindow$1 = new BrowserWindow({
    width: 1600,
    height: 1e3,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    icon: path.join(__dirname$1, "../../public/icon.png")
  });
  const startUrl = isDev ? "http://localhost:5173" : `file://${path.join(__dirname$1, "../../../dist/renderer/index.html")}`;
  mainWindow$1.loadURL(startUrl);
  if (isDev) {
    mainWindow$1.webContents.openDevTools();
  }
  mainWindow$1.on("closed", () => {
    mainWindow$1 = null;
  });
  return mainWindow$1;
}
function getMainWindow() {
  return mainWindow$1;
}
class Storage {
  constructor() {
    this.dataDir = path.join(app.getPath("userData"), "data");
    this.bookmarksFile = path.join(this.dataDir, "bookmarks.json");
    this.historyFile = path.join(this.dataDir, "history.json");
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.bookmarksFile)) {
      fs.writeFileSync(this.bookmarksFile, JSON.stringify([]));
    }
    if (!fs.existsSync(this.historyFile)) {
      fs.writeFileSync(this.historyFile, JSON.stringify([]));
    }
  }
  // Bookmarks
  /**
   * Retrieves all saved bookmarks.
   * @returns An array of `Bookmark` objects.
   */
  getBookmarks() {
    try {
      const data = fs.readFileSync(this.bookmarksFile, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to read bookmarks:", error);
      return [];
    }
  }
  /**
   * Adds a new bookmark.
   * @param title The title of the bookmark.
   * @param url The URL of the bookmark.
   * @returns The newly created `Bookmark` object.
   */
  addBookmark(title, url) {
    const bookmarks = this.getBookmarks();
    const bookmark = {
      id: Date.now().toString(),
      title,
      url,
      createdAt: Date.now()
    };
    bookmarks.push(bookmark);
    this.saveBookmarks(bookmarks);
    return bookmark;
  }
  /**
   * Removes a bookmark by its ID.
   * @param id The unique identifier of the bookmark to remove.
   * @returns `true` if the bookmark was removed successfully, `false` otherwise.
   */
  removeBookmark(id) {
    const bookmarks = this.getBookmarks();
    const filtered = bookmarks.filter((b) => b.id !== id);
    if (filtered.length < bookmarks.length) {
      this.saveBookmarks(filtered);
      return true;
    }
    return false;
  }
  /**
   * Persists the current list of bookmarks to the bookmarks JSON file.
   * This method is called internally after any modification to the bookmarks.
   * @param bookmarks The array of `Bookmark` objects to save.
   */
  saveBookmarks(bookmarks) {
    try {
      fs.writeFileSync(this.bookmarksFile, JSON.stringify(bookmarks, null, 2));
    } catch (error) {
      console.error("Failed to save bookmarks:", error);
    }
  }
  // History
  /**
   * Retrieves a limited number of recent browsing history entries.
   * @param limit The maximum number of history entries to retrieve. Defaults to 100.
   * @returns An array of `HistoryEntry` objects, sorted by `visitedAt` in descending order.
   */
  getHistory(limit = 100) {
    try {
      const data = fs.readFileSync(this.historyFile, "utf-8");
      const history = JSON.parse(data);
      return history.sort((a, b) => b.visitedAt - a.visitedAt).slice(0, limit);
    } catch (error) {
      console.error("Failed to read history:", error);
      return [];
    }
  }
  /**
   * Adds a new entry to the browsing history or updates an existing one.
   * If an entry with the same URL exists, its `visitedAt` timestamp and `visitCount` are updated.
   * @param url The URL of the visited page.
   * @param title The title of the visited page.
   * @returns The `HistoryEntry` object that was added or updated.
   */
  addToHistory(url, title) {
    const history = this.getAllHistory();
    const existing = history.find((h) => h.url === url);
    if (existing) {
      existing.visitedAt = Date.now();
      existing.visitCount += 1;
      existing.title = title;
    } else {
      const entry = {
        id: Date.now().toString(),
        url,
        title,
        visitedAt: Date.now(),
        visitCount: 1
      };
      history.push(entry);
    }
    this.saveHistory(history);
    return existing || history[history.length - 1];
  }
  /**
   * Clears all browsing history entries.
   */
  clearHistory() {
    this.saveHistory([]);
  }
  /**
   * Retrieves all browsing history entries without any limit or sorting.
   * @returns An array of `HistoryEntry` objects.
   */
  getAllHistory() {
    try {
      const data = fs.readFileSync(this.historyFile, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }
  /**
   * Persists the current list of history entries to the history JSON file.
   * This method is called internally after any modification to the history.
   * @param history The array of `HistoryEntry` objects to save.
   */
  saveHistory(history) {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  }
  // Generic KV Storage for Plugins/Framework
  getSettingsFile() {
    return path.join(this.dataDir, "settings.json");
  }
  getAllSettings() {
    const file = this.getSettingsFile();
    if (!fs.existsSync(file)) return {};
    try {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      return {};
    }
  }
  async get(key) {
    const settings = this.getAllSettings();
    return settings[key];
  }
  async set(key, value) {
    const settings = this.getAllSettings();
    settings[key] = value;
    try {
      fs.writeFileSync(this.getSettingsFile(), JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }
}
const Storage$1 = new Storage();
class PlanningEngine {
  constructor() {
    this.currentPlan = null;
  }
  createPlan(goal, tasks) {
    const plan = {
      id: Date.now().toString(),
      goal,
      tasks: tasks.map((t) => ({
        id: Math.random().toString(36).substr(2, 9),
        description: t,
        status: "pending"
      })),
      status: "active",
      createdAt: Date.now()
    };
    this.currentPlan = plan;
    return plan;
  }
  updateTaskStatus(taskId, status, result) {
    if (!this.currentPlan) return;
    const updateTask = (tasks) => {
      for (const task of tasks) {
        if (task.id === taskId) {
          task.status = status;
          if (result) task.result = result;
          return true;
        }
        if (task.subtasks && updateTask(task.subtasks)) return true;
      }
      return false;
    };
    updateTask(this.currentPlan.tasks);
  }
  getCurrentPlan() {
    return this.currentPlan;
  }
}
const PlanningEngine$1 = new PlanningEngine();
let mainWindow = null;
app.on("ready", () => {
  mainWindow = createWindow();
  BrowserManager$1.createTab("https://www.google.com");
  ({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log("[Main] Background initialized");
  ipcMain.handle("create-tab", async (event, url = "about:blank") => {
    const tabId = BrowserManager$1.createTab(url);
    return { tabId, tabs: BrowserManager$1.getAllTabs(), activeTabId: tabId };
  });
  ipcMain.handle("close-tab", async (event, tabId) => {
    BrowserManager$1.closeTab(tabId);
    return { tabs: BrowserManager$1.getAllTabs(), activeTabId: BrowserManager$1.getActiveTab()?.id };
  });
  ipcMain.handle("set-active-tab", async (event, tabId) => {
    BrowserManager$1.setActiveTab(tabId);
    return { activeTabId: tabId, tabs: BrowserManager$1.getAllTabs() };
  });
  ipcMain.handle("duplicate-tab", async (event, tabId) => {
    const newTabId = BrowserManager$1.duplicateTab(tabId);
    return { newTabId, tabs: BrowserManager$1.getAllTabs(), activeTabId: newTabId };
  });
  ipcMain.handle("get-all-tabs", async () => {
    return {
      tabs: BrowserManager$1.getAllTabs(),
      activeTabId: BrowserManager$1.getActiveTab()?.id
    };
  });
  ipcMain.handle("set-browser-area-bounds", async (event, bounds) => {
    BrowserManager$1.setBrowserAreaBounds(bounds);
    return true;
  });
  ipcMain.handle("set-browser-view-visibility", async (event, visible) => {
    BrowserManager$1.setBrowserViewVisibility(visible);
    return true;
  });
  const scaffoldService = new ProjectScaffoldService();
  ipcMain.handle("get-project-templates", async () => {
    const templates = await scaffoldService.getAvailableTemplates();
    return { templates };
  });
  ipcMain.handle("create-project", async (event, request) => {
    return scaffoldService.createProject(request, (progress) => {
      mainWindow.webContents.send("project-creation-progress", progress);
    });
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
ipcMain.handle("get-app-path", () => {
  return app.getAppPath();
});
ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});
ipcMain.handle("navigate-to", async (event, url) => {
  return BrowserManager$1.navigateTo(url);
});
ipcMain.handle("go-back", async () => {
  return BrowserManager$1.goBack();
});
ipcMain.handle("go-forward", async () => {
  return BrowserManager$1.goForward();
});
ipcMain.handle("reload", async () => {
  return BrowserManager$1.reload();
});
ipcMain.handle("stop-loading", async () => {
  return BrowserManager$1.stopLoading();
});
ipcMain.handle("get-current-url", async () => {
  return BrowserManager$1.getCurrentUrl();
});
ipcMain.handle("get-current-title", async () => {
  return BrowserManager$1.getCurrentTitle();
});
ipcMain.handle("get-bookmarks", async () => {
  return Storage$1.getBookmarks();
});
ipcMain.handle("add-bookmark", async (event, title, url) => {
  return Storage$1.addBookmark(title, url);
});
ipcMain.handle("delete-bookmark", async (event, id) => {
  return Storage$1.removeBookmark(id);
});
ipcMain.handle("get-history", async (event, limit) => {
  return Storage$1.getHistory(limit);
});
ipcMain.handle("add-to-history", async (event, url, title) => {
  return Storage$1.addToHistory(url, title);
});
ipcMain.handle("clear-history", async () => {
  Storage$1.clearHistory();
  return true;
});
ipcMain.handle("get-sessions", async () => {
  return SessionManager.getSessions();
});
ipcMain.handle("get-session", async (event, id) => {
  return SessionManager.getSession(id);
});
ipcMain.handle("save-session", async (event, name, tabs) => {
  return SessionManager.saveSession(name, tabs);
});
ipcMain.handle("update-session", async (event, id, tabs) => {
  return SessionManager.updateSession(id, tabs);
});
ipcMain.handle("delete-session", async (event, id) => {
  return SessionManager.deleteSession(id);
});
ipcMain.handle("rename-session", async (event, id, newName) => {
  return SessionManager.renameSession(id, newName);
});
ipcMain.handle("create-tab-group", async (event, name, color) => {
  return TabGroupManager.createGroup(name, color);
});
ipcMain.handle("get-tab-groups", async () => {
  return TabGroupManager.getGroups();
});
ipcMain.handle("delete-tab-group", async (event, id) => {
  return TabGroupManager.deleteGroup(id);
});
ipcMain.handle("add-tab-to-group", async (event, tabId, groupId) => {
  return TabGroupManager.addTabToGroup(tabId, groupId);
});
ipcMain.handle("remove-tab-from-group", async (event, tabId) => {
  return TabGroupManager.removeTabFromGroup(tabId);
});
ipcMain.handle("pin-tab", async (event, tabId) => {
  TabGroupManager.pinTab(tabId);
  return true;
});
ipcMain.handle("unpin-tab", async (event, tabId) => {
  TabGroupManager.unpinTab(tabId);
  return true;
});
ipcMain.handle("sleep-tab", async (event, tabId) => {
  TabGroupManager.sleepTab(tabId);
  return true;
});
ipcMain.handle("wake-tab", async (event, tabId) => {
  TabGroupManager.wakeTab(tabId);
  return true;
});
ipcMain.handle("set-tab-color", async (event, tabId, color) => {
  TabGroupManager.setTabColor(tabId, color);
  return true;
});
ipcMain.handle("get-tab-properties", async (event, tabId) => {
  return TabGroupManager.getTabProperties(tabId);
});
ipcMain.handle("create-layout", async (event, name, layout) => {
  return PanelManager.createLayout(name, layout);
});
ipcMain.handle("get-layouts", async () => {
  return PanelManager.getLayouts();
});
ipcMain.handle("get-layout", async (event, id) => {
  return PanelManager.getLayout(id);
});
ipcMain.handle("update-layout", async (event, id, layout) => {
  return PanelManager.updateLayout(id, layout);
});
ipcMain.handle("delete-layout", async (event, id) => {
  return PanelManager.deleteLayout(id);
});
ipcMain.handle("rename-layout", async (event, id, newName) => {
  return PanelManager.renameLayout(id, newName);
});
ipcMain.handle("create-conversation", async (event, serviceId, title) => {
  return AIServiceManager.createConversation(serviceId, title);
});
ipcMain.handle("get-conversation", async (event, id) => {
  return AIServiceManager.getConversation(id);
});
ipcMain.handle("get-conversations", async (event, serviceId) => {
  return AIServiceManager.getConversations(serviceId);
});
ipcMain.handle("add-message", async (event, conversationId, role, content) => {
  return AIServiceManager.addMessage(conversationId, role, content);
});
ipcMain.handle("update-conversation-title", async (event, id, title) => {
  return AIServiceManager.updateConversationTitle(id, title);
});
ipcMain.handle("delete-conversation", async (event, id) => {
  return AIServiceManager.deleteConversation(id);
});
ipcMain.handle("add-project", async (event, rootPath, name) => {
  return ProjectManager.addProject(rootPath, name);
});
ipcMain.handle("get-projects", async () => {
  return ProjectManager.getProjects();
});
ipcMain.handle("get-project", async (event, id) => {
  return ProjectManager.getProject(id);
});
ipcMain.handle("update-project-last-opened", async (event, id) => {
  return ProjectManager.updateProjectLastOpened(id);
});
ipcMain.handle("delete-project", async (event, id) => {
  return ProjectManager.deleteProject(id);
});
ipcMain.handle("rename-project", async (event, id, newName) => {
  return ProjectManager.renameProject(id, newName);
});
ipcMain.handle("get-project-files", async (event, projectId, relativePath) => {
  return ProjectManager.getProjectFiles(projectId, relativePath);
});
ipcMain.handle("read-file", async (event, projectId, filePath) => {
  return ProjectManager.readFile(projectId, filePath);
});
ipcMain.handle("write-file", async (event, projectId, filePath, content) => {
  return ProjectManager.writeFile(projectId, filePath, content);
});
ipcMain.handle("delete-file", async (event, projectId, filePath) => {
  return ProjectManager.deleteFile(projectId, filePath);
});
ipcMain.handle("create-file", async (event, projectId, filePath) => {
  return ProjectManager.createFile(projectId, filePath);
});
ipcMain.handle("create-directory", async (event, projectId, dirPath) => {
  return ProjectManager.createDirectory(projectId, dirPath);
});
ipcMain.handle("set-git-project-path", async (event, projectPath) => {
  GitManager.setProjectPath(projectPath);
  return true;
});
ipcMain.handle("get-git-status", async () => {
  return GitManager.getStatus();
});
ipcMain.handle("get-git-commits", async (event, limit) => {
  return GitManager.getCommitHistory(limit);
});
ipcMain.handle("git-commit", async (event, { message }) => {
  return GitManager.commit(message);
});
ipcMain.handle("git-push", async () => {
  return GitManager.push();
});
ipcMain.handle("git-pull", async () => {
  return GitManager.pull();
});
ipcMain.handle("git-create-branch", async (event, { name }) => {
  return GitManager.createBranch(name);
});
ipcMain.handle("git-switch-branch", async (event, { name }) => {
  return GitManager.switchBranch(name);
});
ipcMain.handle("get-git-branches", async () => {
  return GitManager.getBranches();
});
ipcMain.handle("git-get-diff", async (event, filePath) => {
  return GitManager.getDiff(filePath);
});
ipcMain.handle("update-context", async (event, updates) => {
  return ContextEngine.updateContext(updates);
});
ipcMain.handle("get-context", async () => {
  return ContextEngine.getContext();
});
ipcMain.handle("get-context-summary", async () => {
  return ContextEngine.getContextSummary();
});
ipcMain.handle("create-plan", async (event, goal, tasks) => {
  return PlanningEngine$1.createPlan(goal, tasks);
});
ipcMain.handle("update-plan-task", async (event, taskId, status, result) => {
  return PlanningEngine$1.updateTaskStatus(taskId, status, result);
});
ipcMain.handle("get-current-plan", async () => {
  return PlanningEngine$1.getCurrentPlan();
});
ipcMain.handle("terminal-execute", async (event, { command }) => {
  const forbiddenChars = [";", "&", "|", ">", "<", "`", "$", "(", ")", "{", "}", "[", "]"];
  const hasForbidden = forbiddenChars.some((char) => command.includes(char));
  const allowedCommands = ["pnpm", "npm", "ls", "git", "pwd", "echo"];
  const isAllowed = allowedCommands.some((cmd) => command.trim().startsWith(cmd));
  if (hasForbidden && !isAllowed) {
    return {
      output: "",
      error: "Command contains potentially unsafe characters and is not in the allowed list."
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
ipcMain.handle("get-diagnostics", async () => {
  return {
    diagnostics: [
      {
        id: "diag-1",
        file: "src/main/background.ts",
        line: 1,
        column: 1,
        severity: "info",
        message: "System initialized successfully",
        source: "System"
      }
    ]
  };
});
ipcMain.handle("get-system-stats", async () => {
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
    branch: "master"
  };
});
