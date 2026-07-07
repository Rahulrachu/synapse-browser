import { describe, it, expect, vi, beforeEach } from 'vitest';
import BrowserAutomation from '../../src/main/BrowserAutomation';
import BrowserManager from '../../src/main/BrowserManager';

// Mock electron and BrowserManager
vi.mock('electron', () => ({
  webContents: {
    fromId: vi.fn()
  }
}));

vi.mock('../../src/main/BrowserManager', () => ({
  default: {
    getActiveTab: vi.fn(),
    getTab: vi.fn(),
    getWebContents: vi.fn()
  }
}));

describe('BrowserAutomation', () => {
  const mockWebContents = {
    loadURL: vi.fn().mockResolvedValue(undefined),
    executeJavaScript: vi.fn().mockResolvedValue(true),
    capturePage: vi.fn().mockResolvedValue({ toDataURL: () => 'data:image/png;base64,test' }),
    session: {
      cookies: {
        get: vi.fn().mockResolvedValue([])
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (BrowserManager.getActiveTab as any).mockReturnValue({ id: 'test-tab', viewId: 1 });
    (BrowserManager.getWebContents as any).mockReturnValue({ webContents: mockWebContents });
  });

  it('should navigate to a URL', async () => {
    const result = await BrowserAutomation.navigate('https://example.com');
    expect(result.success).toBe(true);
    expect(mockWebContents.loadURL).toHaveBeenCalledWith('https://example.com');
  });

  it('should execute javascript', async () => {
    const result = await BrowserAutomation.executeJavaScript('console.log("test")');
    expect(result.success).toBe(true);
    expect(mockWebContents.executeJavaScript).toHaveBeenCalledWith('console.log("test")');
  });

  it('should click an element', async () => {
    const result = await BrowserAutomation.clickElement('#btn');
    expect(result.success).toBe(true);
    expect(mockWebContents.executeJavaScript).toHaveBeenCalled();
  });

  it('should take a screenshot', async () => {
    const result = await BrowserAutomation.takeScreenshot();
    expect(result.success).toBe(true);
    expect(result.data).toBe('data:image/png;base64,test');
  });
});
