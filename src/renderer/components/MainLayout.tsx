import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, Bot, Bookmark, ChevronLeft, ChevronRight, Code, Download,
  Files, FolderOpen, HelpCircle, History, Keyboard, MoreHorizontal, Plus,
  RotateCw, Search, Settings, Star, Terminal, X,
} from 'lucide-react';
import TabBar from './TabBar.js';
import BrowserView from './BrowserView.js';
import AIWorkspacePanel from './AIWorkspacePanel.js';

type Tab = {
  id: string; title: string; url: string; favicon?: string; isLoading: boolean;
  canGoBack: boolean; canGoForward: boolean; isMuted?: boolean;
  isPlayingAudio?: boolean; isCrashed?: boolean; pinned?: boolean;
};
type Panel = 'browser' | 'files' | 'editor' | 'terminal' | 'history' | 'bookmarks' | 'downloads';

const panelLabels: Record<Panel, string> = {
  browser: 'Browser', files: 'Files', editor: 'Editor', terminal: 'Terminal',
  history: 'History', bookmarks: 'Bookmarks', downloads: 'Downloads',
};

type WorkspaceFile = { name?: string; path?: string; relativePath?: string; isDirectory?: boolean; type?: string };

type ProviderOption = { value: string; label: string };
const providerOptions: ProviderOption[] = [
  { value: 'openai', label: 'OpenAI' }, { value: 'google', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic Claude' }, { value: 'openrouter', label: 'OpenRouter' },
  { value: 'groq', label: 'Groq' }, { value: 'ollama', label: 'Ollama / local model' },
  { value: 'custom', label: 'Custom OpenAI-compatible' },
];

function ProviderSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, providerOptions.findIndex(option => option.value === value));
  const selected = providerOptions[selectedIndex] || providerOptions[0];
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const choose = (next: string) => { onChange(next); setOpen(false); };
  return <div ref={rootRef} className="synapse-provider-select relative">
    <button type="button" role="combobox" aria-label="AI provider" aria-expanded={open} aria-controls="synapse-provider-options" onClick={() => setOpen(current => !current)} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const direction = event.key === 'ArrowDown' ? 1 : -1; choose(providerOptions[(selectedIndex + direction + providerOptions.length) % providerOptions.length].value); }
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(current => !current); }
    }} className="synapse-provider-trigger flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-white/40"><span>{selected.label}</span><ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} /></button>
    {open && <div id="synapse-provider-options" role="listbox" aria-label="AI provider options" className="synapse-provider-menu absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl p-1">
      {providerOptions.map(option => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => choose(option.value)} className="synapse-provider-option flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs"><span>{option.label}</span>{option.value === value && <span aria-hidden="true">✓</span>}</button>)}
    </div>}
  </div>;
}

