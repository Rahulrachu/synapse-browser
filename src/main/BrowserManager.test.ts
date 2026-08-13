import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { app, BrowserWindow, WebContentsView, dialog, clipboard } from 'electron';
import BrowserManager from './BrowserManager.js';
import Storage from './Storage.js';
import ProfileManager from './ProfileManager.js';
import DownloadManager from './DownloadManager.js';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/userData'),
  },
  BrowserWindow: vi.fn(),
  WebContentsView: vi.fn(() => ({
    webContents: {
      on: vi.fn(),
      once: vi.fn(),
      loadURL: vi.fn().mockResolvedValue(true),
      goBack: vi.fn(),
      goForward: vi.fn(),
      reload: vi.fn(),
      stop: vi.fn(),
      close: vi.fn(),
      isDestroyed: vi.fn().mockReturnValue(false),
      executeJavaScript: vi.fn().mockImplementation((script: string) => script.includes('innerWidth') ? { width: 800, height: 600, dpr: 1, scrollX: 0, scrollY: 10 } : true),
      capturePage: vi.fn().mockResolvedValue({ getSize: () => ({ width: 800, height: 600 }), toPNG: () => Buffer.from('png') }),
      sendInputEvent: vi.fn(),
      getTitle: vi.fn().mockReturnValue('Mock Title'),
      getURL: vi.fn().mockReturnValue('https://mock.url'),
      session: {
        setPermissionRequestHandler: vi.fn(),
        on: vi.fn(),
      },
      navigationHistory: {
        canGoBack: vi.fn().mockReturnValue(true),
        canGoForward: vi.fn().mockReturnValue(true),
      },
      setWindowOpenHandler: vi.fn(),
    },
    setVisible: vi.fn(),
    setBounds: vi.fn(),
  })),
  dialog: {
    showMessageBoxSync: vi.fn().mockReturnValue(0),
    showSaveDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: '/mock/path.pdf' }),
  },
  clipboard: {
    writeText: vi.fn(),
  },
  Menu: {
    buildFromTemplate: vi.fn(() => ({ popup: vi.fn() })),
  }
}));

vi.mock('./BrowserWindow.js', () => ({
  getMainWindow: vi.fn(() => ({
    contentView: {
      addChildView: vi.fn(),
      removeChildView: vi.fn(),
    },
    getContentBounds: vi.fn().mockReturnValue({ width: 1024, height: 768, x: 0, y: 0 }),
    isDestroyed: vi.fn().mockReturnValue(false),
    webContents: {
      send: vi.fn(),
    }
  }))
}));

