import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { app, BrowserWindow } from 'electron';
import BrowserManager from '../../src/main/BrowserManager';

describe('BrowserManager Integration Tests', () => {
  let mainWindow: BrowserWindow | null = null;

  beforeEach(async () => {
    // Initialize Electron app if not already done
    if (!app.isReady()) {
      await app.whenReady();
    }

    // Create a main window for testing
    mainWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
  });

  afterEach(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
    mainWindow = null;
  });

  describe('Tab Lifecycle', () => {
    it('should create a tab with default URL', () => {
      const tabId = BrowserManager.createTab('about:blank');
      expect(tabId).toBeDefined();
      expect(typeof tabId).toBe('string');

      const tab = BrowserManager.getTab(tabId);
      expect(tab).toBeDefined();
      expect(tab?.url).toBe('about:blank');
      expect(tab?.isLoading).toBe(false);
    });

    it('should create a tab with custom URL', () => {
      const tabId = BrowserManager.createTab('https://example.com');
      expect(tabId).toBeDefined();

      const tab = BrowserManager.getTab(tabId);
      expect(tab?.url).toContain('example.com');
    });

    it('should add protocol to URL if missing', () => {
      const tabId = BrowserManager.createTab('google.com');
      const tab = BrowserManager.getTab(tabId);
      expect(tab?.url).toBe('https://google.com');
    });

    it('should close a tab', () => {
      const tabId = BrowserManager.createTab('about:blank');
      expect(BrowserManager.getTab(tabId)).toBeDefined();

      BrowserManager.closeTab(tabId);
      expect(BrowserManager.getTab(tabId)).toBeUndefined();
    });

    it('should not leak resources when closing tabs', () => {
      const initialCount = BrowserManager.getAllTabs().length;

      const tabIds = Array.from({ length: 10 }, () =>
        BrowserManager.createTab('about:blank')
      );

      expect(BrowserManager.getAllTabs().length).toBe(initialCount + 10);

      tabIds.forEach(id => BrowserManager.closeTab(id));

      expect(BrowserManager.getAllTabs().length).toBe(initialCount);
    });
  });

  describe('Tab Management', () => {
    it('should get all tabs', () => {
      const initialCount = BrowserManager.getAllTabs().length;
      BrowserManager.createTab('about:blank');
      BrowserManager.createTab('about:blank');

      const allTabs = BrowserManager.getAllTabs();
      expect(allTabs.length).toBe(initialCount + 2);
    });

    it('should set active tab', () => {
      const tab1Id = BrowserManager.createTab('about:blank');
      const tab2Id = BrowserManager.createTab('about:blank');

      BrowserManager.setActiveTab(tab2Id);
      const activeTab = BrowserManager.getActiveTab();
      expect(activeTab?.id).toBe(tab2Id);
    });

    it('should get active tab', () => {
      const tabId = BrowserManager.createTab('about:blank');
      const activeTab = BrowserManager.getActiveTab();
      expect(activeTab?.id).toBe(tabId);
    });

    it('should duplicate a tab', () => {
      const originalId = BrowserManager.createTab('https://example.com');
      const originalTab = BrowserManager.getTab(originalId);

      const duplicateId = BrowserManager.duplicateTab(originalId);
      const duplicateTab = BrowserManager.getTab(duplicateId);

      expect(duplicateTab?.url).toBe(originalTab?.url);
      expect(duplicateId).not.toBe(originalId);
    });
  });

  describe('Navigation State', () => {
    it('should track navigation state', async () => {
      const tabId = BrowserManager.createTab('about:blank');
      const tab = BrowserManager.getTab(tabId);

      expect(tab?.canGoBack).toBe(false);
      expect(tab?.canGoForward).toBe(false);
    });

    it('should get current URL', () => {
      const tabId = BrowserManager.createTab('https://example.com');
      BrowserManager.setActiveTab(tabId);

      const url = BrowserManager.getCurrentUrl();
      expect(url).toContain('example.com');
    });

    it('should get current title', () => {
      const tabId = BrowserManager.createTab('about:blank');
      BrowserManager.setActiveTab(tabId);

      const title = BrowserManager.getCurrentTitle();
      expect(typeof title).toBe('string');
    });
  });

  describe('Browser Area Bounds', () => {
    it('should set browser area bounds', () => {
      const bounds = { x: 0, y: 0, width: 800, height: 600 };
      expect(() => {
        BrowserManager.setBrowserAreaBounds(bounds);
      }).not.toThrow();
    });

    it('should handle multiple bound updates', () => {
      const bounds1 = { x: 0, y: 0, width: 800, height: 600 };
      const bounds2 = { x: 10, y: 10, width: 1024, height: 768 };

      BrowserManager.setBrowserAreaBounds(bounds1);
      BrowserManager.setBrowserAreaBounds(bounds2);

      // Should not throw or crash
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tab ID gracefully', () => {
      const tab = BrowserManager.getTab('invalid-id');
      expect(tab).toBeUndefined();
    });

    it('should handle close on non-existent tab', () => {
      expect(() => {
        BrowserManager.closeTab('invalid-id');
      }).not.toThrow();
    });

    it('should handle navigation on non-existent active tab', () => {
      const result = BrowserManager.navigateTo('https://example.com');
      expect(typeof result).toBe('boolean');
    });

    it('should handle goBack on empty history', () => {
      const tabId = BrowserManager.createTab('about:blank');
      BrowserManager.setActiveTab(tabId);

      const result = BrowserManager.goBack();
      expect(typeof result).toBe('boolean');
    });

    it('should handle goForward on empty history', () => {
      const tabId = BrowserManager.createTab('about:blank');
      BrowserManager.setActiveTab(tabId);

      const result = BrowserManager.goForward();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Stress Tests', () => {
    it('should handle creating many tabs', () => {
      const tabCount = 50;
      const tabIds: string[] = [];

      for (let i = 0; i < tabCount; i++) {
        const tabId = BrowserManager.createTab('about:blank');
        tabIds.push(tabId);
      }

      expect(BrowserManager.getAllTabs().length).toBeGreaterThanOrEqual(tabCount);

      // Cleanup
      tabIds.forEach(id => BrowserManager.closeTab(id));
    });

    it('should handle rapid tab switching', () => {
      const tab1Id = BrowserManager.createTab('about:blank');
      const tab2Id = BrowserManager.createTab('about:blank');
      const tab3Id = BrowserManager.createTab('about:blank');

      for (let i = 0; i < 100; i++) {
        BrowserManager.setActiveTab(tab1Id);
        BrowserManager.setActiveTab(tab2Id);
        BrowserManager.setActiveTab(tab3Id);
      }

      const activeTab = BrowserManager.getActiveTab();
      expect(activeTab?.id).toBe(tab3Id);
    });

    it('should handle rapid navigation commands', () => {
      const tabId = BrowserManager.createTab('about:blank');
      BrowserManager.setActiveTab(tabId);

      for (let i = 0; i < 50; i++) {
        BrowserManager.navigateTo(`https://example.com/${i}`);
        BrowserManager.reload();
      }

      expect(BrowserManager.getActiveTab()?.id).toBe(tabId);
    });
  });
});
