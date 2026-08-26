import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, ChevronLeft, ChevronRight, RotateCw, 
  Settings, HelpCircle, User, Bot, Code, Terminal, Files, 
  History, Bookmark, Star, MoreHorizontal, X, Pin, Copy, Volume2, VolumeX
} from 'lucide-react';
import TabBar from './TabBar.js';
import BrowserView from './BrowserView.js';
import AIWorkspacePanel from './AIWorkspacePanel.js';

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isMuted?: boolean;
  isPlayingAudio?: boolean;
  isCrashed?: boolean;
  pinned?: boolean;
}

const MainLayout: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [addressBarValue, setAddressBarValue] = useState('');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const addressBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.electron) {
      const previewTab: Tab = { id: 'preview-tab', url: 'https://www.google.com', title: 'Preview', isLoading: false, canGoBack: false, canGoForward: false };
      setTabs([previewTab]);
      setActiveTabId(previewTab.id);
      return;
    }
    const init = async () => {
      const result = await window.electron.invoke('get-all-tabs');
      if (result.tabs?.length > 0) {
        setTabs(result.tabs);
        setActiveTabId(result.activeTabId || result.tabs[0].id);
      } else {
        const newTab = await window.electron.invoke('create-tab', 'https://www.google.com');
        setTabs(newTab.tabs);
        setActiveTabId(newTab.activeTabId);
      }
    };
    init();
    return window.electron.on('tabs-updated', (data: any) => {
      setTabs(data.tabs);
      setActiveTabId(data.activeTabId);
    });
  }, []);

  useEffect(() => {
    const active = tabs.find(t => t.id === activeTabId);
    if (active) setAddressBarValue(active.url);
  }, [activeTabId, tabs]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="flex h-screen w-screen bg-[#08090c] text-white overflow-hidden select-none">
      {/* Sidebar - Exact Image 1 Match */}
      <div className="w-[72px] flex flex-col items-center py-6 border-r border-white/5 bg-[#0d0f14]">
        <div className="mb-8 p-2 bg-synapse-accent/10 rounded-xl">
          <div className="w-8 h-8 bg-synapse-accent rounded-lg flex items-center justify-center shadow-lg shadow-synapse-accent/20">
            <span className="font-bold text-lg text-white">S</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          <div className={`sidebar-icon ${isAIPanelOpen ? 'active' : ''}`} onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}>
            <Bot size={22} />
          </div>
          <div className="sidebar-icon"><Files size={22} /></div>
          <div className="sidebar-icon"><Code size={22} /></div>
          <div className="sidebar-icon"><Terminal size={22} /></div>
        </div>

        <div className="flex flex-col gap-4 mt-auto">
          <div className="sidebar-icon text-gray-500"><Settings size={20} /></div>
          <div className="sidebar-icon text-gray-500"><HelpCircle size={20} /></div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold border-2 border-white/10">
            A
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#0d0f14]">
        {/* Top Bar - Tabs & Controls */}
        <div className="h-24 flex flex-col border-b border-white/5">
          {/* Mac-style Window Controls & Tabs */}
          <div className="flex items-center px-4 pt-2 gap-4">
            <div className="flex gap-2 w-16">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabBar 
                tabs={tabs} 
                activeTabId={activeTabId} 
                onSelectTab={(id) => window.electron.invoke('set-active-tab', id)}
                onCloseTab={(id) => window.electron.invoke('close-tab', id)}
                onNewTab={() => window.electron.invoke('create-tab', 'about:blank')}
              />
            </div>
            <button
              type="button"
              aria-label="Toggle ORION AI panel"
              onClick={() => setIsAIPanelOpen((open) => !open)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${isAIPanelOpen ? 'border-synapse-accent/50 bg-synapse-accent/15 text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}`}
            >
              <Bot size={14} />
              <span>AI Agent</span>
            </button>
          </div>

          {/* Address Bar Area */}
          <div className="flex items-center px-4 py-2 gap-3">
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 disabled:opacity-30" disabled={!activeTab?.canGoBack} onClick={() => window.electron.invoke('navigate-back', activeTabId)}>
                <ChevronLeft size={18} />
              </button>
              <button className="p-1.5 hover:bg-white/5 rounded text-gray-400 disabled:opacity-30" disabled={!activeTab?.canGoForward} onClick={() => window.electron.invoke('navigate-forward', activeTabId)}>
                <ChevronRight size={18} />
              </button>
              <button className="p-1.5 hover:bg-white/5 rounded text-gray-400" onClick={() => window.electron.invoke('reload-tab', activeTabId)}>
                <RotateCw size={18} />
              </button>
            </div>

            <div className="flex-1 address-bar flex items-center gap-2">
              <div className="text-synapse-accent"><Bookmark size={14} /></div>
              <input 
                ref={addressBarRef}
                className="bg-transparent border-none outline-none w-full text-xs text-gray-300"
                value={addressBarValue}
                onChange={(e) => setAddressBarValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && window.electron.invoke('navigate-to', addressBarValue)}
              />
              <div className="text-gray-500 flex gap-2">
                <Star size={14} className="hover:text-yellow-500 cursor-pointer" />
                <MoreHorizontal size={14} className="hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* Browser Surface */}
        <div className="flex-1 min-h-0 relative bg-black">
          <BrowserView tabId={activeTabId} isHome={activeTab?.url === 'about:blank'} />
        </div>

        {/* Status Bar */}
        <div className="h-8 border-t border-white/5 bg-[#08090c] px-4 flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Ready</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Secure Connection</span>
            <span>Tabs: {tabs.length}</span>
            <span>Build v1.0.0</span>
          </div>
        </div>
      </div>

      {/* AI Workspace Panel - Image 1 Match */}
      {isAIPanelOpen && (
        <div className="w-[380px] border-l border-white/5 bg-[#0d0f14] flex flex-col">
          <AIWorkspacePanel />
        </div>
      )}
    </div>
  );
};

export default MainLayout;
