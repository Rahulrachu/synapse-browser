import { beforeEach, describe, expect, it, vi } from 'vitest';

const { executeJavaScript, mockedView } = vi.hoisted(() => {
  const executeJavaScript = vi.fn();
  return { executeJavaScript, mockedView: { webContents: { isDestroyed: vi.fn().mockReturnValue(false), executeJavaScript } } };
});

vi.mock('./BrowserManager.js', () => ({
  default: {
    getActiveTab: vi.fn().mockReturnValue({ id: 'tab-1' }),
    getWebContents: vi.fn().mockReturnValue(mockedView),
    navigateTo: vi.fn().mockReturnValue(true),
  },
}));

import BrowserAgentController from './BrowserAgentController.js';

describe('BrowserAgentController', () => {
  beforeEach(() => {
    executeJavaScript.mockReset();
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

  it('executes confirmed structured actions in the page', async () => {
    executeJavaScript.mockResolvedValue({ ok: true, message: 'Clicked matched element.' });
    const result = await BrowserAgentController.run({ type: 'click', tabId: 'tab-1', target: { role: 'button', name: 'Next' }, confirm: true });
    expect(result).toEqual({ ok: true, action: 'click', message: 'Clicked matched element.' });
    expect(executeJavaScript).toHaveBeenCalledOnce();
  });

  it('returns a useful error when no tab is available', async () => {
    const { default: manager } = await import('./BrowserManager.js');
    vi.mocked(manager.getWebContents).mockReturnValueOnce(undefined);
    const result = await BrowserAgentController.run({ type: 'inspect' });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('unavailable');
  });
});
