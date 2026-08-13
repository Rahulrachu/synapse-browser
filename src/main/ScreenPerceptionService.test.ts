import { describe, expect, it } from 'vitest';
import { clampVisualTarget, UnavailableVisionProvider } from './ScreenPerceptionService.js';

describe('ScreenPerceptionService', () => {
  it('accepts only finite in-viewport targets and recomputes the center', () => {
    const target = clampVisualTarget({ id: 't1', type: 'button', description: 'Next', bounds: { x: 10, y: 20, width: 100, height: 40 }, center: { x: 0, y: 0 }, confidence: 0.91, clickable: true, visible: true }, 800, 600);
    expect(target?.center).toEqual({ x: 60, y: 40 });
    expect(clampVisualTarget({ id: 'bad', type: 'button', description: 'Outside', bounds: { x: 790, y: 20, width: 100, height: 40 }, center: { x: 0, y: 0 }, confidence: 0.91, clickable: true, visible: true }, 800, 600)).toBeNull();
  });

  it('rejects invalid confidence and dimensions', () => {
    expect(clampVisualTarget({ id: 'bad', type: 'button', description: 'Bad', bounds: { x: 1, y: 1, width: 0, height: 20 }, center: { x: 1, y: 1 }, confidence: 1.2, clickable: true, visible: true }, 800, 600)).toBeNull();
  });

  it('does not fabricate perception when no provider is configured', async () => {
    const provider = new UnavailableVisionProvider();
    await expect(provider.analyzeScreenshot()).rejects.toThrow('No vision provider is configured');
    await expect(provider.detectTargets()).rejects.toThrow('No vision provider is configured');
    await expect(provider.readText()).rejects.toThrow('No vision provider is configured');
  });
});
