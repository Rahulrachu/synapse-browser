"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const child_process = require("child_process");
const path = require("path");
const fs = require("fs");
const node_fs = require("node:fs");
const path$1 = require("node:path");
const node_crypto = require("node:crypto");
const nanoid = require("nanoid");
const fs$1 = require("fs/promises");
const util = require("util");
const os = require("os");
const isDev = process.env.NODE_ENV === "development";
const __dirname$1 = path.dirname(new URL(require("url").pathToFileURL(__filename).href).pathname);
let mainWindow$1 = null;
function createWindow() {
  mainWindow$1 = new electron.BrowserWindow({
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
class BrowserManager {
  tabs = /* @__PURE__ */ new Map();
  activeTabId = null;
  tabViews = /* @__PURE__ */ new Map();
  // tabId -> WebContentsView
  currentBrowserBounds = null;
  /**
   * Creates a new browser tab and its associated WebContentsView.
   * @param url The initial URL to load. Defaults to 'about:blank'.
   * @returns The unique ID of the newly created tab.
   */
  createTab(url = "about:blank") {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2) throw new Error("Main window not found");
    const tabId = Date.now().toString();
    const view = new electron.WebContentsView({
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
    let finalUrl;
    try {
      const candidate = String(url || "").trim();
      const parsed = new URL(/^https?:\/\//i.test(candidate) || /^about:/i.test(candidate) ? candidate : `https://${candidate}`);
      if (!["http:", "https:"].includes(parsed.protocol) && parsed.href !== "about:blank") return false;
      finalUrl = parsed.toString();
    } catch {
      return false;
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
class Storage {
  dataDir;
  bookmarksFile;
  historyFile;
  constructor() {
    this.dataDir = path.join(electron.app.getPath("userData"), "data");
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
    const notesFile = path.join(this.dataDir, "notes.json");
    const promptsFile = path.join(this.dataDir, "prompts.json");
    if (!fs.existsSync(notesFile)) fs.writeFileSync(notesFile, JSON.stringify([]));
    if (!fs.existsSync(promptsFile)) fs.writeFileSync(promptsFile, JSON.stringify([]));
  }
  // Notes
  getNotes() {
    try {
      const file = path.join(this.dataDir, "notes.json");
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      return [];
    }
  }
  saveNote(note) {
    const notes = this.getNotes();
    const index = notes.findIndex((n) => n.id === note.id);
    if (index >= 0) notes[index] = note;
    else notes.push(note);
    fs.writeFileSync(path.join(this.dataDir, "notes.json"), JSON.stringify(notes, null, 2));
  }
  deleteNote(id) {
    const notes = this.getNotes().filter((n) => n.id !== id);
    fs.writeFileSync(path.join(this.dataDir, "notes.json"), JSON.stringify(notes, null, 2));
  }
  // Prompts
  getPrompts() {
    try {
      const file = path.join(this.dataDir, "prompts.json");
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch {
      return [];
    }
  }
  savePrompt(prompt) {
    const prompts = this.getPrompts();
    const index = prompts.findIndex((p) => p.id === prompt.id);
    if (index >= 0) prompts[index] = prompt;
    else prompts.push(prompt);
    fs.writeFileSync(path.join(this.dataDir, "prompts.json"), JSON.stringify(prompts, null, 2));
  }
  deletePrompt(id) {
    const prompts = this.getPrompts().filter((p) => p.id !== id);
    fs.writeFileSync(path.join(this.dataDir, "prompts.json"), JSON.stringify(prompts, null, 2));
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
  currentPlan = null;
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
const MAX_OUTPUT = 24e3;
const SAFE_COMMAND = /^(pwd|ls(?:\s+[-\w./]+)?|find\s+[-\w./]+(?:\s+-maxdepth\s+\d+)?|git\s+(?:status|diff|log|branch)(?:\s+[-\w./]+)*|npm\s+(?:test|run\s+(?:build|test|lint))(?:\s+[-\w./]+)*|pnpm\s+(?:test|run\s+(?:build|test|lint))(?:\s+[-\w./]+)*)$/;
function trim(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > MAX_OUTPUT ? text.slice(0, MAX_OUTPUT) + "\n[output truncated]" : text;
}
function safeRelative(filePath) {
  const input = String(filePath || "");
  if (!input || input.includes("\0")) throw new Error("Invalid workspace path");
  const normalized = path$1.posix.normalize(input.replaceAll("\\", "/"));
  if (normalized === ".." || normalized.startsWith("../") || path$1.posix.isAbsolute(normalized)) throw new Error("Path must remain inside the project workspace");
  return normalized;
}
function isSafeCommand(command) {
  return SAFE_COMMAND.test(String(command || "").trim());
}
const MAX_RESEARCH_SOURCES = 8;
const MAX_SOURCE_SUMMARY = 600;
function trackSource(current, source, max = MAX_RESEARCH_SOURCES) {
  const normalizedUrl = String(source.url || "").trim();
  if (!normalizedUrl || !/^https?:\/\//i.test(normalizedUrl)) return current;
  const next = current.filter((item) => item.url !== normalizedUrl);
  next.push({
    title: String(source.title || normalizedUrl).slice(0, 240),
    url: normalizedUrl,
    summary: String(source.summary || "").slice(0, MAX_SOURCE_SUMMARY),
    relevance: String(source.relevance || "Inspected directly by Synapse").slice(0, 240)
  });
  return next.slice(-max);
}
const MAX_STEPS = 12;
const TOOL_NAMES = /* @__PURE__ */ new Set(["open_page", "read_page", "list_workspace", "read_workspace_file", "write_workspace_file", "run_safe_command", "save_note"]);
const tools = [
  { type: "function", function: { name: "open_page", description: "Navigate the active browser tab to an http(s) URL.", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"], additionalProperties: false } } },
  { type: "function", function: { name: "read_page", description: "Read the active page URL, title, and visible text.", parameters: { type: "object", properties: { maxChars: { type: "number" } }, additionalProperties: false } } },
  { type: "function", function: { name: "list_workspace", description: "List files in a registered project workspace.", parameters: { type: "object", properties: { projectId: { type: "string" }, relativePath: { type: "string" } }, required: ["projectId"], additionalProperties: false } } },
  { type: "function", function: { name: "read_workspace_file", description: "Read a text file in a registered project workspace.", parameters: { type: "object", properties: { projectId: { type: "string" }, filePath: { type: "string" } }, required: ["projectId", "filePath"], additionalProperties: false } } },
  { type: "function", function: { name: "write_workspace_file", description: "Create or overwrite a text file in a registered project workspace.", parameters: { type: "object", properties: { projectId: { type: "string" }, filePath: { type: "string" }, content: { type: "string" } }, required: ["projectId", "filePath", "content"], additionalProperties: false } } },
  { type: "function", function: { name: "run_safe_command", description: "Run a read-only or test/build command in the registered project workspace. Commands are allowlisted.", parameters: { type: "object", properties: { projectId: { type: "string" }, command: { type: "string" } }, required: ["projectId", "command"], additionalProperties: false } } },
  { type: "function", function: { name: "save_note", description: "Persist a useful finding as a Synapse workspace note.", parameters: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } }, required: ["title", "content"], additionalProperties: false } } }
];
function emit(window, event) {
  if (window && !window.isDestroyed?.()) window.webContents.send("agent:event", event);
}
class AgentRuntime {
  constructor(window) {
    this.window = window;
    electron.ipcMain.handle("agent:run", (_, request) => this.start(request));
    electron.ipcMain.handle("agent:cancel", (_, runId) => this.cancel(runId));
    electron.ipcMain.handle("agent:history", () => Storage$1.get("agent-runs"));
  }
  window;
  active = /* @__PURE__ */ new Map();
  start(request) {
    const runId = node_crypto.randomUUID();
    void this.run(request, runId).catch(() => void 0);
    return { runId, status: "started" };
  }
  cancel(runId) {
    const controller = this.active.get(String(runId));
    if (!controller) return false;
    controller.abort();
    return true;
  }
  async projectRoot(projectId) {
    const projects = await Storage$1.get("projects") || [];
    const project = projects.find((p) => p.id === projectId);
    if (!project?.rootPath) throw new Error("A registered projectId is required for workspace tools");
    const root = await node_fs.promises.realpath(project.rootPath);
    const stat = await node_fs.promises.stat(root);
    if (!stat.isDirectory()) throw new Error("Project root is not a directory");
    return root;
  }
  async confinedPath(root, relative, allowMissing = false) {
    const candidate = path$1.resolve(root, safeRelative(relative));
    if (candidate !== root && !candidate.startsWith(root + path$1.sep)) throw new Error("Path must remain inside the project workspace");
    try {
      const real = await node_fs.promises.realpath(candidate);
      if (real !== root && !real.startsWith(root + path$1.sep)) throw new Error("Workspace symlink escapes project root");
      return real;
    } catch (error) {
      if (!allowMissing || error?.code !== "ENOENT") throw error;
      const parent = await node_fs.promises.realpath(path$1.dirname(candidate));
      if (parent !== root && !parent.startsWith(root + path$1.sep)) throw new Error("Workspace path escapes project root");
      return candidate;
    }
  }
  async tool(name, args, signal, onSource) {
    if (!TOOL_NAMES.has(name)) throw new Error(`Unknown tool: ${name}`);
    if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Tool arguments must be an object");
    if (signal.aborted) throw new Error("Agent run cancelled");
    if (name === "open_page") {
      const parsed = new URL(String(args.url || ""));
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http(s) URLs are allowed");
      if (!BrowserManager$1.navigateTo(parsed.toString())) throw new Error("No active browser tab");
      return `Navigation started: ${parsed.toString()}`;
    }
    if (name === "read_page") {
      const tab = BrowserManager$1.getActiveTab();
      const view = tab && BrowserManager$1.getWebContents(tab.id);
      if (!view) throw new Error("No active browser tab");
      const max = Math.min(Math.max(Number(args.maxChars) || 16e3, 200), MAX_OUTPUT);
      const result = await view.webContents.executeJavaScript(`({url: location.href, title: document.title, text: (document.body?.innerText || '').slice(0, ${max})})`, true);
      onSource?.({ title: result?.title || result?.url || "Untitled page", url: result?.url || "", summary: result?.text || "", relevance: "Inspected directly by Synapse" });
      return trim(result);
    }
    if (name === "save_note") {
      const title = String(args.title || "").trim();
      const content = String(args.content || "");
      if (!title || title.length > 200 || content.length > MAX_OUTPUT) throw new Error("Invalid note size");
      const note = { id: node_crypto.randomUUID(), title, content, createdAt: Date.now(), updatedAt: Date.now() };
      const notes = await Storage$1.get("notes") || [];
      await Storage$1.set("notes", [...notes, note]);
      return `Saved note ${note.id}`;
    }
    const root = await this.projectRoot(String(args.projectId));
    if (name === "list_workspace") {
      const dir = await this.confinedPath(root, String(args.relativePath || "."), false);
      const entries = await node_fs.promises.readdir(dir, { withFileTypes: true });
      return entries.map((e) => `${e.isDirectory() ? "dir" : "file"} ${path$1.relative(root, path$1.join(dir, e.name))}`).join("\n");
    }
    if (name === "read_workspace_file") {
      const file = await this.confinedPath(root, String(args.filePath), false);
      return trim(await node_fs.promises.readFile(file, "utf8"));
    }
    if (name === "write_workspace_file") {
      const file = await this.confinedPath(root, String(args.filePath), true);
      const content = String(args.content || "");
      if (content.length > 2e5) throw new Error("Workspace file exceeds 200KB limit");
      await node_fs.promises.mkdir(path$1.dirname(file), { recursive: true });
      await node_fs.promises.writeFile(file, content, "utf8");
      return `Wrote ${args.filePath}`;
    }
    if (name === "run_safe_command") {
      const command = String(args.command || "").trim();
      if (!isSafeCommand(command)) throw new Error("Command is not allowlisted; only read-only git, listing, test, build, and lint commands are permitted");
      const { execFile } = await import("node:child_process");
      return await new Promise((resolve, reject) => {
        const child = execFile("/bin/sh", ["-lc", command], { cwd: root, timeout: 12e4, maxBuffer: MAX_OUTPUT * 2 }, (error, stdout, stderr) => {
          const output = trim(`${stdout || ""}${stderr ? `
${stderr}` : ""}`);
          if (signal.aborted) reject(new Error("Agent run cancelled"));
          else if (error) reject(new Error(output || error.message));
          else resolve(output);
        });
        signal.addEventListener("abort", () => child.kill("SIGTERM"), { once: true });
      });
    }
    throw new Error(`Unknown tool: ${name}`);
  }
  async providerFetch(url, init, signal) {
    const request = new AbortController();
    const timer = setTimeout(() => request.abort(), 12e4);
    const onAbort = () => request.abort();
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      return await fetch(url, { ...init, signal: request.signal });
    } catch (error) {
      if (signal.aborted) throw new Error("Agent run cancelled");
      if (error?.name === "AbortError") throw new Error("AI provider request timed out");
      throw new Error(`AI provider network failure: ${error?.message || String(error)}`);
    } finally {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    }
  }
  async run(request, existingRunId) {
    const runId = existingRunId || node_crypto.randomUUID();
    const controller = new AbortController();
    this.active.set(runId, controller);
    let history = [];
    let status = "failed";
    const log = (type, message, data) => emit(this.window, { runId, type, message, data, at: Date.now() });
    try {
      const goal = String(request?.goal || "").trim();
      if (!goal || goal.length > 8e3) throw new Error("A task goal between 1 and 8000 characters is required");
      history = await Storage$1.get("agent-runs") || [];
      const running = { runId, goal, status: "running", startedAt: Date.now() };
      await Storage$1.set("agent-runs", [...history.slice(-49), running]);
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
      const base = process.env.OPENAI_API_BASE || "https://api.openai.com/v1";
      const researchMode = /\bresearch\b/i.test(goal);
      let sources = [];
      const system = researchMode ? "You are Synapse Research Agent. Research questions must use controlled browser tools to inspect multiple relevant sources when possible, compare only information actually observed, and clearly distinguish inspected sources from general reasoning. Stay bounded and stop when sufficient evidence is gathered." : "You are Synapse Agent. Execute tasks through tools, never claim unexecuted actions, keep tool calls focused, and stop when complete.";
      const messages = [{ role: "system", content: system }, { role: "user", content: goal }];
      log("plan", "Plan created", PlanningEngine$1.createPlan(goal, ["Understand the goal and gather context", "Execute browser, research, or workspace actions", "Verify results and summarize deliverables"]));
      let completedByAssistant = false;
      for (let step = 0; step < MAX_STEPS; step++) {
        if (controller.signal.aborted) throw new Error("Agent run cancelled");
        log("plan", researchMode ? `Research step ${step + 1} of ${MAX_STEPS}` : `Step ${step + 1} of ${MAX_STEPS}`);
        const response = await this.providerFetch(`${base.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: request.model || "gpt-4o-mini", messages, tools, tool_choice: "auto", temperature: 0.2 }) }, controller.signal);
        if (!response.ok) throw new Error(`AI provider error ${response.status}: ${trim(await response.text())}`);
        const data = await response.json();
        const message = data?.choices?.[0]?.message;
        if (!message || typeof message !== "object") throw new Error("AI provider returned a malformed message");
        messages.push(message);
        if (!Array.isArray(message.tool_calls) || message.tool_calls.length === 0) {
          const answer = typeof message.content === "string" && message.content.trim() ? message.content : "Task completed";
          const sourceText = researchMode && sources.length ? `

Sources inspected (${sources.length}):
${sources.map((source, index) => `${index + 1}. ${source.title} — ${source.url}`).join("\n")}` : "";
          log("assistant", answer + sourceText, researchMode ? { sources } : void 0);
          completedByAssistant = true;
          break;
        }
        for (const call of message.tool_calls) {
          if (!call?.id || call.type !== "function" || !call.function?.name || typeof call.function.arguments !== "string") throw new Error("AI provider returned a malformed tool call");
          let args;
          try {
            args = JSON.parse(call.function.arguments || "{}");
          } catch {
            throw new Error(`Malformed arguments for tool ${call.function.name}`);
          }
          log("tool-start", `${call.function.name} started`, args);
          try {
            const result = await this.tool(call.function.name, args, controller.signal, (source) => {
              if (researchMode) sources = trackSource(sources, source, MAX_RESEARCH_SOURCES);
            });
            messages.push({ role: "tool", tool_call_id: call.id, content: result });
            log("tool-result", `${call.function.name} completed`, researchMode && call.function.name === "read_page" ? { result, sources } : result);
          } catch (error) {
            const result = `Tool failed: ${error?.message || String(error)}`;
            messages.push({ role: "tool", tool_call_id: call.id, content: result });
            log("error", result);
          }
        }
      }
      if (!completedByAssistant) throw new Error(`Maximum agent step limit of ${MAX_STEPS} reached`);
      status = "completed";
      const record = { runId, goal, status, sources: researchMode ? sources : void 0, completedAt: Date.now() };
      await Storage$1.set("agent-runs", [...history.slice(-49), record]);
      log("done", "Agent run completed", record);
      return record;
    } catch (error) {
      status = controller.signal.aborted ? "cancelled" : "failed";
      const record = { runId, goal: String(request?.goal || ""), status, error: error?.message || String(error), completedAt: Date.now() };
      const latest = (await Storage$1.get("agent-runs") || history).filter((entry) => entry.runId !== runId);
      await Storage$1.set("agent-runs", [...latest.slice(-49), record]);
      log(status === "cancelled" ? "done" : "error", record.error, record);
      throw error;
    } finally {
      this.active.delete(runId);
    }
  }
}
class ProjectScaffoldService {
  async getAvailableTemplates() {
    return [
      { id: "react-static", name: "React Static Site", description: "A simple React site with Tailwind" },
      { id: "electron-app", name: "Electron Desktop App", description: "Cross-platform desktop application" },
      { id: "node-api", name: "Node.js API", description: "Backend service with Express" }
    ];
  }
  async createProject(request, onProgress) {
    onProgress({ status: "initializing", percentage: 10 });
    setTimeout(() => onProgress({ status: "scaffolding", percentage: 40 }), 500);
    setTimeout(() => onProgress({ status: "installing-deps", percentage: 70 }), 1e3);
    setTimeout(() => onProgress({ status: "complete", percentage: 100 }), 1500);
    return { success: true, path: request.path };
  }
}
class SessionManager {
  sessions = [];
  async getSessions() {
    return this.sessions;
  }
  async getSession(id) {
    return this.sessions.find((s) => s.id === id);
  }
  async saveSession(name, tabs) {
    const session = {
      id: nanoid.nanoid(),
      name,
      tabs,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.sessions.push(session);
    return session;
  }
  async updateSession(id, tabs) {
    const session = this.sessions.find((s) => s.id === id);
    if (session) {
      session.tabs = tabs;
    }
    return session;
  }
  async deleteSession(id) {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    return true;
  }
  async renameSession(id, newName) {
    const session = this.sessions.find((s) => s.id === id);
    if (session) {
      session.name = newName;
    }
    return session;
  }
}
const SessionManager$1 = new SessionManager();
class TabGroupManager {
  groups = [];
  tabProperties = /* @__PURE__ */ new Map();
  async createGroup(name, color) {
    const group = {
      id: nanoid.nanoid(),
      name,
      color,
      tabs: []
    };
    this.groups.push(group);
    return group;
  }
  async getGroups() {
    return this.groups;
  }
  async deleteGroup(id) {
    this.groups = this.groups.filter((g) => g.id !== id);
    return true;
  }
  async addTabToGroup(tabId, groupId) {
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      if (!group.tabs.includes(tabId)) {
        group.tabs.push(tabId);
      }
    }
    return group;
  }
  async removeTabFromGroup(tabId) {
    this.groups.forEach((group) => {
      group.tabs = group.tabs.filter((id) => id !== tabId);
    });
    return true;
  }
  pinTab(tabId) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, pinned: true });
  }
  unpinTab(tabId) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, pinned: false });
  }
  sleepTab(tabId) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, sleeping: true });
  }
  wakeTab(tabId) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, sleeping: false });
  }
  setTabColor(tabId, color) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, color });
  }
  getTabProperties(tabId) {
    return this.tabProperties.get(tabId) || { pinned: false, sleeping: false };
  }
}
const TabGroupManager$1 = new TabGroupManager();
class PanelManager {
  layouts = [];
  async createLayout(name, layout) {
    const newLayout = {
      id: nanoid.nanoid(),
      name,
      layout,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.layouts.push(newLayout);
    return newLayout;
  }
  async getLayouts() {
    return this.layouts;
  }
  async getLayout(id) {
    return this.layouts.find((l) => l.id === id);
  }
  async updateLayout(id, layout) {
    const existing = this.layouts.find((l) => l.id === id);
    if (existing) {
      existing.layout = layout;
    }
    return existing;
  }
  async deleteLayout(id) {
    this.layouts = this.layouts.filter((l) => l.id !== id);
    return true;
  }
  async renameLayout(id, newName) {
    const layout = this.layouts.find((l) => l.id === id);
    if (layout) {
      layout.name = newName;
    }
    return layout;
  }
}
const PanelManager$1 = new PanelManager();
class ProjectManager {
  projects = [];
  async addProject(rootPath, name) {
    const project = {
      id: nanoid.nanoid(),
      name: name || path.basename(rootPath),
      path: rootPath,
      lastOpened: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.projects.push(project);
    return project;
  }
  async getProjects() {
    return this.projects;
  }
  async getProject(id) {
    return this.projects.find((p) => p.id === id);
  }
  async updateProjectLastOpened(id) {
    const project = this.projects.find((p) => p.id === id);
    if (project) {
      project.lastOpened = (/* @__PURE__ */ new Date()).toISOString();
    }
    return project;
  }
  async deleteProject(id) {
    this.projects = this.projects.filter((p) => p.id !== id);
    return true;
  }
  async renameProject(id, newName) {
    const project = this.projects.find((p) => p.id === id);
    if (project) {
      project.name = newName;
    }
    return project;
  }
  async getProjectFiles(projectId, relativePath = "") {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    const fullPath = path.join(project.path, relativePath);
    const entries = await fs$1.readdir(fullPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(relativePath, entry.name)
    }));
  }
  async readFile(projectId, filePath) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    return fs$1.readFile(path.join(project.path, filePath), "utf-8");
  }
  async writeFile(projectId, filePath, content) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    await fs$1.writeFile(path.join(project.path, filePath), content);
    return true;
  }
  async deleteFile(projectId, filePath) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    await fs$1.unlink(path.join(project.path, filePath));
    return true;
  }
  async createFile(projectId, filePath) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    await fs$1.writeFile(path.join(project.path, filePath), "");
    return true;
  }
  async createDirectory(projectId, dirPath) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    await fs$1.mkdir(path.join(project.path, dirPath), { recursive: true });
    return true;
  }
}
const ProjectManager$1 = new ProjectManager();
const execPromise = util.promisify(child_process.exec);
class GitManager {
  projectPath = "";
  setProjectPath(path2) {
    this.projectPath = path2;
  }
  async getStatus() {
    if (!this.projectPath) return null;
    try {
      const { stdout } = await execPromise("git status --porcelain", { cwd: this.projectPath });
      return stdout;
    } catch (e) {
      return null;
    }
  }
  async getCommitHistory(limit = 10) {
    if (!this.projectPath) return [];
    try {
      const { stdout } = await execPromise(`git log -n ${limit} --pretty=format:"%h - %s (%cr) <%an>"`, { cwd: this.projectPath });
      return stdout.split("\n");
    } catch (e) {
      return [];
    }
  }
  async commit(message) {
    if (!this.projectPath) return false;
    try {
      await execPromise("git add .", { cwd: this.projectPath });
      await execPromise(`git commit -m "${message}"`, { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async push() {
    if (!this.projectPath) return false;
    try {
      await execPromise("git push", { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async pull() {
    if (!this.projectPath) return false;
    try {
      await execPromise("git pull", { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async createBranch(name) {
    if (!this.projectPath) return false;
    try {
      await execPromise(`git checkout -b ${name}`, { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async switchBranch(name) {
    if (!this.projectPath) return false;
    try {
      await execPromise(`git checkout ${name}`, { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async getBranches() {
    if (!this.projectPath) return [];
    try {
      const { stdout } = await execPromise("git branch", { cwd: this.projectPath });
      return stdout.split("\n").map((b) => b.trim());
    } catch (e) {
      return [];
    }
  }
  async getDiff(filePath) {
    if (!this.projectPath) return "";
    try {
      const cmd = filePath ? `git diff ${filePath}` : "git diff";
      const { stdout } = await execPromise(cmd, { cwd: this.projectPath });
      return stdout;
    } catch (e) {
      return "";
    }
  }
}
const GitManager$1 = new GitManager();
class ContextEngine {
  context = {
    currentPage: null,
    selectedText: "",
    openTabs: [],
    activeWorkspace: null,
    files: [],
    editor: null,
    terminal: null,
    git: null,
    previousSteps: []
  };
  async updateContext(updates) {
    this.context = { ...this.context, ...updates };
    return this.context;
  }
  async getContext() {
    return this.context;
  }
  async getContextSummary() {
    return {
      tabCount: this.context.openTabs.length,
      hasActiveWorkspace: !!this.context.activeWorkspace,
      currentUrl: this.context.currentPage?.url
    };
  }
}
const ContextEngine$1 = new ContextEngine();
class AIServiceManager {
  dataDir;
  configFile;
  conversationsDir;
  services = /* @__PURE__ */ new Map();
  constructor() {
    this.dataDir = path.join(electron.app.getPath("userData"), "data");
    this.configFile = path.join(this.dataDir, "ai-services.json");
    this.conversationsDir = path.join(this.dataDir, "conversations");
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.conversationsDir)) {
      fs.mkdirSync(this.conversationsDir, { recursive: true });
    }
    this.loadServices();
  }
  /**
   * Loads AI service configurations from the file system.
   * If the configuration file does not exist or is invalid, it logs an error and initializes an empty set of services.
   */
  loadServices() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = JSON.parse(fs.readFileSync(this.configFile, "utf-8"));
        data.forEach((service) => {
          this.services.set(service.id, service);
        });
      }
    } catch (error) {
      console.error("Failed to load AI services:", error);
    }
  }
  /**
   * Adds a new AI service configuration.
   * @param service The type of AI service (e.g., 'chatgpt', 'claude').
   * @param name A user-friendly name for the service.
   * @param config Optional partial configuration to apply to the new service.
   * @returns The newly created and saved AI service configuration.
   */
  addService(service, name, config = {}) {
    const serviceConfig = {
      id: Date.now().toString(),
      service,
      name,
      enabled: true,
      createdAt: Date.now(),
      ...config
    };
    this.services.set(serviceConfig.id, serviceConfig);
    this.saveServices();
    return serviceConfig;
  }
  /**
   * Retrieves all registered AI service configurations.
   * @returns An array of all AI service configurations.
   */
  getServices() {
    return Array.from(this.services.values());
  }
  /**
   * Retrieves a specific AI service configuration by its ID.
   * @param id The unique identifier of the AI service.
   * @returns The AI service configuration if found, otherwise `undefined`.
   */
  getService(id) {
    return this.services.get(id);
  }
  /**
   * Retrieves AI service configurations filtered by service type.
   * @param service The type of AI service to filter by.
   * @returns An array of AI service configurations matching the specified type.
   */
  getServicesByType(service) {
    return Array.from(this.services.values()).filter((s) => s.service === service);
  }
  /**
   * Updates an existing AI service configuration.
   * @param id The unique identifier of the AI service to update.
   * @param updates A partial object containing the fields to update.
   * @returns `true` if the service was updated successfully, `false` otherwise.
   */
  updateService(id, updates) {
    const service = this.services.get(id);
    if (service) {
      Object.assign(service, updates);
      this.saveServices();
      return true;
    }
    return false;
  }
  /**
   * Deletes an AI service configuration by its ID.
   * @param id The unique identifier of the AI service to delete.
   * @returns `true` if the service was deleted successfully, `false` otherwise.
   */
  deleteService(id) {
    if (this.services.delete(id)) {
      this.saveServices();
      return true;
    }
    return false;
  }
  /**
   * Enables an AI service.
   * @param id The unique identifier of the AI service to enable.
   * @returns `true` if the service was enabled successfully, `false` otherwise.
   */
  enableService(id) {
    return this.updateService(id, { enabled: true });
  }
  /**
   * Disables an AI service.
   * @param id The unique identifier of the AI service to disable.
   * @returns `true` if the service was disabled successfully, `false` otherwise.
   */
  disableService(id) {
    return this.updateService(id, { enabled: false });
  }
  /**
   * Creates a new AI conversation for a given service.
   * @param serviceId The ID of the AI service this conversation belongs to.
   * @param title An optional title for the conversation. Defaults to 'New Conversation'.
   * @returns The newly created and saved AI conversation.
   */
  createConversation(serviceId, title = "New Conversation") {
    const conversation = {
      id: Date.now().toString(),
      serviceId,
      title,
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    this.saveConversation(conversation);
    return conversation;
  }
  /**
   * Retrieves a specific AI conversation by its ID.
   * @param id The unique identifier of the conversation.
   * @returns The AI conversation if found, otherwise `undefined`.
   */
  getConversation(id) {
    try {
      const filePath = path.join(this.conversationsDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
    return void 0;
  }
  /**
   * Retrieves all AI conversations, optionally filtered by service ID.
   * Conversations are sorted by `lastModified` in descending order.
   * @param serviceId Optional. The ID of the AI service to filter conversations by.
   * @returns An array of AI conversations.
   */
  getConversations(serviceId) {
    try {
      const files = fs.readdirSync(this.conversationsDir);
      const conversations = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(this.conversationsDir, file);
          const conv = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (!serviceId || conv.serviceId === serviceId) {
            conversations.push(conv);
          }
        }
      }
      return conversations.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      return [];
    }
  }
  /**
   * Adds a new message to an existing conversation.
   * @param conversationId The ID of the conversation to add the message to.
   * @param role The role of the message sender ('user', 'assistant', or 'system').
   * @param content The text content of the message.
   * @returns The newly added message if successful, otherwise `null`.
   */
  addMessage(conversationId, role, content) {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return null;
    const message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now()
    };
    conversation.messages.push(message);
    conversation.lastModified = Date.now();
    this.saveConversation(conversation);
    return message;
  }
  /**
   * Updates the title of an existing conversation.
   * @param id The ID of the conversation to update.
   * @param title The new title for the conversation.
   * @returns `true` if the title was updated successfully, `false` otherwise.
   */
  updateConversationTitle(id, title) {
    const conversation = this.getConversation(id);
    if (conversation) {
      conversation.title = title;
      conversation.lastModified = Date.now();
      this.saveConversation(conversation);
      return true;
    }
    return false;
  }
  /**
   * Deletes an AI conversation by its ID.
   * @param id The unique identifier of the conversation to delete.
   * @returns `true` if the conversation was deleted successfully, `false` otherwise.
   */
  deleteConversation(id) {
    try {
      const filePath = path.join(this.conversationsDir, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
    return false;
  }
  /**
   * Saves the current state of AI service configurations to the file system.
   * This method is called internally after any modification to the services.
   */
  saveServices() {
    try {
      fs.writeFileSync(
        this.configFile,
        JSON.stringify(Array.from(this.services.values()), null, 2)
      );
    } catch (error) {
      console.error("Failed to save AI services:", error);
    }
  }
  /**
   * Saves a single AI conversation to its respective file.
   * This method is called internally after any modification to a conversation.
   * @param conversation The AI conversation object to save.
   */
  saveConversation(conversation) {
    try {
      const filePath = path.join(this.conversationsDir, `${conversation.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(conversation, null, 2));
    } catch (error) {
      console.error("Failed to save conversation:", error);
    }
  }
}
const AIServiceManager$1 = new AIServiceManager();
let mainWindow = null;
electron.app.on("ready", () => {
  mainWindow = createWindow();
  new AgentRuntime(mainWindow);
  BrowserManager$1.createTab("https://www.google.com");
  ({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log("[Main] Background initialized");
  electron.ipcMain.handle("create-tab", async (event, url = "about:blank") => {
    const tabId = BrowserManager$1.createTab(url);
    return { tabId, tabs: BrowserManager$1.getAllTabs(), activeTabId: tabId };
  });
  electron.ipcMain.handle("close-tab", async (event, tabId) => {
    BrowserManager$1.closeTab(tabId);
    return { tabs: BrowserManager$1.getAllTabs(), activeTabId: BrowserManager$1.getActiveTab()?.id };
  });
  electron.ipcMain.handle("set-active-tab", async (event, tabId) => {
    BrowserManager$1.setActiveTab(tabId);
    return { activeTabId: tabId, tabs: BrowserManager$1.getAllTabs() };
  });
  electron.ipcMain.handle("duplicate-tab", async (event, tabId) => {
    const newTabId = BrowserManager$1.duplicateTab(tabId);
    return { newTabId, tabs: BrowserManager$1.getAllTabs(), activeTabId: newTabId };
  });
  electron.ipcMain.handle("get-all-tabs", async () => {
    return {
      tabs: BrowserManager$1.getAllTabs(),
      activeTabId: BrowserManager$1.getActiveTab()?.id
    };
  });
  electron.ipcMain.handle("set-browser-area-bounds", async (event, bounds) => {
    BrowserManager$1.setBrowserAreaBounds(bounds);
    return true;
  });
  electron.ipcMain.handle("set-browser-view-visibility", async (event, visible) => {
    BrowserManager$1.setBrowserViewVisibility(visible);
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
  return BrowserManager$1.navigateTo(url);
});
electron.ipcMain.handle("go-back", async () => {
  return BrowserManager$1.goBack();
});
electron.ipcMain.handle("go-forward", async () => {
  return BrowserManager$1.goForward();
});
electron.ipcMain.handle("reload", async () => {
  return BrowserManager$1.reload();
});
electron.ipcMain.handle("stop-loading", async () => {
  return BrowserManager$1.stopLoading();
});
electron.ipcMain.handle("get-current-url", async () => {
  return BrowserManager$1.getCurrentUrl();
});
electron.ipcMain.handle("get-current-title", async () => {
  return BrowserManager$1.getCurrentTitle();
});
electron.ipcMain.handle("get-bookmarks", async () => {
  return Storage$1.getBookmarks();
});
electron.ipcMain.handle("add-bookmark", async (event, title, url) => {
  return Storage$1.addBookmark(title, url);
});
electron.ipcMain.handle("delete-bookmark", async (event, id) => {
  return Storage$1.removeBookmark(id);
});
electron.ipcMain.handle("get-history", async (event, limit) => {
  return Storage$1.getHistory(limit);
});
electron.ipcMain.handle("add-to-history", async (event, url, title) => {
  return Storage$1.addToHistory(url, title);
});
electron.ipcMain.handle("clear-history", async () => {
  Storage$1.clearHistory();
  return true;
});
electron.ipcMain.handle("get-notes", async () => {
  return Storage$1.getNotes();
});
electron.ipcMain.handle("save-note", async (event, note) => {
  Storage$1.saveNote(note);
  return true;
});
electron.ipcMain.handle("delete-note", async (event, id) => {
  Storage$1.deleteNote(id);
  return true;
});
electron.ipcMain.handle("get-prompts", async () => {
  return Storage$1.getPrompts();
});
electron.ipcMain.handle("save-prompt", async (event, prompt) => {
  Storage$1.savePrompt(prompt);
  return true;
});
electron.ipcMain.handle("delete-prompt", async (event, id) => {
  Storage$1.deletePrompt(id);
  return true;
});
electron.ipcMain.handle("get-sessions", async () => {
  return SessionManager$1.getSessions();
});
electron.ipcMain.handle("get-session", async (event, id) => {
  return SessionManager$1.getSession(id);
});
electron.ipcMain.handle("save-session", async (event, name, tabs) => {
  return SessionManager$1.saveSession(name, tabs);
});
electron.ipcMain.handle("update-session", async (event, id, tabs) => {
  return SessionManager$1.updateSession(id, tabs);
});
electron.ipcMain.handle("delete-session", async (event, id) => {
  return SessionManager$1.deleteSession(id);
});
electron.ipcMain.handle("rename-session", async (event, id, newName) => {
  return SessionManager$1.renameSession(id, newName);
});
electron.ipcMain.handle("create-tab-group", async (event, name, color) => {
  return TabGroupManager$1.createGroup(name, color);
});
electron.ipcMain.handle("get-tab-groups", async () => {
  return TabGroupManager$1.getGroups();
});
electron.ipcMain.handle("delete-tab-group", async (event, id) => {
  return TabGroupManager$1.deleteGroup(id);
});
electron.ipcMain.handle("add-tab-to-group", async (event, tabId, groupId) => {
  return TabGroupManager$1.addTabToGroup(tabId, groupId);
});
electron.ipcMain.handle("remove-tab-from-group", async (event, tabId) => {
  return TabGroupManager$1.removeTabFromGroup(tabId);
});
electron.ipcMain.handle("pin-tab", async (event, tabId) => {
  TabGroupManager$1.pinTab(tabId);
  return true;
});
electron.ipcMain.handle("unpin-tab", async (event, tabId) => {
  TabGroupManager$1.unpinTab(tabId);
  return true;
});
electron.ipcMain.handle("sleep-tab", async (event, tabId) => {
  TabGroupManager$1.sleepTab(tabId);
  return true;
});
electron.ipcMain.handle("wake-tab", async (event, tabId) => {
  TabGroupManager$1.wakeTab(tabId);
  return true;
});
electron.ipcMain.handle("set-tab-color", async (event, tabId, color) => {
  TabGroupManager$1.setTabColor(tabId, color);
  return true;
});
electron.ipcMain.handle("get-tab-properties", async (event, tabId) => {
  return TabGroupManager$1.getTabProperties(tabId);
});
electron.ipcMain.handle("create-layout", async (event, name, layout) => {
  return PanelManager$1.createLayout(name, layout);
});
electron.ipcMain.handle("get-layouts", async () => {
  return PanelManager$1.getLayouts();
});
electron.ipcMain.handle("get-layout", async (event, id) => {
  return PanelManager$1.getLayout(id);
});
electron.ipcMain.handle("update-layout", async (event, id, layout) => {
  return PanelManager$1.updateLayout(id, layout);
});
electron.ipcMain.handle("delete-layout", async (event, id) => {
  return PanelManager$1.deleteLayout(id);
});
electron.ipcMain.handle("rename-layout", async (event, id, newName) => {
  return PanelManager$1.renameLayout(id, newName);
});
electron.ipcMain.handle("create-conversation", async (event, serviceId, title) => {
  return AIServiceManager$1.createConversation(serviceId, title);
});
electron.ipcMain.handle("get-conversation", async (event, id) => {
  return AIServiceManager$1.getConversation(id);
});
electron.ipcMain.handle("get-conversations", async (event, serviceId) => {
  return AIServiceManager$1.getConversations(serviceId);
});
electron.ipcMain.handle("add-message", async (event, conversationId, role, content) => {
  return AIServiceManager$1.addMessage(conversationId, role, content);
});
electron.ipcMain.handle("update-conversation-title", async (event, id, title) => {
  return AIServiceManager$1.updateConversationTitle(id, title);
});
electron.ipcMain.handle("delete-conversation", async (event, id) => {
  return AIServiceManager$1.deleteConversation(id);
});
electron.ipcMain.handle("add-project", async (event, rootPath, name) => {
  return ProjectManager$1.addProject(rootPath, name);
});
electron.ipcMain.handle("get-projects", async () => {
  return ProjectManager$1.getProjects();
});
electron.ipcMain.handle("get-project", async (event, id) => {
  return ProjectManager$1.getProject(id);
});
electron.ipcMain.handle("update-project-last-opened", async (event, id) => {
  return ProjectManager$1.updateProjectLastOpened(id);
});
electron.ipcMain.handle("delete-project", async (event, id) => {
  return ProjectManager$1.deleteProject(id);
});
electron.ipcMain.handle("rename-project", async (event, id, newName) => {
  return ProjectManager$1.renameProject(id, newName);
});
electron.ipcMain.handle("get-project-files", async (event, projectId, relativePath) => {
  return ProjectManager$1.getProjectFiles(projectId, relativePath);
});
electron.ipcMain.handle("read-file", async (event, projectId, filePath) => {
  return ProjectManager$1.readFile(projectId, filePath);
});
electron.ipcMain.handle("write-file", async (event, projectId, filePath, content) => {
  return ProjectManager$1.writeFile(projectId, filePath, content);
});
electron.ipcMain.handle("delete-file", async (event, projectId, filePath) => {
  return ProjectManager$1.deleteFile(projectId, filePath);
});
electron.ipcMain.handle("create-file", async (event, projectId, filePath) => {
  return ProjectManager$1.createFile(projectId, filePath);
});
electron.ipcMain.handle("create-directory", async (event, projectId, dirPath) => {
  return ProjectManager$1.createDirectory(projectId, dirPath);
});
electron.ipcMain.handle("set-git-project-path", async (event, projectPath) => {
  GitManager$1.setProjectPath(projectPath);
  return true;
});
electron.ipcMain.handle("get-git-status", async () => {
  return GitManager$1.getStatus();
});
electron.ipcMain.handle("get-git-commits", async (event, limit) => {
  return GitManager$1.getCommitHistory(limit);
});
electron.ipcMain.handle("git-commit", async (event, { message }) => {
  return GitManager$1.commit(message);
});
electron.ipcMain.handle("git-push", async () => {
  return GitManager$1.push();
});
electron.ipcMain.handle("git-pull", async () => {
  return GitManager$1.pull();
});
electron.ipcMain.handle("git-create-branch", async (event, { name }) => {
  return GitManager$1.createBranch(name);
});
electron.ipcMain.handle("git-switch-branch", async (event, { name }) => {
  return GitManager$1.switchBranch(name);
});
electron.ipcMain.handle("get-git-branches", async () => {
  return GitManager$1.getBranches();
});
electron.ipcMain.handle("git-get-diff", async (event, filePath) => {
  return GitManager$1.getDiff(filePath);
});
electron.ipcMain.handle("update-context", async (event, updates) => {
  return ContextEngine$1.updateContext(updates);
});
electron.ipcMain.handle("get-context", async () => {
  return ContextEngine$1.getContext();
});
electron.ipcMain.handle("get-context-summary", async () => {
  return ContextEngine$1.getContextSummary();
});
electron.ipcMain.handle("create-plan", async (event, goal, tasks) => {
  return PlanningEngine$1.createPlan(goal, tasks);
});
electron.ipcMain.handle("update-plan-task", async (event, taskId, status, result) => {
  return PlanningEngine$1.updateTaskStatus(taskId, status, result);
});
electron.ipcMain.handle("get-current-plan", async () => {
  return PlanningEngine$1.getCurrentPlan();
});
electron.ipcMain.handle("terminal-execute", async (event, { command }) => {
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
    child_process.exec(command, (error, stdout, stderr) => {
      resolve({
        output: stdout,
        error: error ? stderr || error.message : null
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
        source: "System"
      }
    ]
  };
});
electron.ipcMain.handle("get-system-stats", async () => {
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
    version: electron.app.getVersion(),
    branch: "master"
  };
});