function FilesWorkspace() {
  const [projectPath, setProjectPath] = useState(localStorage.getItem('synapse.projectPath') || '');
  const [projectId, setProjectId] = useState(localStorage.getItem('synapse.projectId') || '');
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [message, setMessage] = useState('Choose a project directory to begin.');
  const invoke = async (channel: string, ...args: unknown[]) => window.electron ? window.electron.invoke(channel, ...args) : undefined;
  const openProject = async () => {
    const path = projectPath.trim();
    if (!path) return;
    try {
      const project = await invoke('add-project', path);
      const id = project?.id || project?.project?.id;
      if (!id) throw new Error('Project could not be opened');
      localStorage.setItem('synapse.projectPath', path); localStorage.setItem('synapse.projectId', id); setProjectId(id);
      const result = await invoke('get-project-files', id); setFiles(Array.isArray(result) ? result : result?.files || []); setMessage('Project opened securely.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to open project.'); }
  };
  const refresh = async () => { if (!projectId) return; const result = await invoke('get-project-files', projectId); setFiles(Array.isArray(result) ? result : result?.files || []); };
  return <section className="flex h-full flex-col bg-black" aria-label="Files workspace">
    <div className="flex items-center gap-3 border-b border-white/[0.08] p-5"><FolderOpen size={18} className="text-white/65" /><div><h2 className="text-sm font-semibold">Files</h2><p className="text-[11px] text-white/35">Project-root confined explorer</p></div><button type="button" onClick={() => void refresh()} className="ml-auto rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/65 hover:bg-white/10">Refresh</button></div>
    <div className="flex gap-2 border-b border-white/[0.08] p-4"><input aria-label="Project directory" value={projectPath} onChange={event => setProjectPath(event.target.value)} placeholder="/path/to/project" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs outline-none" onKeyDown={event => { if (event.key === 'Enter') void openProject(); }} /><button type="button" onClick={() => void openProject()} className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black">Open</button></div>
    <p className="border-b border-white/[0.06] px-5 py-3 text-[11px] text-white/40">{message}</p><div className="flex-1 overflow-auto p-4">{files.length ? files.map((file, index) => { const filePath = file.relativePath || file.path || file.name || ''; return <button type="button" key={`${filePath}-${index}`} onClick={() => { localStorage.setItem('synapse.selectedFile', filePath); localStorage.setItem('synapse.selectedProjectId', projectId); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/[0.07]"><span className="text-white/35">{file.isDirectory || file.type === 'directory' ? <FolderOpen size={14} /> : <Files size={14} />}</span>{filePath}</button>; }) : <p className="p-4 text-xs text-white/30">No files loaded.</p>}</div>
  </section>;
}

function EditorWorkspace() {
  const [path, setPath] = useState(localStorage.getItem('synapse.selectedFile') || '');
  const [projectId, setProjectId] = useState(localStorage.getItem('synapse.selectedProjectId') || localStorage.getItem('synapse.projectId') || '');
  const [content, setContent] = useState(''); const [message, setMessage] = useState('Select a file in Files, or enter a relative path.');
  const invoke = async (channel: string, ...args: unknown[]) => window.electron ? window.electron.invoke(channel, ...args) : undefined;
  const load = async () => { if (!projectId || !path.trim()) return; try { const result = await invoke('read-file', projectId, path.trim()); setContent(typeof result === 'string' ? result : result?.content || ''); setMessage('Loaded.'); localStorage.setItem('synapse.selectedFile', path.trim()); localStorage.setItem('synapse.selectedProjectId', projectId); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to read file.'); } };
  const save = async () => { try { await invoke('write-file', projectId, path.trim(), content); setMessage('Saved.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save file.'); } };
  return <section className="flex h-full flex-col bg-black" aria-label="Editor workspace"><div className="flex items-center gap-3 border-b border-white/[0.08] p-5"><Code size={18} className="text-white/65" /><div><h2 className="text-sm font-semibold">Editor</h2><p className="text-[11px] text-white/35">Edit and save files inside the project root</p></div><button type="button" onClick={() => void save()} className="ml-auto rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-black">Save</button></div><div className="flex gap-2 border-b border-white/[0.08] p-4"><input aria-label="Editor project id" value={projectId} onChange={event => setProjectId(event.target.value)} placeholder="Project ID" className="w-32 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs outline-none" /><input aria-label="Editor file path" value={path} onChange={event => setPath(event.target.value)} placeholder="relative/file.txt" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs outline-none" onKeyDown={event => { if (event.key === 'Enter') void load(); }} /><button type="button" onClick={() => void load()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/10">Open</button></div><p className="px-5 py-2 text-[11px] text-white/40">{message}</p><textarea aria-label="Editor content" value={content} onChange={event => setContent(event.target.value)} className="min-h-0 flex-1 resize-none bg-[#050505] p-5 font-mono text-xs leading-5 text-white/80 outline-none" spellCheck={false} /></section>;
}

function TerminalWorkspace() {
  const [command, setCommand] = useState('pwd'); const [output, setOutput] = useState(''); const [running, setRunning] = useState(false);
  const run = async () => { if (!command.trim() || running || !window.electron) return; setRunning(true); try { const result = await window.electron.invoke('terminal-execute', { command }); setOutput([result?.output, result?.error].filter(Boolean).join('\\n') || '(completed with no output)'); } catch (error) { setOutput(error instanceof Error ? error.message : 'Terminal request failed.'); } finally { setRunning(false); } };
  return <section className="flex h-full flex-col bg-black" aria-label="Terminal workspace"><div className="flex items-center gap-3 border-b border-white/[0.08] p-5"><Terminal size={18} className="text-white/65" /><div><h2 className="text-sm font-semibold">Terminal</h2><p className="text-[11px] text-white/35">Execute approved developer commands</p></div></div><pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-[#050505] p-5 font-mono text-xs leading-5 text-emerald-200/75">{output || 'Terminal ready. Try pwd or echo Synapse Browser Test.'}</pre><div className="flex gap-2 border-t border-white/[0.08] p-4"><span className="py-2 font-mono text-xs text-emerald-300">$</span><input aria-label="Terminal command" value={command} onChange={event => setCommand(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void run(); }} className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none" /><button type="button" onClick={() => void run()} disabled={running} className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black disabled:opacity-40">{running ? 'Running…' : 'Run'}</button></div></section>;
}

function WorkspaceSurface({ panel }: { panel: Exclude<Panel, 'browser'> }) {
  if (panel === 'files') return <FilesWorkspace />;
  if (panel === 'editor') return <EditorWorkspace />;
  if (panel === 'terminal') return <TerminalWorkspace />;
  const descriptions: Record<Exclude<Panel, 'browser' | 'files' | 'editor' | 'terminal'>, string> = { history: 'Visited pages will appear here after navigation.', bookmarks: 'Save pages from the address bar to build your bookmark collection.', downloads: 'Downloaded files and their progress will appear here.' };
  const icons: Record<Exclude<Panel, 'browser' | 'files' | 'editor' | 'terminal'>, React.ReactNode> = { history: <History size={20} />, bookmarks: <Bookmark size={20} />, downloads: <Download size={20} /> };
  return <section className="flex h-full flex-col items-center justify-center bg-black px-8 text-center" aria-label={`${panelLabels[panel]} workspace`}><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70">{icons[panel]}</div><h2 className="text-sm font-semibold text-white">{panelLabels[panel]}</h2><p className="mt-2 max-w-md text-xs leading-5 text-white/40">{descriptions[panel]}</p></section>;
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('synapse.reduceMotion') === 'true');
  const [showDevtools, setShowDevtools] = useState(() => localStorage.getItem('synapse.showDevtools') === 'true');
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-4.1-mini');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const update = (key: string, value: boolean) => { localStorage.setItem(key, String(value)); };
  useEffect(() => {
    if (!window.electron) return;
    void window.electron.invoke('agent:get-config').then((config: { configured?: boolean; provider?: string; baseUrl?: string; model?: string }) => { setAiConfigured(Boolean(config?.configured)); setProvider(config?.provider || 'openai'); setBaseUrl(config?.baseUrl || 'https://api.openai.com/v1'); setModel(config?.model || 'gpt-4.1-mini'); }).catch(() => setAiMessage('Unable to read AI configuration.'));
  }, []);
  const resetAIConfig = async () => { if (!window.electron) return; try { await window.electron.invoke('agent:reset-config'); setAiConfigured(false); setApiKey(''); setProvider('openai'); setBaseUrl('https://api.openai.com/v1'); setModel('gpt-4.1-mini'); setAiMessage('AI configuration and saved credential removed.'); } catch (error) { setAiMessage(error instanceof Error ? error.message : 'Unable to reset AI configuration.'); } };
  const saveAIConfig = async () => {
    if (!window.electron) return;
    try {
      const request: { provider: string; apiKey?: string; baseUrl: string; model: string } = { provider, baseUrl, model };
      if (apiKey.trim()) request.apiKey = apiKey.trim();
      const saved = await window.electron.invoke('agent:set-config', request);
      setAiConfigured(Boolean(saved?.configured)); setApiKey(''); setAiMessage(saved?.configured ? 'AI provider saved securely for this profile.' : 'AI provider key cleared.');
    } catch (error) { setAiMessage(error instanceof Error ? error.message : 'Unable to save AI configuration.'); }
  };
  return <div className="synapse-modal-backdrop absolute inset-0 z-20 flex items-center justify-center p-8" role="dialog" aria-modal="true" aria-label="Settings">
    <section className="synapse-surface-raised synapse-modal max-h-full w-full max-w-xl overflow-auto rounded-2xl p-6" onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><h2 className="text-base font-semibold text-white">Settings</h2><p className="mt-1 text-xs text-white/40">Preferences are saved locally for this profile.</p></div><button type="button" aria-label="Close Settings" onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><X size={16} /></button></div>
      <div className="space-y-3 pt-5">
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"><span><span className="block text-sm text-white">Reduce motion</span><span className="mt-1 block text-xs text-white/40">Use shorter transitions throughout the workspace.</span></span><input aria-label="Reduce motion" type="checkbox" checked={reduceMotion} onChange={event => { setReduceMotion(event.target.checked); update('synapse.reduceMotion', event.target.checked); }} /></label>
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"><span><span className="block text-sm text-white">Developer tools on startup</span><span className="mt-1 block text-xs text-white/40">Remember the developer-tools preference for the next launch.</span></span><input aria-label="Developer tools on startup" type="checkbox" checked={showDevtools} onChange={event => { setShowDevtools(event.target.checked); update('synapse.showDevtools', event.target.checked); }} /></label>
      </div>
      <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"><div className="flex items-center justify-between"><div><h3 className="text-sm text-white">AI provider</h3><p className="mt-1 text-xs text-white/40">{aiConfigured ? 'Configured. Enter a new key only when replacing it.' : 'Add an OpenAI-compatible API key to run ORION.'}</p></div><span className={`text-[10px] uppercase tracking-wider ${aiConfigured ? 'text-emerald-300' : 'text-amber-200'}`}>{aiConfigured ? 'Configured' : 'Needs setup'}</span></div><div className="mt-4 space-y-2"><ProviderSelect value={provider} onChange={setProvider} /><input aria-label="OpenAI API key" type="password" autoComplete="off" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder={aiConfigured ? '••••••••  (saved key)' : 'sk-…'} className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-white/30" /><input aria-label="AI base URL" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder="https://api.openai.com/v1" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-white/30" /><input aria-label="AI model" value={model} onChange={event => setModel(event.target.value)} placeholder="gpt-4.1-mini" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-white/30" /></div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-white/35">The key is never returned to the renderer.</span><div className="flex gap-2"><button type="button" onClick={() => void resetAIConfig()} className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/60 hover:bg-white/10">Reset</button><button type="button" onClick={() => void saveAIConfig()} className="rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-black hover:bg-white/90">Save AI settings</button></div></div>{aiMessage && <p className="mt-3 text-[11px] text-white/55">{aiMessage}</p>}</div>
      <div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">Done</button></div>
    </section>
  </div>;
}

const MainLayout: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [addressBarValue, setAddressBarValue] = useState('');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>('browser');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const addressBarRef = useRef<HTMLInputElement>(null);
  const desktop = typeof window !== 'undefined' && Boolean(window.electron);

  useEffect(() => {
    if (!desktop) { const previewTab: Tab = { id: 'preview-tab', url: 'https://www.google.com', title: 'Preview', isLoading: false, canGoBack: false, canGoForward: false }; setTabs([previewTab]); setActiveTabId(previewTab.id); return; }
    let disposed = false;
    const init = async () => {
      try {
        const result = await window.electron.invoke('get-all-tabs');
        if (disposed) return;
        if (result.tabs?.length > 0) { setTabs(result.tabs); setActiveTabId(result.activeTabId || result.tabs[0].id); }
        else { const newTab = await window.electron.invoke('create-tab', 'https://www.google.com'); setTabs(newTab.tabs); setActiveTabId(newTab.activeTabId); }
      } catch (error) { console.error('[Renderer] Failed to initialize tabs', error); }
    };
    void init();
    const unsubscribe = window.electron.on('tabs-updated', (data: { tabs: Tab[]; activeTabId: string | null }) => { setTabs(data.tabs); setActiveTabId(data.activeTabId); });
    return () => { disposed = true; unsubscribe(); };
  }, [desktop]);

  useEffect(() => { const active = tabs.find(tab => tab.id === activeTabId); if (active) setAddressBarValue(active.url); }, [activeTabId, tabs]);
  useEffect(() => { if (desktop) void window.electron.invoke('set-browser-view-visibility', panel === 'browser' && !settingsOpen && !commandOpen); }, [desktop, panel, settingsOpen, commandOpen]);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(value => !value); } if (event.key === 'Escape') setCommandOpen(false); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, []);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const title = useMemo(() => panel === 'browser' ? (activeTab?.title || 'Browser') : panelLabels[panel], [activeTab?.title, panel]);
  const invoke = async (channel: string, ...args: unknown[]) => { if (!desktop) return undefined; try { return await window.electron.invoke(channel, ...args); } catch (error) { console.error(`[Renderer] ${channel} failed`, error); return undefined; } };
  const selectPanel = (next: Panel) => { setSettingsOpen(false); setPanel(next); };
  const sidebarButton = (next: Panel, icon: React.ReactNode, label: string) => <button type="button" aria-label={label} title={label} onClick={() => selectPanel(next)} className={`sidebar-icon synapse-icon-button ${panel === next ? 'active synapse-active-rail' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}>{icon}</button>;
  const navigate = () => { if (addressBarValue.trim()) void invoke('navigate-to', addressBarValue, activeTabId); };
  const runCommand = (command: string) => { setCommandOpen(false); if (command === 'settings') setSettingsOpen(true); else if (command === 'new-tab') void invoke('create-tab', 'https://www.google.com'); else if (command === 'terminal') selectPanel('terminal'); else if (command === 'history') selectPanel('history'); else if (command === 'orion') { selectPanel('browser'); setIsAIPanelOpen(true); } };

  return <div className="synapse-app-shell relative flex h-screen w-screen overflow-hidden text-white select-none">
    <aside className="glass-sidebar synapse-surface z-30 flex w-[72px] shrink-0 flex-col items-center border-y-0 border-l-0 py-5" aria-label="Main navigation">
      <button type="button" aria-label="Open browser" title="Open browser" onClick={() => selectPanel('browser')} className="synapse-brand-anchor mb-7 rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><span className="synapse-brand-mark flex h-8 w-8 items-center justify-center text-lg font-bold text-black">S</span></button>
      <div className="flex flex-1 flex-col gap-2">
        {sidebarButton('browser', <Bot size={20} />, 'Browser and AI')}
        {sidebarButton('files', <Files size={20} />, 'Files')}
        {sidebarButton('editor', <Code size={20} />, 'Editor')}
        {sidebarButton('terminal', <Terminal size={20} />, 'Terminal')}
        {sidebarButton('history', <History size={20} />, 'History')}
        {sidebarButton('bookmarks', <Bookmark size={20} />, 'Bookmarks')}
        {sidebarButton('downloads', <Download size={20} />, 'Downloads')}
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" aria-label="Open Settings" title="Settings" onClick={() => setSettingsOpen(true)} className="sidebar-icon synapse-icon-button text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><Settings size={19} /></button>
        <button type="button" aria-label="Open Help" title="Help" onClick={() => window.open('https://github.com/Rahulrachu/synapse-browser', '_blank')} className="sidebar-icon synapse-icon-button text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><HelpCircle size={19} /></button>
      </div>
    </aside>

    <main className="flex min-w-0 min-h-0 flex-1 flex-col synapse-browser-stage">
      <header className="glass-toolbar synapse-toolbar relative z-20 shrink-0 border-b">
        <div className="relative flex h-12 items-center gap-3 px-4"><div className={`synapse-progress-line ${activeTab?.isLoading ? 'is-loading' : ''}`} aria-hidden="true" />
          <div className="flex items-center gap-2 text-xs text-white/45"><Activity size={13} className="text-emerald-300" /><span>{title}</span></div>
          <div className="min-w-0 flex-1 overflow-hidden"><TabBar tabs={tabs} activeTabId={activeTabId} onSelectTab={id => void invoke('set-active-tab', id)} onCloseTab={id => void invoke('close-tab', id)} onNewTab={() => void invoke('create-tab', 'https://www.google.com')} /></div>
          <button type="button" aria-label="Toggle AI panel" onClick={() => { selectPanel('browser'); setIsAIPanelOpen(open => !open); }} className={`synapse-ai-button rounded-lg border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${isAIPanelOpen && panel === 'browser' ? 'border-white/25 bg-white text-black' : 'border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10'}`}><Bot size={14} className="inline mr-1.5" />AI</button>
        </div>
        <div className="flex items-center gap-3 px-4 pb-3">
          <div className="flex gap-1"><button type="button" aria-label="Back" title="Back" disabled={!activeTab?.canGoBack} onClick={() => void invoke('go-back', activeTabId)} className="toolbar-button" ><ChevronLeft size={17} /></button><button type="button" aria-label="Forward" title="Forward" disabled={!activeTab?.canGoForward} onClick={() => void invoke('go-forward', activeTabId)} className="toolbar-button"><ChevronRight size={17} /></button><button type="button" aria-label="Reload" title="Reload" onClick={() => void invoke('reload', activeTabId)} className="toolbar-button"><RotateCw size={15} /></button></div>
          <div className="address-bar synapse-address flex min-w-0 flex-1 items-center gap-2"><Search size={14} className="shrink-0 text-white/35" /><input ref={addressBarRef} aria-label="Address bar" className="w-full bg-transparent text-xs text-white/80 outline-none" value={addressBarValue} onChange={event => setAddressBarValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); navigate(); } }} /><button type="button" aria-label="Bookmark current page" title="Bookmark current page" onClick={() => void invoke('add-bookmark', activeTabId)} className="text-white/35 hover:text-white"><Star size={14} /></button><button type="button" aria-label="More browser actions" title="More browser actions" className="text-white/35 hover:text-white"><MoreHorizontal size={14} /></button></div>
        </div>
      </header>
      <div className="synapse-browser-stage relative min-h-0 flex-1 overflow-hidden">{panel === 'browser' ? <BrowserView tabId={activeTabId} layoutKey={`${panel}:${isAIPanelOpen}`} /> : <div className="synapse-workspace h-full"><WorkspaceSurface panel={panel} /></div>}</div>
      <footer className="synapse-footer flex h-7 shrink-0 items-center justify-between border-t px-4 text-[10px] uppercase tracking-wider text-white/30"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Ready</span><span>Tabs: {tabs.length}</span></footer>
    </main>
    {isAIPanelOpen && panel === 'browser' && <aside className="synapse-surface synapse-orion-shell z-20 flex w-[380px] shrink-0 flex-col rounded-none border-y-0 border-r-0" aria-label="AI workspace"><AIWorkspacePanel /></aside>}
    {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    {commandOpen && <div className="synapse-modal-backdrop absolute inset-0 z-40 flex items-start justify-center p-[12vh]" role="dialog" aria-modal="true" aria-label="Command palette" onClick={() => setCommandOpen(false)}><div className="synapse-command synapse-modal w-full max-w-xl overflow-hidden rounded-2xl" onClick={event => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4"><Search size={16} className="text-white/40" /><input autoFocus aria-label="Search Synapse commands" placeholder="Search Synapse…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25" /><kbd className="rounded-md border border-white/10 px-2 py-1 text-[9px] text-white/30">ESC</kbd></div><div className="space-y-1 p-2"><button type="button" onClick={() => runCommand('settings')} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"><span className="flex items-center gap-3"><Settings size={15} />Open Settings</span><kbd className="text-[9px] text-white/25">⌘ ,</kbd></button><button type="button" onClick={() => runCommand('new-tab')} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"><span className="flex items-center gap-3"><Plus size={15} />New Tab</span><kbd className="text-[9px] text-white/25">⌘ T</kbd></button><button type="button" onClick={() => runCommand('terminal')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"><Terminal size={15} />Open Terminal</button><button type="button" onClick={() => runCommand('orion')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"><Bot size={15} />Ask ORION</button><button type="button" onClick={() => runCommand('history')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"><History size={15} />Search History</button></div></div></div>}
  </div>;
};
export default MainLayout;
