import * as electron from "electron";
import { browserManager } from "../browser/BrowserManager";

class UnavailableVisionProvider {
  id = "unavailable";
  unavailable() {
    throw new Error(
      "No vision provider is configured. Set SYNAPSE_VISION_API_KEY and SYNAPSE_VISION_BASE_URL to enable screenshot perception.",
    );
  }
  async analyzeScreenshot() {
    return this.unavailable();
  }
  async detectTargets() {
    return this.unavailable();
  }
  async readText() {
    return this.unavailable();
  }
  async describeRegion() {
    return this.unavailable();
  }
  async localizeTarget() {
    return this.unavailable();
  }
}
class OpenAIVisionProvider {
  constructor(apiKey, baseUrl = "https://api.openai.com/v1", model = "gpt-4.1-mini") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }
  apiKey;
  baseUrl;
  model;
  id = "openai-vision";
  async analyzeScreenshot(input) {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a browser perception engine. Return only JSON with targets and text. Do not invent elements. Report only visible, actionable regions from the supplied screenshot. Coordinates are CSS viewport pixels, not image pixels.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  url: input.snapshot.url,
                  title: input.snapshot.title,
                  domElements: input.snapshot.elements.slice(0, 120),
                  viewport: {
                    width: input.screenshot.viewportWidth,
                    height: input.screenshot.viewportHeight,
                    dpr: input.screenshot.devicePixelRatio,
                  },
                }),
              },
              { type: "image_url", image_url: { url: input.imageDataUrl, detail: "high" } },
            ],
          },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Vision provider error ${response.status}: ${await response.text()}`);
    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Vision provider returned no JSON content");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.targets) || !Array.isArray(parsed.text))
      throw new Error("Vision provider returned an invalid perception schema");
    return { targets: parsed.targets, text: parsed.text };
  }
  async detectTargets(input) {
    return (await this.analyzeScreenshot(input)).targets;
  }
  async readText(input) {
    return (await this.analyzeScreenshot(input)).text;
  }
  async describeRegion(input, region) {
    const result = await this.analyzeScreenshot(input);
    return (
      result.targets
        .filter(
          (target) =>
            target.bounds.x < region.x + region.width &&
            target.bounds.x + target.bounds.width > region.x &&
            target.bounds.y < region.y + region.height &&
            target.bounds.y + target.bounds.height > region.y,
        )
        .map((target) => target.description || target.nearbyText || target.type)
        .join("; ") || "No recognized target in region."
    );
  }
  async localizeTarget(input, description) {
    const result = await this.analyzeScreenshot(input);
    const wanted = description.toLowerCase();
    return (
      result.targets
        .filter((target) =>
          `${target.description} ${target.nearbyText || ""} ${target.likelyAction || ""}`
            .toLowerCase()
            .includes(wanted),
        )
        .sort((a, b) => b.confidence - a.confidence)[0] || null
    );
  }
}
function createVisionProvider() {
  const key = process.env.SYNAPSE_VISION_API_KEY || process.env.OPENAI_API_KEY;
  return key
    ? new OpenAIVisionProvider(
        key,
        process.env.SYNAPSE_VISION_BASE_URL || process.env.OPENAI_API_BASE,
        process.env.SYNAPSE_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
      )
    : new UnavailableVisionProvider();
}
function clampVisualTarget(target, width, height) {
  const x = Number(target?.bounds?.x);
  const y = Number(target?.bounds?.y);
  const w = Number(target?.bounds?.width);
  const h = Number(target?.bounds?.height);
  const confidence = Number(target?.confidence);
  if (
    ![x, y, w, h, confidence].every(Number.isFinite) ||
    w <= 0 ||
    h <= 0 ||
    confidence < 0 ||
    confidence > 1
  )
    return null;
  const right = x + w;
  const bottom = y + h;
  if (x < 0 || y < 0 || right > width || bottom > height) return null;
  return {
    ...target,
    bounds: { x, y, width: w, height: h },
    center: { x: x + w / 2, y: y + h / 2 },
    confidence,
    visible: target.visible !== false,
    clickable: target.clickable !== false,
  };
}
const SENSITIVE_WORDS =
  /\b(send|submit|purchase|buy|pay|checkout|delete|remove|publish|post|transfer|confirm|sign in|log in|create account|follow|like|comment|message|subscribe|connect|invite)\b/i;
function targetLabel(target) {
  return [target.role, target.name, target.text, target.label, target.placeholder, target.selector]
    .filter(Boolean)
    .join(" ");
}
function isSensitiveTarget(target) {
  return SENSITIVE_WORDS.test(targetLabel(target));
}
function currentTabId(tabId) {
  return tabId || browserManager.getActiveTab()?.id;
}
function viewFor(tabId) {
  const id = currentTabId(tabId);
  return id ? browserManager.getWebContents(id) : void 0;
}
const INSPECT_SCRIPT = (includeHtml) => `(() => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const clean = (value) => String(value || '').replace(/\\s+/g, ' ').trim().slice(0, 240);
  const nameFor = (el) => clean(el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.value || el.placeholder || el.getAttribute('alt'));
  const roleFor = (el) => el.getAttribute('role') || ({ BUTTON: 'button', A: 'link', INPUT: el.type === 'checkbox' ? 'checkbox' : el.type === 'radio' ? 'radio' : 'textbox', TEXTAREA: 'textbox', SELECT: 'combobox', SUMMARY: 'button' }[el.tagName] || null);
  const elements = Array.from(document.querySelectorAll('button, a, input, textarea, select, [role], [contenteditable="true"], summary'))
    .filter(visible).slice(0, 150).map((el, index) => { const r = el.getBoundingClientRect(); return {
      id: 'agent-' + index, tag: el.tagName.toLowerCase(), role: roleFor(el), name: nameFor(el), text: clean(el.innerText),
      value: 'value' in el ? clean(el.value) : null, placeholder: el.getAttribute('placeholder'), disabled: !!el.disabled,
      rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }
    }; });
  const authRequired = !!document.querySelector('input[type="password"], input[autocomplete="current-password"], input[autocomplete="username"]') || /\b(sign in|log in|authenticate|enter password|two-factor|verification code)\b/i.test(document.body?.innerText || '');
  return { url: location.href, title: document.title, elements, text: clean(document.body?.innerText).slice(0, 12000), authRequired, html: ${includeHtml ? "document.body?.innerHTML?.slice(0, 20000)" : "undefined"} };
})()`;
const ACTION_SCRIPT = (target, operation, value, key) => `(() => {
  try {
  const target = ${JSON.stringify(target)};
  const operation = ${JSON.stringify(operation)};
  const clean = (v) => String(v || '').replace(/\\s+/g, ' ').trim().toLowerCase();
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const roleFor = (el) => el.getAttribute('role') || ({ BUTTON: 'button', A: 'link', INPUT: el.type === 'checkbox' ? 'checkbox' : el.type === 'radio' ? 'radio' : 'textbox', TEXTAREA: 'textbox', SELECT: 'combobox', SUMMARY: 'button' }[el.tagName] || null);
  const nameFor = (el) => clean(el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.value || el.placeholder || el.getAttribute('alt'));
  const candidates = Array.from(document.querySelectorAll('button, a, input, textarea, select, [role], [contenteditable="true"], summary')).filter(visible);
  const wanted = clean(target.name || target.text || target.label || target.placeholder);
  const matches = candidates.filter((el) => {
    if (target.selector && el.matches(target.selector)) return true;
    if (target.role && clean(roleFor(el)) !== clean(target.role)) return false;
    if (!wanted) return !target.role || clean(roleFor(el)) === clean(target.role);
    const hay = [nameFor(el), clean(el.innerText), clean(el.getAttribute('aria-label')), clean(el.getAttribute('placeholder'))].join(' ');
    return hay.includes(wanted);
  });
  const el = matches[target.index || 0];
  if (!el) return { ok: false, message: 'No visible element matched the requested target.' };
  el.scrollIntoView({ block: 'center', inline: 'center' });
  if (operation === 'click') { el.click(); return { ok: true, message: 'Clicked matched element.' }; }
  if (operation === 'copy') {
    const copied = 'value' in el && typeof el.value === 'string' ? el.value : (el.innerText || el.textContent || '');
    return { ok: true, message: 'Copied matched text.', clipboardText: String(copied) };
  }
  if (operation === 'fill' || operation === 'paste') {
    const nextValue = ${JSON.stringify(value || "")};
    if ('value' in el) {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLInputElement ? HTMLInputElement.prototype : null;
      const setter = proto && Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      try { if (setter) setter.call(el, nextValue); else el.value = nextValue; } catch { try { el.value = nextValue; } catch { return { ok: false, message: 'Matched element value could not be updated.' }; } }
    } else if (el.isContentEditable) el.textContent = nextValue;
    else return { ok: false, message: 'Matched element is not editable.' };
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, message: operation === 'paste' ? 'Pasted clipboard text into matched field.' : 'Filled matched field.' };
  }
  el.focus();
  const pressedKey = ${JSON.stringify(key || "")};
  el.dispatchEvent(new KeyboardEvent('keydown', { key: pressedKey, bubbles: true }));
  if (pressedKey === 'Enter' && 'value' in el) { const form = el.closest('form'); if (form && typeof form.requestSubmit === 'function') form.requestSubmit(); else if (form) form.submit(); }
  el.dispatchEvent(new KeyboardEvent('keyup', { key: pressedKey, bubbles: true }));
  return { ok: true, message: 'Pressed key on matched element.' };
  } catch (error) { return { ok: false, message: 'Page action script failed: ' + String(error?.message || error) }; }
})()`;
class BrowserAgentController {
  async run(action) {
    if (action.type === "navigate") {
      if (!/^https?:\/\//i.test(action.url))
        return { ok: false, action: action.type, message: "Only http(s) navigation is allowed." };
      const result2 = browserManager.navigateTo(action.url);
      return {
        ok: !!result2,
        action: action.type,
        message: result2 ? "Navigation started." : "Navigation failed.",
      };
    }
    const view = viewFor(action.tabId);
    if (!view || view.webContents.isDestroyed())
      return { ok: false, action: action.type, message: "Target tab is unavailable." };
    if (action.type === "inspect") {
      const snapshot2 = await view.webContents.executeJavaScript(INSPECT_SCRIPT(!!action.includeHtml), true);
      return { ok: true, action: action.type, snapshot: snapshot2 };
    }
    if (action.type === "observe_visual") {
      const snapshot2 = await view.webContents.executeJavaScript(INSPECT_SCRIPT(false), true);
      const screenshot = await browserManager.captureScreenshot(currentTabId(action.tabId));
      if (!screenshot) return { ok: false, action: action.type, message: "Screenshot capture failed." };
      const provider = createVisionProvider();
      const baseObservation = {
        id: `visual-${screenshot.timestamp}`,
        available: true,
        provider: provider.id,
        screenshot: {
          ...screenshot,
          id: screenshot.tabId + "-" + screenshot.timestamp,
          mimeType: "image/png",
        },
        targets: [],
        text: [],
      };
      try {
        const result2 = await provider.analyzeScreenshot({
          imageDataUrl: `data:image/png;base64,${screenshot.data}`,
          snapshot: snapshot2,
          screenshot: baseObservation.screenshot,
        });
        const targets = result2.targets
          .map((target) => clampVisualTarget(target, screenshot.viewportWidth, screenshot.viewportHeight))
          .filter(Boolean);
        return {
          ok: true,
          action: action.type,
          snapshot: snapshot2,
          visual: { ...baseObservation, targets, text: result2.text },
        };
      } catch (error) {
        return {
          ok: false,
          action: action.type,
          snapshot: snapshot2,
          visual: { ...baseObservation, available: false, error: error?.message || String(error) },
          message: error?.message || "Visual perception unavailable.",
        };
      }
    }
    if (action.type === "visual_click") {
      if (
        !action.confirm &&
        isSensitiveTarget({ name: action.target.description, text: action.target.nearbyText })
      )
        return {
          ok: false,
          action: action.type,
          confirmationRequired: true,
          confirmationReason: "This visual target may cause an external side effect.",
        };
      const screenshot = await browserManager.captureScreenshot(currentTabId(action.tabId));
      if (!screenshot) return { ok: false, action: action.type, message: "Screenshot capture failed." };
      const target = clampVisualTarget(action.target, screenshot.viewportWidth, screenshot.viewportHeight);
      if (!target || target.confidence < 0.78 || !target.visible || !target.clickable)
        return {
          ok: false,
          action: action.type,
          message: "Visual target was rejected because it is uncertain, invisible, or outside the viewport.",
        };
      const before2 = await view.webContents.executeJavaScript(INSPECT_SCRIPT(false), true);
      const clicked = await browserManager.clickAt(
        target.center.x,
        target.center.y,
        currentTabId(action.tabId),
      );
      if (!clicked)
        return {
          ok: false,
          action: action.type,
          message: "Coordinate click was rejected by the browser interaction layer.",
        };
      await new Promise((resolve) => setTimeout(resolve, 100));
      const after = await view.webContents.executeJavaScript(INSPECT_SCRIPT(false), true);
      const changed =
        after.url !== before2.url || after.title !== before2.title || after.text !== before2.text;
      return {
        ok: changed,
        action: action.type,
        snapshot: after,
        message: changed
          ? "Visual coordinate click dispatched and verified through a fresh observation."
          : "The click was dispatched, but no measurable page change was detected.",
        verification: {
          verified: changed,
          detail: changed
            ? "Fresh DOM observation changed after the click."
            : "The click was dispatched, but no measurable page change was detected.",
        },
      };
    }
    if (action.type === "scroll") {
      const before2 = await view.webContents.executeJavaScript(
        "({ y: window.scrollY, height: document.documentElement.scrollHeight })",
        true,
      );
      const amount =
        Math.min(Math.max(Math.abs(action.amount || 600), 50), 1800) * (action.direction === "up" ? -1 : 1);
      await view.webContents.executeJavaScript(
        `window.scrollBy({ top: ${amount}, behavior: 'instant' })`,
        true,
      );
      const after = await view.webContents.executeJavaScript(
        "({ y: window.scrollY, height: document.documentElement.scrollHeight })",
        true,
      );
      const moved = before2.y !== after.y || before2.height !== after.height;
      return {
        ok: moved,
        action: action.type,
        message: moved ? "Scrolled the active page." : "The page did not move.",
        verification: { verified: moved, detail: `Scroll position changed from ${before2.y} to ${after.y}.` },
      };
    }
    if (action.type === "click" && isSensitiveTarget(action.target) && !action.confirm) {
      return {
        ok: false,
        action: action.type,
        confirmationRequired: true,
        confirmationReason:
          "This target may submit, publish, delete, authenticate, or cause an external side effect.",
      };
    }
    const before = await view.webContents.executeJavaScript(INSPECT_SCRIPT(false), true);
    const clipboardText = action.type === "paste" ? electron.clipboard.readText() : void 0;
    const result = await view.webContents.executeJavaScript(
      ACTION_SCRIPT(
        action.target || {},
        action.type,
        action.type === "fill" ? action.value : clipboardText,
        action.type === "press" ? action.key : void 0,
      ),
      true,
    );
    if (action.type === "copy" && result.ok) electron.clipboard.writeText(result.clipboardText || "");
    if (!result.ok)
      return { ...result, action: action.type, verification: { verified: false, detail: result.message } };
    await new Promise((resolve) => setTimeout(resolve, 100));
    const snapshot = await view.webContents.executeJavaScript(INSPECT_SCRIPT(false), true);
    const wanted = [
      action.target?.name,
      action.target?.text,
      action.target?.label,
      action.target?.placeholder,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matched = Array.isArray(snapshot?.elements)
      ? snapshot.elements.find(
          (element) =>
            !wanted ||
            `${element.name} ${element.text} ${element.placeholder || ""}`.toLowerCase().includes(wanted),
        )
      : void 0;
    const beforeSignature = `${before?.url || ""}|${before?.title || ""}|${before?.text || ""}`;
    const afterSignature = `${snapshot?.url || ""}|${snapshot?.title || ""}|${snapshot?.text || ""}`;
    const pageChanged = beforeSignature !== afterSignature;
    const verified =
      action.type === "fill"
        ? !!matched && matched.value === action.value
        : action.type === "copy"
          ? electron.clipboard.readText() === (result.clipboardText || "")
          : action.type === "paste"
            ? !!matched && matched.value === clipboardText
            : pageChanged;
    const detail =
      action.type === "fill"
        ? `Expected the matched field value to equal ${JSON.stringify(action.value)}.`
        : action.type === "copy"
          ? "Expected the system clipboard to equal the copied page text."
          : action.type === "paste"
            ? "Expected the matched field value to equal the clipboard text."
            : pageChanged
              ? "Fresh page observation changed after the action."
              : "The action ran, but the page did not measurably change.";
    return {
      ...result,
      ok: verified,
      action: action.type,
      snapshot,
      message: verified
        ? `${result.message} Verified against a fresh page observation.`
        : `Action ran, but verification failed: ${detail}`,
      verification: { verified, detail, snapshot },
    };
  }
}
export const browserAgentController = new BrowserAgentController();
