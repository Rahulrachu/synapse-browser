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

function WorkspaceSurface({ panel }: { panel: Exclude<Panel, 'browser'> }) {
  const descriptions: Record<Exclude<Panel, 'browser'>, string> = {
    files: 'Open a project to browse files securely inside the selected project root.',
    editor: 'Select a file from the explorer to open it in the editor.',
    terminal: 'Terminal integration is available from the developer workspace.',
    history: 'Visited pages will appear here after navigation.',
    bookmarks: 'Save pages from the address bar to build your bookmark collection.',
    downloads: 'Downloaded files and their progress will appear here.',
  };
  const icons: Record<Exclude<Panel, 'browser'>, React.ReactNode> = {
    files: <FolderOpen size={20} />, editor: <Code size={20} />, terminal: <Terminal size={20} />,
    history: <History size={20} />, bookmarks: <Bookmark size={20} />, downloads: <Download size={20} />,
  };
  return <section className="flex h-full flex-col items-center justify-center bg-black px-8 text-center" aria-label={`${panelLabels[panel]} workspace`}>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70">{icons[panel]}</div>
    <h2 className="text-sm font-semibold text-white">{panelLabels[panel]}</h2>
    <p className="mt-2 max-w-md text-xs leading-5 text-white/40">{descriptions[panel]}</p>
    <button type="button" className="mt-6 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-xs text-white/75 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">Open workspace</button>
  </section>;
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('synapse.reduceMotion') === 'true');
  const [showDevtools, setShowDevtools] = useState(() => localStorage.getItem('synapse.showDevtools') === 'true');
  const update = (key: string, value: boolean) => { localStorage.setItem(key, String(value)); };
  return <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Settings">
    <section className="glass-panel max-h-full w-full max-w-xl overflow-auto p-6" onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><h2 className="text-base font-semibold text-white">Settings</h2><p className="mt-1 text-xs text-white/40">Preferences are saved locally for this profile.</p></div><button type="button" aria-label="Close Settings" onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><X size={16} /></button></div>
      <div className="space-y-3 pt-5">
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"><span><span className="block text-sm text-white">Reduce motion</span><span className="mt-1 block text-xs text-white/40">Use shorter transitions throughout the workspace.</span></span><input aria-label="Reduce motion" type="checkbox" checked={reduceMotion} onChange={event => { setReduceMotion(event.target.checked); update('synapse.reduceMotion', event.target.checked); }} /></label>
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"><span><span className="block text-sm text-white">Developer tools on startup</span><span className="mt-1 block text-xs text-white/40">Remember the developer-tools preference for the next launch.</span></span><input aria-label="Developer tools on startup" type="checkbox" checked={showDevtools} onChange={event => { setShowDevtools(event.target.checked); update('synapse.showDevtools', event.target.checked); }} /></label>
      </div>
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
  useEffect(() => { if (desktop) void window.electron.invoke('set-browser-view-visibility', panel === 'browser' && !isAIPanelOpen && !settingsOpen); }, [desktop, panel, isAIPanelOpen, settingsOpen]);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const title = useMemo(() => panel === 'browser' ? (activeTab?.title || 'Browser') : panelLabels[panel], [activeTab?.title, panel]);
  const invoke = async (channel: string, ...args: unknown[]) => { if (!desktop) return undefined; try { return await window.electron.invoke(channel, ...args); } catch (error) { console.error(`[Renderer] ${channel} failed`, error); return undefined; } };
  const selectPanel = (next: Panel) => { setSettingsOpen(false); setPanel(next); };
  const sidebarButton = (next: Panel, icon: React.ReactNode, label: string) => <button type="button" aria-label={label} title={label} onClick={() => selectPanel(next)} className={`sidebar-icon ${panel === next ? 'active' : ''} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}>{icon}</button>;
  const navigate = () => { if (addressBarValue.trim()) void invoke('navigate-to', addressBarValue, activeTabId); };

  return <div className="relative flex h-screen w-screen overflow-hidden bg-black text-white select-none">
    <aside className="glass-sidebar z-30 flex w-[72px] shrink-0 flex-col items-center border-r border-white/[0.08] py-5" aria-label="Main navigation">
      <button type="button" aria-label="Open browser" title="Open browser" onClick={() => selectPanel('browser')} className="mb-7 rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-bold text-black">S</span></button>
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
        <button type="button" aria-label="Open Settings" title="Settings" onClick={() => setSettingsOpen(true)} className="sidebar-icon text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><Settings size={19} /></button>
        <button type="button" aria-label="Open Help" title="Help" onClick={() => window.open('https://github.com/Rahulrachu/synapse-browser', '_blank')} className="sidebar-icon text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"><HelpCircle size={19} /></button>
      </div>
    </aside>

    <main className="flex min-w-0 min-h-0 flex-1 flex-col bg-black">
      <header className="glass-toolbar z-20 shrink-0 border-b border-white/[0.08]">
        <div className="flex h-12 items-center gap-3 px-4">
          <div className="flex items-center gap-2 text-xs text-white/45"><Activity size={13} className="text-emerald-300" /><span>{title}</span></div>
          <div className="min-w-0 flex-1 overflow-hidden"><TabBar tabs={tabs} activeTabId={activeTabId} onSelectTab={id => void invoke('set-active-tab', id)} onCloseTab={id => void invoke('close-tab', id)} onNewTab={() => void invoke('create-tab', 'https://www.google.com')} /></div>
          <button type="button" aria-label="Toggle AI panel" onClick={() => { selectPanel('browser'); setIsAIPanelOpen(open => !open); }} className={`rounded-lg border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${isAIPanelOpen && panel === 'browser' ? 'border-white/25 bg-white text-black' : 'border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10'}`}><Bot size={14} className="inline mr-1.5" />AI</button>
        </div>
        <div className="flex items-center gap-3 px-4 pb-3">
          <div className="flex gap-1"><button type="button" aria-label="Back" title="Back" disabled={!activeTab?.canGoBack} onClick={() => void invoke('go-back', activeTabId)} className="toolbar-button" ><ChevronLeft size={17} /></button><button type="button" aria-label="Forward" title="Forward" disabled={!activeTab?.canGoForward} onClick={() => void invoke('go-forward', activeTabId)} className="toolbar-button"><ChevronRight size={17} /></button><button type="button" aria-label="Reload" title="Reload" onClick={() => void invoke('reload', activeTabId)} className="toolbar-button"><RotateCw size={15} /></button></div>
          <div className="address-bar flex min-w-0 flex-1 items-center gap-2"><Search size={14} className="shrink-0 text-white/35" /><input ref={addressBarRef} aria-label="Address bar" className="w-full bg-transparent text-xs text-white/80 outline-none" value={addressBarValue} onChange={event => setAddressBarValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); navigate(); } }} /><button type="button" aria-label="Bookmark current page" title="Bookmark current page" onClick={() => void invoke('add-bookmark', activeTabId)} className="text-white/35 hover:text-white"><Star size={14} /></button><button type="button" aria-label="More browser actions" title="More browser actions" className="text-white/35 hover:text-white"><MoreHorizontal size={14} /></button></div>
        </div>
      </header>
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">{panel === 'browser' ? <BrowserView tabId={activeTabId} /> : <WorkspaceSurface panel={panel} />}</div>
      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-white/[0.08] px-4 text-[10px] uppercase tracking-wider text-white/30"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Ready</span><span>Tabs: {tabs.length}</span></footer>
    </main>
    {isAIPanelOpen && panel === 'browser' && <aside className="glass-panel z-20 flex w-[380px] shrink-0 flex-col rounded-none border-y-0 border-r-0" aria-label="AI workspace"><AIWorkspacePanel /></aside>}
    {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
  </div>;
};
export default MainLayout;