vi.mock('./Storage.js', () => ({
  default: {
    addToHistory: vi.fn(),
    set: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('./DownloadManager.js', () => ({
  default: {
    registerSession: vi.fn(),
  }
}));

describe('BrowserManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear tabs
    BrowserManager['tabs'].clear();
    BrowserManager['tabViews'].clear();
    BrowserManager['recentlyClosed'].length = 0;
    BrowserManager['activeTabId'] = null;
  });

  it('creates a tab and sets it as active', () => {
    const tabId = BrowserManager.createTab('https://example.com');
    expect(tabId).toBeDefined();
    expect(BrowserManager.getActiveTab()?.id).toBe(tabId);
    expect(BrowserManager.getAllTabs().length).toBe(1);
    expect(BrowserManager.getAllTabs()[0].url).toBe('https://example.com/');
  });

  it('supports multi-tab browsing (10 tabs)', () => {
    const ids = [];
    for (let i = 0; i < 10; i++) {
      ids.push(BrowserManager.createTab(`https://example.com/${i}`));
    }
    expect(BrowserManager.getAllTabs().length).toBe(10);
    expect(BrowserManager.getActiveTab()?.id).toBe(ids[9]);
    
    // Switch tab
    BrowserManager.setActiveTab(ids[5]);
    expect(BrowserManager.getActiveTab()?.id).toBe(ids[5]);

    // Close tab
    BrowserManager.closeTab(ids[5]);
    expect(BrowserManager.getAllTabs().length).toBe(9);
    expect(BrowserManager.getActiveTab()?.id).toBe(ids[9]); // Reverts to last tab
  });

  it('handles private browsing correctly', () => {
    const tabId = BrowserManager.createTab('https://private.com', { isPrivate: true });
    const tab = BrowserManager.getAllTabs()[0];
    expect(tab.isPrivate).toBe(true);
    
    // Simulate navigation
    const view = BrowserManager['tabViews'].get(tabId);
    const didFinishLoadCb = view.webContents.on.mock.calls.find(call => call[0] === 'did-finish-load')[1];
    
    didFinishLoadCb();
    
    // Storage.addToHistory should NOT be called for private tabs
    expect(Storage.addToHistory).not.toHaveBeenCalled();
  });

  it('reopens closed tabs', () => {
    const tabId = BrowserManager.createTab('https://reopen.com');
    BrowserManager.closeTab(tabId);
    // Closing the last tab automatically spawns a blank fallback tab
    expect(BrowserManager.getAllTabs().length).toBe(1);
    expect(BrowserManager.getAllTabs()[0].url).toBe('about:blank');
    
    const newTabId = BrowserManager.reopenClosedTab();
    expect(newTabId).toBeDefined();
    expect(BrowserManager.getAllTabs().length).toBe(2);
  });

  it('restores sessions correctly', () => {
    const savedTabs = [
      { url: 'https://site1.com', profileId: 'default' },
      { url: 'https://site2.com', profileId: 'default', isPrivate: true }, // Should be ignored
      { url: 'https://site3.com', profileId: 'profile-2' }
    ];
    
    BrowserManager.restoreTabs(savedTabs);
    
    const tabs = BrowserManager.getAllTabs();
    expect(tabs.length).toBe(2);
    expect(tabs[0].url).toBe('https://site1.com/');
    expect(tabs[1].url).toBe('https://site3.com/');
    expect(tabs[1].profileId).toBe('profile-2');
  });

  it('registers download sessions', () => {
    const tabId = BrowserManager.createTab('https://download.com');
    expect(DownloadManager.registerSession).toHaveBeenCalled();
  });

  it('clamps browser bounds so the native view cannot cover the AI panel', () => {
    const tabId = BrowserManager.createTab('https://layout.example');
    const view = BrowserManager['tabViews'].get(tabId);
    BrowserManager.setBrowserAreaBounds({ x: 0, y: 0, width: 1600, height: 1000 });
    expect(view.setBounds).toHaveBeenCalledWith(expect.objectContaining({ x: 72, y: 96, width: 572, height: 640 }));
  });

  it('captures screenshot metadata from the active WebContentsView', async () => {
    const tabId = BrowserManager.createTab('https://screen.example');
    const screenshot = await BrowserManager.captureScreenshot(tabId);
    expect(screenshot?.tabId).toBe(tabId);
    expect(screenshot?.viewportWidth).toBe(800);
    expect(screenshot?.width).toBe(800);
    expect(screenshot?.data).toBe(Buffer.from('png').toString('base64'));
  });

  it('dispatches coordinate input only for a visible in-viewport hit target', async () => {
    const tabId = BrowserManager.createTab('https://screen.example');
    const view = BrowserManager['tabViews'].get(tabId);
    view.webContents.executeJavaScript.mockImplementation(async (script) => script.includes('elementFromPoint') ? true : { width: 800, height: 600 });
    expect(await BrowserManager.clickAt(100, 120, tabId)).toBe(true);
    expect(view.webContents.sendInputEvent).toHaveBeenCalledTimes(3);
    expect(await BrowserManager.clickAt(900, 120, tabId)).toBe(false);
  });

  it('handles tab crash recovery state', () => {
    const tabId = BrowserManager.createTab('https://crash.com');
    const view = BrowserManager['tabViews'].get(tabId);
    
    const crashCb = view.webContents.on.mock.calls.find(call => call[0] === 'render-process-gone')[1];
    crashCb({}, { reason: 'crashed' });
    
    const tab = BrowserManager.getAllTabs()[0];
    expect(tab.isCrashed).toBe(true);
  });
});
