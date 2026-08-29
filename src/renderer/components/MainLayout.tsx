import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight, RotateCw,
  Settings, HelpCircle, User, Bot, Code, Terminal, Files,
  Bookmark, Star, MoreHorizontal, X, Image as ImageIcon, Link2,
} from 'lucide-react';
import TabBar from './TabBar.js';
import BrowserView from './BrowserView.js';
import AIWorkspacePanel from './AIWorkspacePanel.js';
import NotesPanel from './NotesPanel.js';

interface Tab { id: string; url: string; title: string; favicon?: string; isLoading: boolean; canGoBack: boolean; canGoForward: boolean; isMuted?: boolean; isPlayingAudio?: boolean; isCrashed?: boolean; pinned?: boolean; }
interface HomeShortcut { title: string; url: string; }
interface HomePreferences { background: string; shortcuts: HomeShortcut[]; }
interface APISettings { name: string; baseUrl: string; model: string; enabled: boolean; hasApiKey: boolean; apiKey?: string; }

const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', template: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', template: 'https://www.bing.com/search?q=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', template: 'https://duckduckgo.com/?q=' },
  { id: 'brave', name: 'Brave Search', template: 'https://search.brave.com/search?q=' },
];
const DEFAULT_HOME: HomePreferences = {
  background: '#08090c',
  shortcuts: [
    { title: 'Google', url: 'https://www.google.com' },
    { title: 'YouTube', url: 'https://www.youtube.com' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'ChatGPT', url: 'https://chatgpt.com' },
  ],
};

