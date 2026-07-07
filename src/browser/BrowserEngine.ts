import { BrowserWindow, webContents } from 'electron';
import { TabData } from '@/common/utils';

export class BrowserEngine {
  private tabs: Map<string, TabData> = new Map();
  private activeTabId: string | null = null;

  addTab(tab: TabData): void {
    this.tabs.set(tab.id, tab);
    this.activeTabId = tab.id;
  }

  closeTab(tabId: string): void {
    this.tabs.delete(tabId);
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs.keys().next().value || null;
    }
  }

  getTab(tabId: string): TabData | undefined {
    return this.tabs.get(tabId);
  }

  getAllTabs(): TabData[] {
    return Array.from(this.tabs.values());
  }

  setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId)) {
      this.activeTabId = tabId;
    }
  }

  getActiveTab(): TabData | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }

  updateTab(tabId: string, updates: Partial<TabData>): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      this.tabs.set(tabId, { ...tab, ...updates });
    }
  }

  navigateTo(tabId: string, url: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      this.updateTab(tabId, { url, title: url });
      const contents = this.getWebContents(tabId);
      if (contents) {
        contents.loadURL(url);
      }
    }
  }

  goBack(tabId: string): void {
    const contents = this.getWebContents(tabId);
    if (contents && contents.canGoBack()) {
      contents.goBack();
    }
  }

  goForward(tabId: string): void {
    const contents = this.getWebContents(tabId);
    if (contents && contents.canGoForward()) {
      contents.goForward();
    }
  }

  reload(tabId: string): void {
    const contents = this.getWebContents(tabId);
    if (contents) {
      contents.reload();
    }
  }

  private getWebContents(tabId: string): webContents | null {
    // In an Electron app, we'd typically map tab IDs to webview guest IDs or window IDs
    // For now, we'll try to find the focused window's webContents as a fallback
    // In a production app, this would be more robustly linked to the UI components
    const window = BrowserWindow.getFocusedWindow();
    return window ? window.webContents : null;
  }
}

export default new BrowserEngine();
