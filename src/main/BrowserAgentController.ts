import BrowserManager from './BrowserManager.js';

export type BrowserAgentAction =
  | { type: 'inspect'; tabId?: string; includeHtml?: boolean }
  | { type: 'click'; tabId?: string; target: BrowserAgentTarget; confirm?: boolean }
  | { type: 'fill'; tabId?: string; target: BrowserAgentTarget; value: string }
  | { type: 'press'; tabId?: string; target?: BrowserAgentTarget; key: string }
  | { type: 'scroll'; tabId?: string; direction?: 'up' | 'down'; amount?: number }
  | { type: 'navigate'; tabId?: string; url: string };

export interface BrowserAgentTarget {
  role?: string;
  name?: string;
  text?: string;
  label?: string;
  placeholder?: string;
  selector?: string;
  index?: number;
}

export interface BrowserAgentElement {
  id: string;
  tag: string;
  role: string | null;
  name: string;
  text: string;
  value: string | null;
  placeholder: string | null;
  disabled: boolean;
  rect: { x: number; y: number; width: number; height: number };
}

export interface BrowserAgentSnapshot {
  url: string;
  title: string;
  elements: BrowserAgentElement[];
  text: string;
}

export interface BrowserAgentResult {
  ok: boolean;
  action: BrowserAgentAction['type'];
  snapshot?: BrowserAgentSnapshot;
  message?: string;
  confirmationRequired?: boolean;
  confirmationReason?: string;
  verification?: { verified: boolean; detail: string; snapshot?: BrowserAgentSnapshot };
}

const SENSITIVE_WORDS = /\b(send|submit|purchase|buy|pay|checkout|delete|remove|publish|post|transfer|confirm|sign in|log in|create account)\b/i;

function targetLabel(target: BrowserAgentTarget): string {
  return [target.role, target.name, target.text, target.label, target.placeholder, target.selector]
    .filter(Boolean)
    .join(' ');
}

function isSensitiveTarget(target: BrowserAgentTarget): boolean {
  return SENSITIVE_WORDS.test(targetLabel(target));
}

function currentTabId(tabId?: string): string | undefined {
  return tabId || BrowserManager.getActiveTab()?.id;
}

function viewFor(tabId?: string) {
  const id = currentTabId(tabId);
  return id ? BrowserManager.getWebContents(id) : undefined;
}

const INSPECT_SCRIPT = (includeHtml: boolean) => `(() => {
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
  return { url: location.href, title: document.title, elements, text: clean(document.body?.innerText).slice(0, 12000), html: ${includeHtml ? 'document.body?.innerHTML?.slice(0, 20000)' : 'undefined'} };
})()`;

const ACTION_SCRIPT = (target: BrowserAgentTarget, operation: 'click' | 'fill' | 'press', value?: string, key?: string) => `(() => {
  const target = ${JSON.stringify(target)};
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
  if (operation === 'fill') {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if ('value' in el && setter) setter.call(el, ${JSON.stringify(value || '')});
    else if (el.isContentEditable) el.textContent = ${JSON.stringify(value || '')};
    else return { ok: false, message: 'Matched element is not editable.' };
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, message: 'Filled matched field.' };
  }
  el.focus(); el.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key || '')}, bubbles: true })); el.dispatchEvent(new KeyboardEvent('keyup', { key: ${JSON.stringify(key || '')}, bubbles: true }));
  return { ok: true, message: 'Pressed key on matched element.' };
})()`;

export class BrowserAgentController {
  async run(action: BrowserAgentAction): Promise<BrowserAgentResult> {
    if (action.type === 'navigate') {
      if (!/^https?:\/\//i.test(action.url)) return { ok: false, action: action.type, message: 'Only http(s) navigation is allowed.' };
      const result = BrowserManager.navigateTo(action.url);
      return { ok: !!result, action: action.type, message: result ? 'Navigation started.' : 'Navigation failed.' };
    }
    const view = viewFor(action.tabId);
    if (!view || view.webContents.isDestroyed()) return { ok: false, action: action.type, message: 'Target tab is unavailable.' };
    if (action.type === 'inspect') {
      const snapshot = await view.webContents.executeJavaScript(INSPECT_SCRIPT(!!action.includeHtml), true) as BrowserAgentSnapshot;
      return { ok: true, action: action.type, snapshot };
    }
    if (action.type === 'scroll') {
      const before = await view.webContents.executeJavaScript('({ y: window.scrollY, height: document.documentElement.scrollHeight })', true) as { y: number; height: number };
      const amount = Math.min(Math.max(Math.abs(action.amount || 600), 50), 1800) * (action.direction === 'up' ? -1 : 1);
      await view.webContents.executeJavaScript(`window.scrollBy({ top: ${amount}, behavior: 'instant' })`, true);
      const after = await view.webContents.executeJavaScript('({ y: window.scrollY, height: document.documentElement.scrollHeight })', true) as { y: number; height: number };
      const moved = before.y !== after.y || before.height !== after.height;
      return { ok: moved, action: action.type, message: moved ? 'Scrolled the active page.' : 'The page did not move.', verification: { verified: moved, detail: `Scroll position changed from ${before.y} to ${after.y}.` } };
    }
    if (action.type === 'click' && isSensitiveTarget(action.target) && !action.confirm) {
      return { ok: false, action: action.type, confirmationRequired: true, confirmationReason: 'This target may submit, publish, delete, authenticate, or cause an external side effect.' };
    }
    const result = await view.webContents.executeJavaScript(
      ACTION_SCRIPT(action.target || {}, action.type, action.type === 'fill' ? action.value : undefined, action.type === 'press' ? action.key : undefined), true
    ) as { ok: boolean; message: string };
    if (!result.ok) return { ...result, action: action.type, verification: { verified: false, detail: result.message } };
    await new Promise((resolve) => setTimeout(resolve, 120));
    const snapshot = await view.webContents.executeJavaScript(INSPECT_SCRIPT(false), true) as BrowserAgentSnapshot;
    const wanted = [action.target?.name, action.target?.text, action.target?.label, action.target?.placeholder].filter(Boolean).join(' ').toLowerCase();
    const matched = Array.isArray(snapshot?.elements) ? snapshot.elements.find((element) => !wanted || `${element.name} ${element.text} ${element.placeholder || ''}`.toLowerCase().includes(wanted)) : undefined;
    const verified = action.type !== 'fill' || !Array.isArray(snapshot?.elements) || matched?.value === action.value;
    return { ...result, ok: verified, action: action.type, snapshot, message: verified ? `${result.message} Verified against a fresh page observation.` : 'Action ran, but verification did not confirm the expected result.', verification: { verified, detail: action.type === 'fill' ? `Expected field value to equal ${JSON.stringify(action.value)}.` : 'Fresh page observation completed.', snapshot } };
  }
}

export default new BrowserAgentController();
