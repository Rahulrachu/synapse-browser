import * as electron from "electron";
import * as nodeCrypto from "crypto";
import { getMainWindow } from "../window";
import { storage } from "../services/Storage";
import { downloadManager } from "../services/DownloadManager";

class BrowserManager {
  tabs = new Map();
  tabViews = new Map();
  recentlyClosed = [];
  permissionDecisions = new Map();
  permissionHandlerSessions = new WeakSet();
  activeTabId = null;
  currentBrowserBounds = null;
  // The renderer owns whether the browser surface should be visible. Keep this
  // intent across active-tab changes so a newly created tab cannot flash a
  // native WebContentsView over Synapse Home or the ORION workspace.
  browserViewVisible = false;
  createTab(url = "about:blank", options = {}) {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2 || mainWindow2.isDestroyed()) {
      throw new Error("Main window not found");
    }
    const tabId = nodeCrypto.randomUUID();
    const profileId = options.profileId || "default";
    const isPrivate = Boolean(options.isPrivate);
    const partition = isPrivate ? `synapse-private-${tabId}` : `persist:synapse-profile-${profileId}`;
    const view = new electron.WebContentsView({
      webPreferences: {
        partition,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: true,
      },
    });
    const tab = {
      id: tabId,
      viewId: view.webContents.id,
      url: "about:blank",
      title: "New Tab",
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isMuted: false,
      isPlayingAudio: false,
      isCrashed: false,
      pinned: false,
      profileId,
      isPrivate,
    };
    this.tabs.set(tabId, tab);
    this.tabViews.set(tabId, view);
    downloadManager.registerSession(view.webContents.session, tabId);
    mainWindow2.contentView.addChildView(view);
    view.setVisible(false);
    this.applyBounds(view);
    this.setupSessionHandlers(view.webContents.session);
    this.setupWebContentsListeners(view, tabId);
    const shouldActivate = options.activate !== false || !this.activeTabId;
    if (shouldActivate) {
      this.activeTabId = tabId;
      this.updateActiveTabView();
    }
    const navigationTarget = this.resolveNavigationInput(url);
    if (navigationTarget) {
      tab.url = navigationTarget;
      tab.isLoading = true;
      view.webContents.loadURL(navigationTarget).catch((error) => {
        console.error(`[BrowserManager] Failed to load ${navigationTarget}:`, error);
        this.updateTab(tabId, { isLoading: false, isCrashed: false });
      });
    }
    this.persistOpenTabs();
    this.broadcastTabsUpdate();
    return tabId;
  }
  restoreTabs(savedTabs) {
    if (this.tabs.size > 0) return;
    const restorable = savedTabs.filter((tab) => !tab.isPrivate && tab.url);
    if (!restorable.length) {
      this.createTab("about:blank");
      return;
    }
    restorable.forEach((tab, index) => {
      this.createTab(tab.url, {
        profileId: tab.profileId || "default",
        activate: index === restorable.length - 1,
      });
    });
  }
  persistOpenTabs() {
    const tabs = this.getAllTabs()
      .filter((tab) => !tab.isPrivate)
      .map((tab) => ({ url: tab.url, profileId: tab.profileId }));
    storage
      .set("open-tabs", tabs)
      .catch((error) => console.error("[BrowserManager] Failed to persist open tabs:", error));
  }
  setupSessionHandlers(ses) {
    if (this.permissionHandlerSessions.has(ses)) return;
    this.permissionHandlerSessions.add(ses);
    ses.setPermissionRequestHandler((webContents, permission, callback) => {
      if (process.env.SYNAPSE_E2E === "1" || process.argv.includes("--e2e")) {
        callback(false);
        return;
      }
      const origin = webContents?.getURL() ? new URL(webContents.getURL()).origin : "unknown-origin";
      const key = `${origin}:${permission}`;
      const remembered = this.permissionDecisions.get(key);
      if (remembered !== void 0) {
        callback(remembered);
        return;
      }
      const mainWindow2 = getMainWindow();
      if (!mainWindow2 || mainWindow2.isDestroyed()) {
        callback(false);
        return;
      }
      const result = electron.dialog.showMessageBoxSync(mainWindow2, {
        type: "question",
        buttons: ["Allow", "Deny"],
        defaultId: 0,
        cancelId: 1,
        title: "Permission request",
        message: `${origin} is requesting access to ${permission}.`,
        detail: "Choose Allow or Deny for this request.",
      });
      const allowed = result === 0;
      this.permissionDecisions.set(key, allowed);
      callback(allowed);
    });
  }
  setupWebContentsListeners(view, tabId) {
    const wc = view.webContents;
    wc.on("context-menu", (_event, params) => {
      const template = [
        { label: "Back", enabled: this.canGoBack(wc), click: () => wc.goBack() },
        { label: "Forward", enabled: this.canGoForward(wc), click: () => wc.goForward() },
        { label: "Reload", click: () => wc.reload() },
        { type: "separator" },
        {
          label: "Open link in new tab",
          enabled: Boolean(params.linkURL),
          click: () =>
            params.linkURL &&
            this.createTab(params.linkURL, {
              profileId: this.tabs.get(tabId)?.profileId,
              isPrivate: this.tabs.get(tabId)?.isPrivate,
            }),
        },
        {
          label: "Copy link",
          enabled: Boolean(params.linkURL),
          click: () => params.linkURL && electron.clipboard.writeText(params.linkURL),
        },
        { label: "Copy", enabled: Boolean(params.selectionText), click: () => wc.copy() },
        {
          label: "Search selection",
          enabled: Boolean(params.selectionText),
          click: () =>
            this.navigateTo(`https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`),
        },
        { type: "separator" },
        { label: "Inspect element", click: () => wc.inspectElement(params.x, params.y) },
      ];
      electron.Menu.buildFromTemplate(template).popup({ window: getMainWindow() || void 0 });
    });
    wc.setWindowOpenHandler(({ url }) => {
      if (url)
        this.createTab(url, {
          profileId: this.tabs.get(tabId)?.profileId,
          isPrivate: this.tabs.get(tabId)?.isPrivate,
        });
      return { action: "deny" };
    });
    wc.on("page-title-updated", (event, title) => {
      event.preventDefault();
      this.updateTab(tabId, { title: title || "New Tab" });
    });
    wc.on("page-favicon-updated", (_event, favicons) => {
      this.updateTab(tabId, { favicon: favicons[0] });
    });
    wc.on("did-start-loading", () => {
      this.updateTab(tabId, { isLoading: true, isCrashed: false });
    });
    wc.on("did-stop-loading", () => {
      this.updateTab(tabId, {
        isLoading: false,
        canGoBack: this.canGoBack(wc),
        canGoForward: this.canGoForward(wc),
      });
    });
    wc.on("did-navigate", (_event, url) => {
      this.updateTab(tabId, {
        url,
        canGoBack: this.canGoBack(wc),
        canGoForward: this.canGoForward(wc),
      });
    });
    wc.on("did-navigate-in-page", (_event, url) => {
      this.updateTab(tabId, { url });
    });
    wc.on("did-finish-load", () => {
      const currentUrl = wc.getURL() || this.tabs.get(tabId)?.url || "about:blank";
      const currentTitle =
        currentUrl === "about:blank" ? "New Tab" : wc.getTitle() || this.tabs.get(tabId)?.title || "New Tab";
      const tab = this.tabs.get(tabId);
      this.updateTab(tabId, {
        url: currentUrl,
        title: currentTitle,
        isLoading: false,
        canGoBack: this.canGoBack(wc),
        canGoForward: this.canGoForward(wc),
      });
      if (tab && !tab.isPrivate && /^https?:/i.test(currentUrl)) {
        storage.addToHistory(currentUrl, currentTitle, tab.profileId, tab.favicon);
      }
    });
    wc.on("media-started-playing", () => {
      this.updateTab(tabId, { isPlayingAudio: true });
    });
    wc.on("media-paused", () => {
      this.updateTab(tabId, { isPlayingAudio: false });
    });
    wc.on("before-input-event", (event, input) => {
      if (input.type !== "keyDown" || !(input.control || input.meta)) return;
      const key = String(input.key || "").toLowerCase();
      let shortcut = null;
      if (input.shift && key === "a") shortcut = "toggle-ai-panel";
      else if (!input.shift && key === "k") shortcut = "command-palette";
      if (!shortcut) return;
      event.preventDefault();
      const mainWindow2 = getMainWindow();
      if (mainWindow2 && !mainWindow2.isDestroyed()) mainWindow2.webContents.send("shortcut", shortcut);
    });
    wc.on("render-process-gone", (_event, details) => {
      this.updateTab(tabId, { isLoading: false, isCrashed: true });
      this.recoverCrashedTab(tabId, details?.reason);
    });
    wc.on("unresponsive", () => {
      console.warn(`[BrowserManager] Tab ${tabId} became unresponsive`);
    });
    wc.on("destroyed", () => {
      if (this.tabs.has(tabId)) this.removeTabState(tabId, false);
    });
  }
  // Reload a tab whose renderer crashed, at most 3 times per minute, so one bad
  // page can't take the whole browser down or loop forever.
  recoverCrashedTab(tabId, reason) {
    if (reason === "clean-exit") return;
    const now = Date.now();
    this.crashHistory = this.crashHistory || new Map();
    const recent = (this.crashHistory.get(tabId) || []).filter((time) => now - time < 6e4);
    recent.push(now);
    this.crashHistory.set(tabId, recent);
    if (recent.length > 3) {
      console.error(`[BrowserManager] Tab ${tabId} keeps crashing (${reason}); not reloading again`);
      return;
    }
    setTimeout(() => {
      const view = this.tabViews.get(tabId);
      if (!view || view.webContents.isDestroyed()) return;
      console.warn(`[BrowserManager] Reloading crashed tab ${tabId} (${reason})`);
      view.webContents.reload();
    }, 750);
  }
  canGoBack(wc) {
    return typeof wc.navigationHistory?.canGoBack === "function"
      ? wc.navigationHistory.canGoBack()
      : wc.canGoBack();
  }
  canGoForward(wc) {
    return typeof wc.navigationHistory?.canGoForward === "function"
      ? wc.navigationHistory.canGoForward()
      : wc.canGoForward();
  }
  updateTab(tabId, patch) {
    const current = this.tabs.get(tabId);
    if (!current) return;
    Object.assign(current, patch);
    this.broadcastTabUpdate(tabId);
  }
  removeTabState(tabId, remember) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    if (remember && tab.url !== "about:blank") {
      this.recentlyClosed.unshift({
        url: tab.url,
        title: tab.title,
        favicon: tab.favicon,
        profileId: tab.profileId,
        isPrivate: tab.isPrivate,
        closedAt: Date.now(),
      });
      this.recentlyClosed.splice(20);
    }
    this.tabs.delete(tabId);
    this.tabViews.delete(tabId);
  }
  closeTab(tabId) {
    const view = this.tabViews.get(tabId);
    const mainWindow2 = getMainWindow();
    const wasActive = this.activeTabId === tabId;
    this.removeTabState(tabId, true);
    if (view && mainWindow2 && !mainWindow2.isDestroyed()) {
      mainWindow2.contentView.removeChildView(view);
      if (!view.webContents.isDestroyed()) view.webContents.close();
    }
    if (wasActive) {
      const remainingTabs = Array.from(this.tabs.keys());
      this.activeTabId = remainingTabs.length ? remainingTabs[Math.max(0, remainingTabs.length - 1)] : null;
    }
    if (!this.activeTabId && mainWindow2 && !mainWindow2.isDestroyed()) {
      this.createTab("about:blank");
    } else {
      this.updateActiveTabView();
      this.persistOpenTabs();
      this.broadcastTabsUpdate();
    }
  }
  reopenClosedTab() {
    const closed = this.recentlyClosed.shift();
    if (!closed) return null;
    const tabId = this.createTab(closed.url, {
      profileId: closed.profileId,
      isPrivate: closed.isPrivate,
    });
    return tabId;
  }
  getRecentlyClosed() {
    return [...this.recentlyClosed];
  }
  setActiveTab(tabId) {
    if (!this.tabs.has(tabId)) return;
    this.activeTabId = tabId;
    this.updateActiveTabView();
    this.broadcastTabsUpdate();
  }
  updateActiveTabView() {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2 || mainWindow2.isDestroyed()) return;
    for (const [tabId, view] of this.tabViews) {
      const active = tabId === this.activeTabId;
      view.setVisible(active && this.browserViewVisible);
      if (active) this.applyBounds(view);
    }
  }
  applyBounds(view) {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2 || mainWindow2.isDestroyed()) return;
    const content = mainWindow2.getContentBounds();
    view.setBounds(
      this.clampBrowserBounds(
        this.currentBrowserBounds || {
          x: 72,
          y: 96,
          width: content.width - 72,
          height: content.height - 96 - 32,
        },
        content,
      ),
    );
  }
  clampBrowserBounds(bounds, content) {
    const x = Math.max(72, Math.round(Number.isFinite(bounds.x) ? bounds.x : 72));
    const y = Math.max(96, Math.round(Number.isFinite(bounds.y) ? bounds.y : 96));
    const maxWidth = Math.max(320, content.width - x);
    const maxHeight = Math.max(240, content.height - y - 32);
    return {
      x,
      y,
      width: Math.min(maxWidth, Math.max(320, Math.round(bounds.width))),
      height: Math.min(maxHeight, Math.max(240, Math.round(bounds.height))),
    };
  }
  navigateTo(urlOrSearch, tabId = this.activeTabId) {
    if (!tabId) return false;
    const view = this.tabViews.get(tabId);
    if (!view || view.webContents.isDestroyed()) return false;
    const target = this.resolveNavigationInput(urlOrSearch);
    if (!target) return false;
    this.updateTab(tabId, { url: target, isLoading: true, isCrashed: false });
    view.webContents.loadURL(target).catch((error) => {
      console.error(`[BrowserManager] Navigation failed for ${target}:`, error);
      this.updateTab(tabId, { isLoading: false });
    });
    return true;
  }
  resolveNavigationInput(input) {
    const candidate = String(input || "").trim();
    if (!candidate) return "about:blank";
    if (/^about:/i.test(candidate)) return candidate;
    try {
      const parsed = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
    } catch {}
    return `https://www.google.com/search?q=${encodeURIComponent(candidate)}`;
  }
  goBack(tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (!view || view.webContents.isDestroyed() || !this.canGoBack(view.webContents)) return false;
    view.webContents.goBack();
    return true;
  }
  goForward(tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (!view || view.webContents.isDestroyed() || !this.canGoForward(view.webContents)) return false;
    view.webContents.goForward();
    return true;
  }
  reload(hard = false, tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (!view || view.webContents.isDestroyed()) return false;
    if (hard) view.webContents.reloadIgnoringCache();
    else view.webContents.reload();
    return true;
  }
  stopLoading(tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (!view || view.webContents.isDestroyed()) return false;
    view.webContents.stop();
    return true;
  }
  findInPage(text, options = {}, tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (!view || view.webContents.isDestroyed() || !text.trim()) return 0;
    return view.webContents.findInPage(text, {
      forward: options.forward !== false,
      matchCase: Boolean(options.matchCase),
    });
  }
  stopFindInPage(action = "clearSelection", tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (view && !view.webContents.isDestroyed()) view.webContents.stopFindInPage(action);
  }
  setZoom(delta, tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (!view || view.webContents.isDestroyed()) return null;
    const next = Math.min(5, Math.max(0.25, view.webContents.getZoomFactor() + delta));
    view.webContents.setZoomFactor(next);
    return next;
  }
  resetZoom(tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (!view || view.webContents.isDestroyed()) return false;
    view.webContents.setZoomFactor(1);
    return true;
  }
  print(tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    if (!view || view.webContents.isDestroyed()) return Promise.resolve(false);
    return new Promise((resolve) => view.webContents.print({}, (success) => resolve(success)));
  }
  async savePdf(tabId = this.activeTabId) {
    const view = tabId ? this.tabViews.get(tabId) : void 0;
    const mainWindow2 = getMainWindow();
    if (!view || view.webContents.isDestroyed() || !mainWindow2 || mainWindow2.isDestroyed()) return null;
    const result = await electron.dialog.showSaveDialog(mainWindow2, {
      title: "Save page as PDF",
      defaultPath: `${(view.webContents.getTitle() || "page").replace(/[^a-z0-9-_]+/gi, "-").slice(0, 80)}.pdf`,
      filters: [{ name: "PDF document", extensions: ["pdf"] }],
    });
    if (result.canceled || !result.filePath) return null;
    const data = await view.webContents.printToPDF({ printBackground: true });
    await import("node:fs/promises").then(({ writeFile }) => writeFile(result.filePath, data));
    return result.filePath;
  }
  toggleMute(tabId = this.activeTabId) {
    if (!tabId) return false;
    const view = this.tabViews.get(tabId);
    const tab = this.tabs.get(tabId);
    if (!view || !tab || view.webContents.isDestroyed()) return false;
    const muted = !view.webContents.isAudioMuted();
    view.webContents.setAudioMuted(muted);
    this.updateTab(tabId, { isMuted: muted });
    return muted;
  }
  moveTab(tabId, targetIndex) {
    const ids = Array.from(this.tabs.keys());
    const currentIndex = ids.indexOf(tabId);
    if (currentIndex < 0) return false;
    ids.splice(currentIndex, 1);
    const boundedIndex = Math.max(0, Math.min(targetIndex, ids.length));
    ids.splice(boundedIndex, 0, tabId);
    const reordered = new Map();
    for (const id of ids) reordered.set(id, this.tabs.get(id));
    this.tabs.clear();
    for (const [id, tab] of reordered) this.tabs.set(id, tab);
    this.persistOpenTabs();
    this.broadcastTabsUpdate();
    return true;
  }
  setPinned(tabId, pinned) {
    if (!this.tabs.has(tabId)) return false;
    this.updateTab(tabId, { pinned });
    return true;
  }
  getTab(tabId) {
    const tab = this.tabs.get(tabId);
    return tab ? { ...tab } : void 0;
  }
  getWebContents(tabId) {
    return this.tabViews.get(tabId);
  }
  async captureScreenshot(tabId = this.activeTabId) {
    const id = tabId || void 0;
    const view = id ? this.tabViews.get(id) : void 0;
    if (!id || !view || view.webContents.isDestroyed()) return null;
    const state = await view.webContents.executeJavaScript(
      "({ width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio || 1, scrollX: window.scrollX, scrollY: window.scrollY })",
      true,
    );
    const image = await view.webContents.capturePage();
    const size = image.getSize();
    return {
      tabId: id,
      url: view.webContents.getURL() || "",
      timestamp: Date.now(),
      viewportWidth: Number(state?.width) || size.width,
      viewportHeight: Number(state?.height) || size.height,
      devicePixelRatio: Number(state?.dpr) || 1,
      scrollX: Number(state?.scrollX) || 0,
      scrollY: Number(state?.scrollY) || 0,
      width: size.width,
      height: size.height,
      data: image.toPNG().toString("base64"),
    };
  }
  async clickAt(x, y, tabId = this.activeTabId) {
    const id = tabId || void 0;
    const view = id ? this.tabViews.get(id) : void 0;
    if (!view || view.webContents.isDestroyed() || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    const bounds = await view.webContents
      .executeJavaScript("({ width: window.innerWidth, height: window.innerHeight })", true)
      .catch(() => null);
    if (!bounds || x < 0 || y < 0 || x > bounds.width || y > bounds.height) return false;
    const hit = await view.webContents.executeJavaScript(
      `(() => { const el = document.elementFromPoint(${x}, ${y}); if (!el) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; })()`,
      true,
    );
    if (!hit) return false;
    view.webContents.sendInputEvent({ type: "mouseMove", x, y });
    view.webContents.sendInputEvent({ type: "mouseDown", x, y, button: "left", clickCount: 1 });
    view.webContents.sendInputEvent({ type: "mouseUp", x, y, button: "left", clickCount: 1 });
    return true;
  }
  getAllTabs() {
    return Array.from(this.tabs.values()).map((tab) => ({ ...tab }));
  }
  getActiveTab() {
    return this.activeTabId ? this.getTab(this.activeTabId) || null : null;
  }
  getCurrentUrl() {
    return this.getActiveTab()?.url || "";
  }
  getCurrentTitle() {
    return this.getActiveTab()?.title || "";
  }
  setBrowserAreaBounds(bounds) {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2 || mainWindow2.isDestroyed()) return;
    const content = mainWindow2.getContentBounds();
    const normalized =
      bounds.height <= 240 && content.height > 400
        ? { ...bounds, height: content.height - Math.max(96, bounds.y || 96) - 32 }
        : bounds;
    const clamped = this.clampBrowserBounds(normalized, content);
    this.currentBrowserBounds = clamped;
    const activeView = this.activeTabId ? this.tabViews.get(this.activeTabId) : void 0;
    if (activeView) activeView.setBounds(clamped);
  }
  setBrowserViewVisibility(visible) {
    this.browserViewVisible = visible;
    const activeView = this.activeTabId ? this.tabViews.get(this.activeTabId) : void 0;
    if (activeView) activeView.setVisible(visible);
  }
  duplicateTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;
    return this.createTab(tab.url, { profileId: tab.profileId, isPrivate: tab.isPrivate });
  }
  getAllTabsPayload() {
    return { tabs: this.getAllTabs(), activeTabId: this.activeTabId };
  }
  broadcastTabUpdate(tabId) {
    const mainWindow2 = getMainWindow();
    if (!mainWindow2 || mainWindow2.isDestroyed()) return;
    const tab = this.getTab(tabId);
    if (tab) mainWindow2.webContents.send("tab-updated", tab);
    this.broadcastTabsUpdate();
  }
  broadcastTabsUpdate() {
    const mainWindow2 = getMainWindow();
    if (mainWindow2 && !mainWindow2.isDestroyed()) {
      mainWindow2.webContents.send("tabs-updated", this.getAllTabsPayload());
    }
  }
}
export const browserManager = new BrowserManager();
