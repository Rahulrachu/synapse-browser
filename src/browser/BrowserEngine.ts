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
    }
  }

  goBack(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      // In a real implementation, this would interact with the webview
      console.log(`Going back in tab ${tabId}`);
    }
  }

  goForward(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      // In a real implementation, this would interact with the webview
      console.log(`Going forward in tab ${tabId}`);
    }
  }

  reload(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (tab) {
      // In a real implementation, this would interact with the webview
      console.log(`Reloading tab ${tabId}`);
    }
  }
}

export default new BrowserEngine();
