import { WebContentsView, ipcMain, app } from 'electron';
import { getMainWindow } from './BrowserWindow.js';
import { setupContextMenu } from './ContextMenu.js';

interface TabInfo {
  id: string;
  viewId?: number;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

/**
 * Manages browser tabs, their WebContents views, and navigation state.
 * Acts as the central controller for the multi-tab browser interface.
 */
class BrowserManager {
  private tabs: Map<string, TabInfo> = new Map();
  private activeTabId: string | null = null;
  private tabViews: Map<string, WebContentsView> = new Map(); // tabId -> WebContentsView
  private currentBrowserBounds: { x: number; y: number; width: number; height: number } | null = null;

  /**
   * Creates a new browser tab and its associated WebContentsView.
   * @param url The initial URL to load. Defaults to 'about:blank'.
   * @returns The unique ID of the newly created tab.
   */
  createTab(url: string = 'about:blank'): string {
    const mainWindow = getMainWindow();
    if (!mainWindow) throw new Error('Main window not found');

    const tabId = Date.now().toString();

    // Create a new WebContentsView for this tab
    const view = new WebContentsView({
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const tabInfo: TabInfo = {
      id: tabId,
      viewId: view.webContents.id,
      url,
      title: 'New Tab',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
    };

    this.tabs.set(tabId, tabInfo);
    this.tabViews.set(tabId, view);
    this.activeTabId = tabId;

    // Setup event listeners
    this.setupWebContentsListeners(view.webContents, tabId);
    setupContextMenu(view.webContents);

    // Navigate to URL
    if (url !== 'about:blank') {
      view.webContents.loadURL(url).catch((err: Error) => {
        console.error('Failed to load URL:', err);
        view.webContents.loadURL('about:blank').catch(console.error);
      });
    } else {
      view.webContents.loadURL('about:blank').catch(console.error);
    }

    // Attach view to main window if bounds are set
    if (this.currentBrowserBounds) {
      mainWindow.contentView.addChildView(view);
      view.setBounds(this.currentBrowserBounds);
    }

    this.broadcastTabsUpdate();
    return tabId;
  }

  /**
   * Sets up event listeners for a tab's WebContents to track navigation, loading, and title changes.
   * @param wc The WebContents instance.
   * @param tabId The ID of the tab.
   */
  private setupWebContentsListeners(wc: any, tabId: string) {
    wc.on('page-title-updated', (event: any, title: string) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.title = title;
        this.broadcastTabUpdate(tabId);
      }
    });

    wc.on('did-start-loading', () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.isLoading = true;
        this.broadcastTabUpdate(tabId);
      }
    });

    wc.on('did-stop-loading', () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.isLoading = false;
        this.broadcastTabUpdate(tabId);
      }
    });

    wc.on('did-navigate', (event: any, url: string) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        this.broadcastTabUpdate(tabId);
      }
    });

    wc.on('did-navigate-in-page', (event: any, url: string) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
        this.broadcastTabUpdate(tabId);
      }
    });

    // Track navigation history state
    wc.on('did-start-navigation', () => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.canGoBack = wc.canGoBack();
        tab.canGoForward = wc.canGoForward();
        this.broadcastTabUpdate(tabId);
      }
    });

    wc.on('did-stop-loading', () => {
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
  private broadcastTabUpdate(tabId: string) {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      const tab = this.tabs.get(tabId);
      mainWindow.webContents.send('tab-updated', tab);
    }
  }

  /**
   * Retrieves information about a specific tab.
   * @param tabId The ID of the tab.
   * @returns The tab information or undefined if not found.
   */
  getTab(tabId: string): TabInfo | undefined {
    return this.tabs.get(tabId);
  }

  /**
   * Retrieves the WebContentsView associated with a specific tab.
   * @param tabId The ID of the tab.
   * @returns The WebContentsView or undefined if not found.
   */
  getWebContents(tabId: string): WebContentsView | undefined {
    return this.tabViews.get(tabId);
  }

  /**
   * Retrieves information about all currently open tabs.
   * @returns An array of all tab information objects.
   */
  getAllTabs(): TabInfo[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Closes a specific tab and destroys its associated WebContentsView.
   * @param tabId The ID of the tab to close.
   */
  closeTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      const view = this.tabViews.get(tabId);
      if (view) {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.contentView.removeChildView(view);
        }
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
  setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId)) {
      this.activeTabId = tabId;
      this.updateActiveTabView();
      this.broadcastTabsUpdate();
    }
  }

  /**
   * Updates the visibility and bounds of the WebContentsViews based on the currently active tab.
   */
  private updateActiveTabView(): void {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;

    // Hide all views except active
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
  getActiveTab(): TabInfo | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }

  /**
   * Navigates the active tab to a specified URL.
   * @param url The URL to navigate to.
   * @returns True if navigation started successfully, false otherwise.
   */
  navigateTo(url: string): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const view = this.tabViews.get(this.activeTabId);
    if (!view) return false;

    // Ensure URL has protocol
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
      finalUrl = 'https://' + url;
    }

    view.webContents.loadURL(finalUrl).catch((err: Error) => {
      console.error('Failed to load URL:', err);
    });

    return true;
  }

  /**
   * Navigates the active tab back in its history.
   * @returns True if navigation started successfully, false otherwise.
   */
  goBack(): boolean {
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
  goForward(): boolean {
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
  reload(): boolean {
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
  stopLoading(): boolean {
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
  getCurrentUrl(): string {
    if (!this.activeTabId) return '';

    const tab = this.tabs.get(this.activeTabId);
    return tab?.url || '';
  }

  /**
   * Retrieves the title of the currently active tab.
   * @returns The current title or an empty string if no tab is active.
   */
  getCurrentTitle(): string {
    if (!this.activeTabId) return '';

    const tab = this.tabs.get(this.activeTabId);
    return tab?.title || '';
  }

  /**
   * Sets the bounds for the browser area. Called by the renderer process when the window resizes.
   * @param bounds The new bounds for the browser area.
   */
  setBrowserAreaBounds(bounds: { x: number; y: number; width: number; height: number }): void {
    this.currentBrowserBounds = bounds;

    // Update active view bounds
    if (this.activeTabId) {
      const view = this.tabViews.get(this.activeTabId);
      if (view) {
        view.setBounds(bounds);
      }
    }
  }

  /**
   * Duplicates an existing tab by creating a new tab with the same URL.
   * @param tabId The ID of the tab to duplicate.
   * @returns The ID of the newly created tab, or null if the original tab was not found.
   */
  duplicateTab(tabId: string): string | null {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;

    return this.createTab(tab.url);
  }

  /**
   * Broadcasts the full list of tabs and the active tab ID to the renderer process.
   */
  private broadcastTabsUpdate() {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('tabs-updated', {
        tabs: this.getAllTabs(),
        activeTabId: this.activeTabId,
      });
    }
  }
}

export default new BrowserManager();
