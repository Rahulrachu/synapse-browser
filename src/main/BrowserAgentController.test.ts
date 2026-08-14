import { beforeEach, describe, expect, it, vi } from 'vitest';

const { executeJavaScript, mockedView, captureScreenshot, clickAt } = vi.hoisted(() => {
  const executeJavaScript = vi.fn();
  const captureScreenshot = vi.fn();
  const clickAt = vi.fn();
  return { executeJavaScript, captureScreenshot, clickAt, mockedView: { webContents: { isDestroyed: vi.fn().mockReturnValue(false), executeJavaScript } } };
});

vi.mock('./BrowserManager.js', () => ({
  default: {
    getActiveTab: vi.fn().mockReturnValue({ id: 'tab-1' }),
    getWebContents: vi.fn().mockReturnValue(mockedView),
    navigateTo: vi.fn().mockReturnValue(true),
    captureScreenshot,
    clickAt,
  },
}));

import BrowserAgentController from './BrowserAgentController.js';

describe('BrowserAgentController', () => {
  beforeEach(() => {
    executeJavaScript.mockReset();
    captureScreenshot.mockReset();
    clickAt.mockReset();
  });

  it('rejects non-http navigation', async () => {
    const result = await BrowserAgentController.run({ type: 'navigate', url: 'javascript:alert(1)' });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Only http(s)');
  });

  it('requires confirmation for sensitive clicks', async () => {
    const result = await BrowserAgentController.run({ type: 'click', target: { role: 'button', name: 'Submit payment' } });
    expect(result.ok).toBe(false);
    expect(result.confirmationRequired).toBe(true);
    expect(executeJavaScript).not.toHaveBeenCalled();
  });

  it('executes confirmed structured actions and verifies a changed page state', async () => {
    executeJavaScript
      .mockResolvedValueOnce({ url: 'https://example.com', title: 'Before', text: 'Before state', elements: [] })
      .mockResolvedValueOnce({ ok: true, message: 'Clicked matched element.' })
      .mockResolvedValueOnce({ url: 'https://example.com/next', title: 'After', text: 'After state', elements: [] });
    const result = await BrowserAgentController.run({ type: 'click', tabId: 'tab-1', target: { role: 'button', name: 'Next' }, confirm: true });
    expect(result.ok).toBe(true);
    expect(result.action).toBe('click');
    expect(result.message).toContain('Verified against a fresh page observation');
    expect(result.verification?.verified).toBe(true);
    expect(executeJavaScript).toHaveBeenCalledTimes(3);
  });

  it('requires confirmation for social side effects such as following', async () => {
    const result = await BrowserAgentController.run({ type: 'click', target: { role: 'button', name: 'Follow' } });
    expect(result.ok).toBe(false);
    expect(result.confirmationRequired).toBe(true);
    expect(executeJavaScript).not.toHaveBeenCalled();
  });

  it('verifies a visual click against a fresh post-click observation', async () => {
    captureScreenshot.mockResolvedValue({ tabId: 'tab-1', timestamp: 1, data: 'png', viewportWidth: 1000, viewportHeight: 800, devicePixelRatio: 1, scrollX: 0, scrollY: 0 });
    clickAt.mockResolvedValue(true);
    executeJavaScript
      .mockResolvedValueOnce({ url: 'https://example.com', title: 'Before', text: 'Before', elements: [] })
      .mockResolvedValueOnce({ url: 'https://example.com/next', title: 'After', text: 'After', elements: [] });
    const result = await BrowserAgentController.run({ type: 'visual_click', target: { description: 'Next', bounds: { x: 10, y: 10, width: 80, height: 30 }, center: { x: 50, y: 25 }, confidence: 0.95, visible: true, clickable: true } as any });
    expect(result.ok).toBe(true);
    expect(result.verification?.verified).toBe(true);
    expect(clickAt).toHaveBeenCalledWith(50, 25, 'tab-1');
  });

  it('returns a useful error when no tab is available', async () => {
    const { default: manager } = await import('./BrowserManager.js');
    vi.mocked(manager.getWebContents).mockReturnValueOnce(undefined);
    const result = await BrowserAgentController.run({ type: 'inspect' });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('unavailable');
  });
});