const MainLayout: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [addressBarValue, setAddressBarValue] = useState('');
  // ORION is a core browser surface, so it must be visible on every launch.
  // Users can still collapse it for the current session with the toggle.
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const [searchEngine, setSearchEngine] = useState(() => localStorage.getItem('synapse-search-engine') || 'google');
  const [homePreferences, setHomePreferences] = useState<HomePreferences>(() => { try { return { ...DEFAULT_HOME, ...JSON.parse(localStorage.getItem('synapse-home') || '{}') }; } catch { return DEFAULT_HOME; } });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<'ai' | 'notes' | 'code' | 'terminal'>('ai');
  const [toolNotice, setToolNotice] = useState<string | null>(null);
  const [apiSettings, setApiSettings] = useState<APISettings>({ name: 'OpenAI-compatible API', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', enabled: true, hasApiKey: false, apiKey: '' });
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const addressBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.electron) {
      const previewTab: Tab = { id: 'preview-tab', url: 'about:blank', title: 'New Tab', isLoading: false, canGoBack: false, canGoForward: false };
      setTabs([previewTab]); setActiveTabId(previewTab.id); return;
    }
    const init = async () => {
      const result = await window.electron.invoke('get-all-tabs');
      if (result.tabs?.length > 0) { setTabs(result.tabs); setActiveTabId(result.activeTabId || result.tabs[0].id); }
      else { const newTab = await window.electron.invoke('create-tab', 'about:blank'); setTabs(newTab.tabs); setActiveTabId(newTab.activeTabId); }
    };
    void init();
    return window.electron.on('tabs-updated', (data: any) => { setTabs(data.tabs); setActiveTabId(data.activeTabId); });
  }, []);

  useEffect(() => { const active = tabs.find(t => t.id === activeTabId); if (active) setAddressBarValue(active.url === 'about:blank' ? '' : active.url); }, [activeTabId, tabs]);
  useEffect(() => { localStorage.setItem('synapse-search-engine', searchEngine); }, [searchEngine]);
  useEffect(() => { localStorage.setItem('synapse-home', JSON.stringify(homePreferences)); }, [homePreferences]);
  useEffect(() => { if (!settingsOpen || !window.electron) return; void window.electron.invoke('ai-settings:get').then((value: APISettings) => setApiSettings({ ...value, apiKey: '' })).catch((error: any) => setApiMessage(error?.message || 'Could not load API settings.')); }, [settingsOpen]);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const selectedEngine = useMemo(() => SEARCH_ENGINES.find(engine => engine.id === searchEngine) || SEARCH_ENGINES[0], [searchEngine]);
  const isHome = !activeTab || /^about:blank(?:#synapse-home)?$/i.test(activeTab.url);
  const navigate = () => {
    const input = addressBarValue.trim();
    if (!input) return;
    const isUrl = /^(https?:\/\/|about:)/i.test(input) || (/^[^\s]+\.[^\s]+$/.test(input) && !/\s/.test(input));
    const target = isUrl ? input : `${selectedEngine.template}${encodeURIComponent(input)}`;
    void window.electron.invoke('navigate-to', target, activeTabId);
  };
  const togglePanel = () => { setActiveTool('ai'); setIsAIPanelOpen(open => !open); };
  const showTool = (tool: 'notes' | 'code' | 'terminal', notice: string) => { setActiveTool(tool); setToolNotice(notice); window.setTimeout(() => setToolNotice(null), 2200); };
  const saveAPISettings = async () => { try { const saved = await window.electron.invoke('ai-settings:save', { name: apiSettings.name, baseUrl: apiSettings.baseUrl, model: apiSettings.model, enabled: apiSettings.enabled, ...(apiSettings.apiKey?.trim() ? { apiKey: apiSettings.apiKey.trim() } : {}) }); setApiSettings({ ...saved, apiKey: '' }); setApiMessage('API settings saved.'); } catch (error: any) { setApiMessage(error?.message || 'Could not save API settings.'); } };
  const testAPISettings = async () => { setApiMessage('Testing API connection…'); try { const result = await window.electron.invoke('ai-settings:test'); setApiMessage(result?.message || 'API test completed.'); } catch (error: any) { setApiMessage(error?.message || 'API test failed.'); } };
  const chooseBackgroundImage = async () => { try { const image = await window.electron.invoke('pick-home-background'); if (image) setHomePreferences(p => ({ ...p, background: image })); } catch (error: any) { setToolNotice(error?.message || 'Could not choose background image.'); } };

  return (
    <div className="flex h-screen w-screen min-w-0 overflow-hidden bg-[#08090c] text-white select-none">
      <aside className="flex w-[72px] shrink-0 flex-col items-center border-r border-white/5 bg-[#0d0f14] py-6">
        <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-lg shadow-black/20"><img src="icon.png" alt="Synapse Browser" className="h-10 w-10 object-cover" /></div>
        <div className="flex flex-1 flex-col gap-4"><button className={`sidebar-icon ${isAIPanelOpen && activeTool === 'ai' ? 'active' : ''}`} aria-label="Toggle AI panel" onClick={togglePanel} title="ORION AI agent"><Bot size={22} /></button><button className={`sidebar-icon ${activeTool === 'notes' ? 'active' : ''}`} aria-label="Open notes" onClick={() => showTool('notes', 'Notes workspace opened')} title="Notes workspace"><Files size={22} /></button><button className={`sidebar-icon ${activeTool === 'code' ? 'active' : ''}`} aria-label="Open developer tools" onClick={() => { showTool('code', 'Developer tools opened'); void window.electron?.invoke('open-devtools', activeTabId); }} title="Developer tools"><Code size={22} /></button><button className={`sidebar-icon ${activeTool === 'terminal' ? 'active' : ''}`} aria-label="Open terminal" onClick={() => showTool('terminal', 'Terminal workspace ready')} title="Terminal workspace"><Terminal size={22} /></button></div>
        <div className="mt-auto flex flex-col gap-4"><button className={`sidebar-icon ${settingsOpen ? 'active' : 'text-gray-500'}`} aria-label="Settings" onClick={() => setSettingsOpen(open => !open)} title="Settings"><Settings size={20} /></button><button className="sidebar-icon text-gray-500" aria-label="Help" onClick={() => setToolNotice('Synapse Browser help: use the address bar to browse or search, and ORION to run tasks.')} title="Help"><HelpCircle size={20} /></button><button className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/10 bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold" aria-label="Profile" onClick={() => setToolNotice('Profile management is coming soon.')} title="Profile"><User size={16} /></button></div>
      </aside>

      <main className="flex min-w-0 min-h-0 flex-1 flex-col bg-[#0d0f14]">
        <header className="flex h-24 shrink-0 flex-col border-b border-white/5">
          <div className="flex min-w-0 items-center gap-3 px-4 pt-2"><div className="flex w-16 shrink-0 items-center gap-2"><button aria-label="Close window" title="Close" onClick={() => void window.electron?.invoke('window-control', 'close')} className="h-3 w-3 rounded-full bg-[#ff5f57] transition hover:brightness-125" /><button aria-label="Minimize window" title="Minimize" onClick={() => void window.electron?.invoke('window-control', 'minimize')} className="h-3 w-3 rounded-full bg-[#febc2e] transition hover:brightness-125" /><button aria-label="Maximize window" title="Maximize or restore" onClick={() => void window.electron?.invoke('window-control', 'maximize')} className="h-3 w-3 rounded-full bg-[#28c840] transition hover:brightness-125" /></div><div className="min-w-0 flex-1 overflow-hidden"><TabBar tabs={tabs} activeTabId={activeTabId} onSelectTab={id => void window.electron.invoke('set-active-tab', id)} onCloseTab={id => void window.electron.invoke('close-tab', id)} onNewTab={() => void window.electron.invoke('create-tab', 'about:blank')} /></div><button type="button" aria-label="Toggle ORION AI panel" onClick={togglePanel} className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${isAIPanelOpen ? 'border-synapse-accent/50 bg-synapse-accent/15 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}><Bot size={14} /><span className="hidden sm:inline">AI Agent</span></button></div>
          <div className="flex min-w-0 items-center gap-3 px-4 py-2"><div className="flex shrink-0 gap-1"><button className="rounded p-1.5 text-gray-400 hover:bg-white/5 disabled:opacity-30" disabled={!activeTab?.canGoBack} onClick={() => void window.electron.invoke('go-back', activeTabId)}><ChevronLeft size={18} /></button><button className="rounded p-1.5 text-gray-400 hover:bg-white/5 disabled:opacity-30" disabled={!activeTab?.canGoForward} onClick={() => void window.electron.invoke('go-forward', activeTabId)}><ChevronRight size={18} /></button><button className="rounded p-1.5 text-gray-400 hover:bg-white/5" onClick={() => void window.electron.invoke('reload', activeTabId)}><RotateCw size={18} /></button></div><div className="address-bar flex min-w-0 flex-1 items-center gap-2"><div className="text-synapse-accent"><Bookmark size={14} /></div><input ref={addressBarRef} className="w-full min-w-0 bg-transparent text-xs text-gray-300 outline-none" placeholder={`Search with ${selectedEngine.name} or enter address`} value={addressBarValue} onChange={e => setAddressBarValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && navigate()} /><div className="flex shrink-0 gap-2 text-gray-500"><button aria-label="Bookmark current page" title="Bookmark current page" onClick={() => setToolNotice('Bookmark action is ready for the current page.')} className="hover:text-yellow-500"><Star size={14} /></button><button aria-label="Address bar actions" title="Address bar actions" onClick={() => setSettingsOpen(open => !open)} className="hover:text-white"><MoreHorizontal size={14} /></button></div></div></div>
        </header>
        <div className="relative min-h-0 flex-1 bg-black"><BrowserView tabId={activeTabId} isHome={isHome} homePreferences={homePreferences} onOpenShortcut={url => { setAddressBarValue(url); void window.electron.invoke('navigate-to', url, activeTabId); }} /></div>
        <footer className="flex h-8 shrink-0 items-center justify-between border-t border-white/5 bg-[#08090c] px-4 text-[10px] uppercase tracking-wider text-gray-500"><div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-green-500" /><span>Ready</span></div><div className="flex items-center gap-4"><span className="hidden sm:inline">Secure Connection</span><span>Tabs: {tabs.length}</span><span>Build v1.1.1</span></div></footer>
      </main>

      {isAIPanelOpen && <aside className="flex w-[clamp(280px,30vw,380px)] min-w-[280px] shrink-0 flex-col border-l border-white/5 bg-[#0d0f14]">{activeTool === 'ai' ? <AIWorkspacePanel /> : activeTool === 'notes' ? <NotesPanel /> : <div className="flex h-full flex-col p-5 text-white"><h2 className="text-sm font-semibold">{activeTool === 'code' ? 'Developer tools' : 'Terminal'}</h2><p className="mt-2 text-xs leading-5 text-white/50">{activeTool === 'code' ? 'Chromium DevTools has been opened for the active tab.' : 'Terminal workspace is ready for the next command.'}</p>{activeTool === 'terminal' && <button onClick={() => setToolNotice('Use the integrated terminal workspace from the Terminal panel.')} className="mt-5 rounded-lg bg-white/10 px-3 py-2 text-left text-xs text-white hover:bg-white/15">Open terminal workspace</button>}</div>}</aside>}
      {toolNotice && <div role="status" className="absolute bottom-12 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-white/10 bg-[#20242d] px-4 py-2 text-xs text-white shadow-xl">{toolNotice}</div>}
      {settingsOpen && <div className="absolute bottom-14 left-[82px] z-50 max-h-[80vh] w-[min(460px,calc(100vw-110px))] overflow-y-auto rounded-xl border border-white/10 bg-[#171a22] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Browser settings</h2><button onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={16} /></button></div>
        <section className="border-b border-white/10 pb-4"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">AI API</h3><p className="mb-3 text-[11px] leading-4 text-white/45">These values are saved in the desktop app and used by ORION. Your existing key is never shown back in the UI.</p><label className="mb-1 block text-xs text-gray-400">Provider name</label><input value={apiSettings.name} onChange={e => setApiSettings(p => ({ ...p, name: e.target.value }))} className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><label className="mb-1 block text-xs text-gray-400">API key {apiSettings.hasApiKey ? '(saved — leave blank to keep it)' : ''}</label><input type="password" autoComplete="off" value={apiSettings.apiKey || ''} onChange={e => setApiSettings(p => ({ ...p, apiKey: e.target.value }))} placeholder={apiSettings.hasApiKey ? 'Saved key retained' : 'sk-…'} className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><label className="mb-1 block text-xs text-gray-400">Base URL</label><input value={apiSettings.baseUrl} onChange={e => setApiSettings(p => ({ ...p, baseUrl: e.target.value }))} placeholder="https://api.openai.com/v1" className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><label className="mb-1 block text-xs text-gray-400">Model</label><input value={apiSettings.model} onChange={e => setApiSettings(p => ({ ...p, model: e.target.value }))} placeholder="gpt-4.1-mini" className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><label className="mb-3 flex items-center gap-2 text-xs text-white/70"><input type="checkbox" checked={apiSettings.enabled} onChange={e => setApiSettings(p => ({ ...p, enabled: e.target.checked }))} /> Enable AI provider</label><div className="flex gap-2"><button onClick={() => void saveAPISettings()} className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black hover:bg-white/90">Save API settings</button><button onClick={() => void testAPISettings()} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10">Test connection</button></div>{apiMessage && <p className="mt-2 text-[11px] text-white/60">{apiMessage}</p>}</section>
        <section className="border-b border-white/10 py-4"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">Search engine</h3><select value={searchEngine} onChange={e => setSearchEngine(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">{SEARCH_ENGINES.map(engine => <option key={engine.id} value={engine.id}>{engine.name}</option>)}</select></section>
        <section className="pt-4"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">Home tab</h3><div className="mb-2 flex gap-2"><input type="text" value={homePreferences.background.startsWith('data:') ? '' : homePreferences.background} onChange={e => setHomePreferences(p => ({ ...p, background: e.target.value }))} placeholder="Background color or image URL" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><button onClick={() => void chooseBackgroundImage()} className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2 py-2 text-xs text-white hover:bg-white/10"><ImageIcon size={14} /> Choose image</button></div>{homePreferences.background.startsWith('data:') && <p className="mb-2 text-[11px] text-emerald-300">Custom local image selected and saved for the home tab.</p>}<div className="space-y-2">{homePreferences.shortcuts.map((shortcut, index) => <div key={`${shortcut.url}-${index}`} className="flex gap-2"><input value={shortcut.title} onChange={e => setHomePreferences(p => ({ ...p, shortcuts: p.shortcuts.map((item, i) => i === index ? { ...item, title: e.target.value } : item) }))} className="w-1/3 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-xs text-white" placeholder="Name" /><input value={shortcut.url} onChange={e => setHomePreferences(p => ({ ...p, shortcuts: p.shortcuts.map((item, i) => i === index ? { ...item, url: e.target.value } : item) }))} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-xs text-white" placeholder="https://example.com" /><button onClick={() => setHomePreferences(p => ({ ...p, shortcuts: p.shortcuts.filter((_, i) => i !== index) }))} aria-label="Remove shortcut" className="text-gray-500 hover:text-red-400"><X size={15} /></button></div>)}</div><button onClick={() => setHomePreferences(p => ({ ...p, shortcuts: [...p.shortcuts, { title: 'New shortcut', url: 'https://' }] }))} className="mt-3 flex items-center gap-1 text-xs text-synapse-accent hover:underline"><Plus size={14} /> Add shortcut</button></section>
      </div>}
    </div>
  );
};
export default MainLayout;
