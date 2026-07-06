import { BrowserWindow, webContents, WebContents } from 'electron';
import { getMainWindow } from './BrowserWindow';
import { setupContextMenu } from './ContextMenu';

interface TabInfo {
  id: string;
  windowId: number;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
}

class BrowserManager {
  private tabs: Map<string, TabInfo> = new Map();
  private activeTabId: string | null = null;
  private tabWindows: Map<string, BrowserWindow> = new Map(); // tabId -> BrowserWindow

  createTab(url: string = 'about:blank'): string {
    const mainWindow = getMainWindow();
    if (!mainWindow) throw new Error('Main window not found');

    const tabId = Date.now().toString();

    // Create a new BrowserWindow for this tab (hidden, will be embedded)
    const tabWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        preload: require.resolve('./preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    const tabInfo: TabInfo = {
      id: tabId,
      windowId: tabWindow.id,
      url,
      title: 'New Tab',
      isLoading: false,
    };

    this.tabs.set(tabId, tabInfo);
    this.tabWindows.set(tabId, tabWindow);
    this.activeTabId = tabId;

    // Setup event listeners
    this.setupWebContentsListeners(tabWindow.webContents, tabId);
    setupContextMenu(tabWindow.webContents);

    // Navigate to URL
    if (url !== 'about:blank') {
      tabWindow.webContents.loadURL(url).catch((err: Error) => {
        console.error('Failed to load URL:', err);
        tabWindow.webContents.loadURL('about:blank').catch(console.error);
      });
    } else {
      tabWindow.webContents.loadURL('about:blank').catch(console.error);
    }

    return tabId;
  }

  private setupWebContentsListeners(wc: WebContents, tabId: string) {
    wc.on('page-title-updated', (event, title) => {
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

    wc.on('did-navigate', (event, url) => {
      const tab = this.tabs.get(tabId);
      if (tab) {
        tab.url = url;
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

  getAllTabs(): TabInfo[] {
    return Array.from(this.tabs.values());
  }

  closeTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      const tabWindow = this.tabWindows.get(tabId);
      if (tabWindow && !tabWindow.isDestroyed()) {
        tabWindow.close();
      }
      this.tabs.delete(tabId);
      this.tabWindows.delete(tabId);

      if (this.activeTabId === tabId) {
        const remainingTabs = Array.from(this.tabs.keys());
        this.activeTabId = remainingTabs[0] || null;
      }

      this.broadcastTabsUpdate();
    }
  }

  setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId)) {
      this.activeTabId = tabId;
      this.broadcastTabsUpdate();
    }
  }

  getActiveTab(): TabInfo | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }

  navigateTo(url: string): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const tabWindow = this.tabWindows.get(this.activeTabId);
    if (!tabWindow || tabWindow.isDestroyed()) return false;

    // Ensure URL has protocol
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
      finalUrl = 'https://' + url;
    }

    tabWindow.webContents.loadURL(finalUrl).catch((err: Error) => {
      console.error('Failed to load URL:', err);
    });

    return true;
  }

  goBack(): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const tabWindow = this.tabWindows.get(this.activeTabId);
    if (!tabWindow || tabWindow.isDestroyed()) return false;

    if (tabWindow.webContents.canGoBack()) {
      tabWindow.webContents.goBack();
      return true;
    }

    return false;
  }

  goForward(): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const tabWindow = this.tabWindows.get(this.activeTabId);
    if (!tabWindow || tabWindow.isDestroyed()) return false;

    if (tabWindow.webContents.canGoForward()) {
      tabWindow.webContents.goForward();
      return true;
    }

    return false;
  }

  reload(): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const tabWindow = this.tabWindows.get(this.activeTabId);
    if (!tabWindow || tabWindow.isDestroyed()) return false;

    tabWindow.webContents.reload();
    return true;
  }

  stopLoading(): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const tabWindow = this.tabWindows.get(this.activeTabId);
    if (!tabWindow || tabWindow.isDestroyed()) return false;

    tabWindow.webContents.stop();
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

  private broadcastTabsUpdate() {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('tabs-updated', {
        tabs: this.getAllTabs(),
        activeTabId: this.activeTabId,
      });
    }
  }

  duplicateTab(tabId: string): string | null {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;

    return this.createTab(tab.url);
  }

  getWebContents(tabId: string): WebContents | null {
    const tabWindow = this.tabWindows.get(tabId);
    if (!tabWindow || tabWindow.isDestroyed()) return null;

    return tabWindow.webContents;
  }
}

export default new BrowserManager();
