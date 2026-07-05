import { BrowserWindow, webContents, WebContents } from 'electron';
import { getMainWindow } from './BrowserWindow';

interface TabInfo {
  id: string;
  webContentsId: number;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
}

class BrowserManager {
  private tabs: Map<string, TabInfo> = new Map();
  private activeTabId: string | null = null;
  private webContentsMap: Map<number, string> = new Map(); // webContentsId -> tabId

  createTab(url: string = 'about:blank'): string {
    const mainWindow = getMainWindow();
    if (!mainWindow) throw new Error('Main window not found');

    const tabId = Date.now().toString();
    const newWebContents = webContents.create({
      sandbox: true,
      preload: require.resolve('./preload.js'),
    });

    const tabInfo: TabInfo = {
      id: tabId,
      webContentsId: newWebContents.id,
      url,
      title: 'New Tab',
      isLoading: false,
    };

    this.tabs.set(tabId, tabInfo);
    this.webContentsMap.set(newWebContents.id, tabId);
    this.activeTabId = tabId;

    // Setup event listeners
    this.setupWebContentsListeners(newWebContents, tabId);

    // Navigate to URL
    if (url !== 'about:blank') {
      newWebContents.loadURL(url).catch((err) => {
        console.error('Failed to load URL:', err);
        newWebContents.loadURL('about:blank');
      });
    } else {
      newWebContents.loadURL('about:blank');
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
    if (mainWindow) {
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
      const wc = webContents.fromId(tab.webContentsId);
      if (wc && !wc.isDestroyed()) {
        wc.destroy();
      }
      this.tabs.delete(tabId);
      this.webContentsMap.delete(tab.webContentsId);

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

    const wc = webContents.fromId(tab.webContentsId);
    if (!wc || wc.isDestroyed()) return false;

    // Ensure URL has protocol
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
      finalUrl = 'https://' + url;
    }

    wc.loadURL(finalUrl).catch((err) => {
      console.error('Failed to load URL:', err);
    });

    return true;
  }

  goBack(): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const wc = webContents.fromId(tab.webContentsId);
    if (!wc || wc.isDestroyed()) return false;

    if (wc.canGoBack()) {
      wc.goBack();
      return true;
    }

    return false;
  }

  goForward(): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const wc = webContents.fromId(tab.webContentsId);
    if (!wc || wc.isDestroyed()) return false;

    if (wc.canGoForward()) {
      wc.goForward();
      return true;
    }

    return false;
  }

  reload(): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const wc = webContents.fromId(tab.webContentsId);
    if (!wc || wc.isDestroyed()) return false;

    wc.reload();
    return true;
  }

  stopLoading(): boolean {
    if (!this.activeTabId) return false;

    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return false;

    const wc = webContents.fromId(tab.webContentsId);
    if (!wc || wc.isDestroyed()) return false;

    wc.stop();
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
    if (mainWindow) {
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
    const tab = this.tabs.get(tabId);
    if (!tab) return null;

    const wc = webContents.fromId(tab.webContentsId);
    return wc && !wc.isDestroyed() ? wc : null;
  }
}

export default new BrowserManager();
