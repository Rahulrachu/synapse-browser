import { WebContentsView, ipcMain, app } from 'electron';
import { getMainWindow } from './BrowserWindow';
import { setupContextMenu } from './ContextMenu';

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

class BrowserManager {
  private tabs: Map<string, TabInfo> = new Map();
  private activeTabId: string | null = null;
  private tabViews: Map<string, WebContentsView> = new Map(); // tabId -> WebContentsView
  private currentBrowserBounds: { x: number; y: number; width: number; height: number } | null = null;

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

  private broadcastTabUpdate(tabId: string) {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      const tab = this.tabs.get(tabId);
      mainWindow.webContents.send('tab-updated', tab);
    }
  }

  getTab(tabId: string): TabInfo | undefined {
    return this.tabs.get(tabId);
  }

  getWebContents(tabId: string): WebContentsView | undefined {
    return this.tabViews.get(tabId);
  }

  getAllTabs(): TabInfo[] {
    return Array.from(this.tabs.values());
  }

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

  setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId)) {
      this.activeTabId = tabId;
      this.updateActiveTabView();
      this.broadcastTabsUpdate();
    }
  }

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

  getActiveTab(): TabInfo | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }

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

  reload(): boolean {
    if (!this.activeTabId) return false;

    const view = this.tabViews.get(this.activeTabId);
    if (!view) return false;

    view.webContents.reload();
    return true;
  }

  stopLoading(): boolean {
    if (!this.activeTabId) return false;

    const view = this.tabViews.get(this.activeTabId);
    if (!view) return false;

    view.webContents.stop();
    return true;
  }

  getCurrentUrl(): string {
    if (!this.activeTabId) return '';

    const tab = this.tabs.get(this.activeTabId);
    return tab?.url || '';
  }

  getCurrentTitle(): string {
    if (!this.activeTabId) return '';

    const tab = this.tabs.get(this.activeTabId);
    return tab?.title || '';
  }

  // Called by React when browser area size changes
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

  duplicateTab(tabId: string): string | null {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;

    return this.createTab(tab.url);
  }

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
