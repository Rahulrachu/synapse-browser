import { app, ipcMain } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import BrowserManager from './BrowserManager.js';
import Storage from './Storage.js';
import PlanningEngine from '../engine/PlanningEngine.js';

export type AgentEvent = { runId: string; type: 'plan' | 'tool-start' | 'tool-result' | 'assistant' | 'error' | 'done'; message: string; data?: unknown; at: number };
type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
type ChatMessage = { role: string; content: string | null; tool_call_id?: string; tool_calls?: ToolCall[] };

const MAX_STEPS = 12;
const MAX_OUTPUT = 24000;
const SAFE_COMMAND = /^(pwd|ls(?:\s+[-\w./]+)?|find\s+[-\w./]+(?:\s+-maxdepth\s+\d+)?|git\s+(status|diff|log|branch)(?:\s+[-\w./]+)*|npm\s+(test|run\s+(build|test|lint))(?:\s+[-\w./]+)*|pnpm\s+(test|run\s+(build|test|lint))(?:\s+[-\w./]+)*)$/;
const tools = [
  { type: 'function', function: { name: 'open_page', description: 'Navigate the active browser tab to an http(s) URL.', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'], additionalProperties: false } } },
  { type: 'function', function: { name: 'read_page', description: 'Read the active page URL, title, and visible text.', parameters: { type: 'object', properties: { maxChars: { type: 'number' } }, additionalProperties: false } } },
  { type: 'function', function: { name: 'list_workspace', description: 'List files in a registered project workspace.', parameters: { type: 'object', properties: { projectId: { type: 'string' }, relativePath: { type: 'string' } }, required: ['projectId'], additionalProperties: false } } },
  { type: 'function', function: { name: 'read_workspace_file', description: 'Read a text file in a registered project workspace.', parameters: { type: 'object', properties: { projectId: { type: 'string' }, filePath: { type: 'string' } }, required: ['projectId', 'filePath'], additionalProperties: false } } },
  { type: 'function', function: { name: 'write_workspace_file', description: 'Create or overwrite a text file in a registered project workspace.', parameters: { type: 'object', properties: { projectId: { type: 'string' }, filePath: { type: 'string' }, content: { type: 'string' } }, required: ['projectId', 'filePath', 'content'], additionalProperties: false } } },
  { type: 'function', function: { name: 'run_safe_command', description: 'Run a read-only or test/build command in the registered project workspace. Commands are allowlisted.', parameters: { type: 'object', properties: { projectId: { type: 'string' }, command: { type: 'string' } }, required: ['projectId', 'command'], additionalProperties: false } } },
  { type: 'function', function: { name: 'save_note', description: 'Persist a useful finding as a Synapse workspace note.', parameters: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title', 'content'], additionalProperties: false } } },
] as const;

function emit(window: any, event: AgentEvent) { if (window && !window.isDestroyed()) window.webContents.send('agent:event', event); }
function trim(value: unknown) { const text = typeof value === 'string' ? value : JSON.stringify(value); return text.length > MAX_OUTPUT ? text.slice(0, MAX_OUTPUT) + '\n[output truncated]' : text; }
function safeRelative(filePath: string) { const normalized = path.posix.normalize(filePath.replaceAll('\\', '/')); if (normalized.startsWith('../') || normalized === '..' || path.posix.isAbsolute(normalized)) throw new Error('Path must remain inside the project workspace'); return normalized; }

export class AgentRuntime {
  private active = new Map<string, AbortController>();
  private window: any;
  constructor(window: any) { this.window = window; ipcMain.handle('agent:run', (_, request) => this.start(request)); ipcMain.handle('agent:cancel', (_, runId: string) => this.cancel(runId)); ipcMain.handle('agent:history', () => Storage.get('agent-runs')); }
  start(request: { goal: string; providerId?: string; model?: string; projectId?: string }) { const runId = randomUUID(); void this.run(request, runId).catch(() => undefined); return { runId, status: 'started' }; }
  cancel(runId: string) { const controller = this.active.get(runId); if (!controller) return false; controller.abort(); return true; }
  private async projects() { return (await Storage.get('projects')) || []; }
  private async projectRoot(projectId: string) { const project = (await this.projects()).find((p: any) => p.id === projectId); if (!project?.rootPath) throw new Error('A registered projectId is required for workspace tools'); return project.rootPath; }
  private async tool(name: string, args: any, signal: AbortSignal): Promise<string> {
    if (signal.aborted) throw new Error('Agent run cancelled');
    if (name === 'open_page') { const url = String(args.url || ''); if (!/^https?:\/\//i.test(url)) throw new Error('Only http(s) URLs are allowed'); if (!BrowserManager.navigateTo(url)) throw new Error('No active browser tab'); return `Navigation started: ${url}`; }
    if (name === 'read_page') { const tab = BrowserManager.getActiveTab(); const view: any = tab && BrowserManager.getWebContents(tab.id); if (!view) throw new Error('No active browser tab'); const result = await view.webContents.executeJavaScript(`({url: location.href, title: document.title, text: (document.body?.innerText || '').slice(0, ${Math.min(Number(args.maxChars) || 16000, MAX_OUTPUT)})})`, true); return trim(result); }
    if (name === 'save_note') { const note = { id: randomUUID(), title: String(args.title), content: String(args.content), createdAt: Date.now(), updatedAt: Date.now() }; const notes = (await Storage.get('notes')) || []; await Storage.set('notes', [...notes, note]); return `Saved note ${note.id}`; }
    const root = await this.projectRoot(String(args.projectId));
    if (name === 'list_workspace') { const relative = safeRelative(String(args.relativePath || '.')); const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true }); return entries.map(e => `${e.isDirectory() ? 'dir' : 'file'} ${path.posix.join(relative, e.name)}`).join('\n'); }
    if (name === 'read_workspace_file') { const file = path.join(root, safeRelative(String(args.filePath))); return trim(await fs.readFile(file, 'utf8')); }
    if (name === 'write_workspace_file') { const file = path.join(root, safeRelative(String(args.filePath))); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, String(args.content), 'utf8'); return `Wrote ${args.filePath}`; }
    if (name === 'run_safe_command') { const command = String(args.command).trim(); if (!SAFE_COMMAND.test(command)) throw new Error('Command is not allowlisted; only read-only git, listing, test, build, and lint commands are permitted'); const { execFile } = await import('node:child_process'); return await new Promise<string>((resolve, reject) => { const child = execFile('/bin/sh', ['-lc', command], { cwd: root, timeout: 120000, maxBuffer: MAX_OUTPUT * 2 }, (error, stdout, stderr) => { if (error && !stdout && !stderr) reject(error); else resolve(trim(`${stdout}${stderr ? `\n${stderr}` : ''}`)); }); signal.addEventListener('abort', () => child.kill('SIGTERM'), { once: true }); }); }
    throw new Error(`Unknown tool: ${name}`);
  }
    async run(request: { goal: string; providerId?: string; model?: string; projectId?: string }, existingRunId?: string) {
    const runId = existingRunId || randomUUID(); const controller = new AbortController();
 this.active.set(runId, controller); const history = ((await Storage.get('agent-runs')) || []) as any[];
    const log = (type: AgentEvent['type'], message: string, data?: unknown) => emit(this.window, { runId, type, message, data, at: Date.now() });
    const apiKey = process.env.OPENAI_API_KEY; const base = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'; if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    const messages: ChatMessage[] = [{ role: 'system', content: 'You are Synapse Agent, an autonomous browser/developer workspace assistant. Make progress by calling tools. Use the active page for research, registered project tools for code, and save durable reports as notes or files. Never claim an action you did not execute. Keep tool calls focused and stop when the goal is complete.' }, { role: 'user', content: request.goal }];
    const plan = PlanningEngine.createPlan(request.goal, ['Understand the goal and gather context', 'Execute browser, research, or workspace actions', 'Verify results and summarize deliverables']); log('plan', 'Plan created', plan);
    try {
      for (let step = 0; step < MAX_STEPS; step++) { if (controller.signal.aborted) throw new Error('Agent run cancelled'); const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: request.model || 'gpt-4o-mini', messages, tools, tool_choice: 'auto', temperature: 0.2 }), signal: controller.signal }); if (!response.ok) throw new Error(`AI provider error ${response.status}: ${await response.text()}`); const data: any = await response.json(); const message = data.choices?.[0]?.message; if (!message) throw new Error('AI provider returned no message'); messages.push(message); if (!message.tool_calls?.length) { log('assistant', message.content || 'Task completed'); break; } for (const call of message.tool_calls as ToolCall[]) { const args = JSON.parse(call.function.arguments || '{}'); log('tool-start', `${call.function.name} started`, args); try { const result = await this.tool(call.function.name, args, controller.signal); messages.push({ role: 'tool', tool_call_id: call.id, content: result }); log('tool-result', `${call.function.name} completed`, result); } catch (error: any) { const result = `Tool failed: ${error?.message || String(error)}`; messages.push({ role: 'tool', tool_call_id: call.id, content: result }); log('error', result); } } }
      const record = { runId, goal: request.goal, status: 'completed', completedAt: Date.now() }; await Storage.set('agent-runs', [...history.slice(-49), record]); log('done', 'Agent run completed', record); return record;
    } catch (error: any) { const record = { runId, goal: request.goal, status: controller.signal.aborted ? 'cancelled' : 'failed', error: error?.message || String(error), completedAt: Date.now() }; await Storage.set('agent-runs', [...history.slice(-49), record]); log(controller.signal.aborted ? 'done' : 'error', record.error, record); throw error; } finally { this.active.delete(runId); }
  }
}
export default AgentRuntime;
app.once('will-quit', () => undefined);
