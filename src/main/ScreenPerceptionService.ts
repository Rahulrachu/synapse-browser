import { randomUUID } from 'node:crypto';
import type { BrowserAgentSnapshot } from './BrowserAgentController.js';

export interface ScreenshotMetadata {
  id: string;
  timestamp: number;
  tabId: string;
  url: string;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
  mimeType: 'image/png';
  data: string;
}

export interface VisualTarget {
  id: string;
  type: string;
  description: string;
  bounds: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number };
  confidence: number;
  nearbyText?: string;
  likelyAction?: string;
  clickable: boolean;
  visible: boolean;
}

export interface VisualObservation {
  available: boolean;
  provider: string;
  screenshot: ScreenshotMetadata;
  targets: VisualTarget[];
  text: Array<{ text: string; bounds: { x: number; y: number; width: number; height: number }; confidence: number; order: number }>;
  error?: string;
}

export type VisionInput = { imageDataUrl: string; snapshot: BrowserAgentSnapshot; screenshot: ScreenshotMetadata };

export interface VisionProvider {
  readonly id: string;
  analyzeScreenshot(input: VisionInput): Promise<{ targets: VisualTarget[]; text: VisualObservation['text'] }>;
  detectTargets(input: VisionInput): Promise<VisualTarget[]>;
  readText(input: VisionInput): Promise<VisualObservation['text']>;
  describeRegion(input: VisionInput, region: { x: number; y: number; width: number; height: number }): Promise<string>;
  localizeTarget(input: VisionInput, description: string): Promise<VisualTarget | null>;
}

/** A provider that never fabricates perception when no real model is configured. */
export class UnavailableVisionProvider implements VisionProvider {
  readonly id = 'unavailable';
  private unavailable(): never { throw new Error('No vision provider is configured. Set SYNAPSE_VISION_API_KEY and SYNAPSE_VISION_BASE_URL to enable screenshot perception.'); }
  async analyzeScreenshot(): Promise<{ targets: VisualTarget[]; text: VisualObservation['text'] }> { return this.unavailable(); }
  async detectTargets(): Promise<VisualTarget[]> { return this.unavailable(); }
  async readText(): Promise<VisualObservation['text']> { return this.unavailable(); }
  async describeRegion(): Promise<string> { return this.unavailable(); }
  async localizeTarget(): Promise<VisualTarget | null> { return this.unavailable(); }
}

export class OpenAIVisionProvider implements VisionProvider {
  readonly id = 'openai-vision';
  constructor(private readonly apiKey: string, private readonly baseUrl = 'https://api.openai.com/v1', private readonly model = 'gpt-4.1-mini') {}

  async analyzeScreenshot(input: VisionInput) {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: 'You are a browser perception engine. Return only JSON with targets and text. Do not invent elements. Report only visible, actionable regions from the supplied screenshot. Coordinates are CSS viewport pixels, not image pixels.' }, { role: 'user', content: [{ type: 'text', text: JSON.stringify({ url: input.snapshot.url, title: input.snapshot.title, domElements: input.snapshot.elements.slice(0, 120), viewport: { width: input.screenshot.viewportWidth, height: input.screenshot.viewportHeight, dpr: input.screenshot.devicePixelRatio } }) }, { type: 'image_url', image_url: { url: input.imageDataUrl, detail: 'high' } }] }],
      }),
    });
    if (!response.ok) throw new Error(`Vision provider error ${response.status}: ${await response.text()}`);
    const body: any = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('Vision provider returned no JSON content');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.targets) || !Array.isArray(parsed.text)) throw new Error('Vision provider returned an invalid perception schema');
    return { targets: parsed.targets, text: parsed.text };
  }

  async detectTargets(input: VisionInput): Promise<VisualTarget[]> { return (await this.analyzeScreenshot(input)).targets; }
  async readText(input: VisionInput): Promise<VisualObservation['text']> { return (await this.analyzeScreenshot(input)).text; }
  async describeRegion(input: VisionInput, region: { x: number; y: number; width: number; height: number }): Promise<string> {
    const result = await this.analyzeScreenshot(input);
    return result.targets.filter((target) => target.bounds.x < region.x + region.width && target.bounds.x + target.bounds.width > region.x && target.bounds.y < region.y + region.height && target.bounds.y + target.bounds.height > region.y).map((target) => target.description || target.nearbyText || target.type).join('; ') || 'No recognized target in region.';
  }
  async localizeTarget(input: VisionInput, description: string): Promise<VisualTarget | null> {
    const result = await this.analyzeScreenshot(input);
    const wanted = description.toLowerCase();
    return result.targets.filter((target) => `${target.description} ${target.nearbyText || ''} ${target.likelyAction || ''}`.toLowerCase().includes(wanted)).sort((a, b) => b.confidence - a.confidence)[0] || null;
  }
}

export function createVisionProvider(): VisionProvider {
  const key = process.env.SYNAPSE_VISION_API_KEY || process.env.OPENAI_API_KEY;
  return key ? new OpenAIVisionProvider(key, process.env.SYNAPSE_VISION_BASE_URL || process.env.OPENAI_API_BASE, process.env.SYNAPSE_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini') : new UnavailableVisionProvider();
}

export function newScreenshotId(): string { return `shot-${randomUUID()}`; }

export function clampVisualTarget(target: VisualTarget, width: number, height: number): VisualTarget | null {
  const x = Number(target?.bounds?.x); const y = Number(target?.bounds?.y); const w = Number(target?.bounds?.width); const h = Number(target?.bounds?.height);
  const confidence = Number(target?.confidence);
  if (![x, y, w, h, confidence].every(Number.isFinite) || w <= 0 || h <= 0 || confidence < 0 || confidence > 1) return null;
  const right = x + w; const bottom = y + h;
  if (x < 0 || y < 0 || right > width || bottom > height) return null;
  return { ...target, bounds: { x, y, width: w, height: h }, center: { x: x + w / 2, y: y + h / 2 }, confidence, visible: target.visible !== false, clickable: target.clickable !== false };
}
