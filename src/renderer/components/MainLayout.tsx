import React, { useEffect, useRef, useState } from 'react';
import { 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Layout, 
  Settings, 
  User, 
  Bot,
  Code,
  Terminal,
  Files,
  History,
  Bookmark
} from 'lucide-react';
import AIWorkspacePanel from './AIWorkspacePanel.js';
import TabBar from './TabBar.js';
import BrowserView from './BrowserView.js';

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

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const [addressBarValue, setAddressBarValue] = useState('');
  const addressBarRef = useRef<HTMLInputElement>(null);

  // Initialize tabs on mount
  useEffect(() => {
    const initializeTabs = async () => {
      try {
        const result = await window.electron.invoke('get-all-tabs');
        if (result.tabs && result.tabs.length > 0) {
          setTabs(result.tabs);
          setActiveTabId(result.activeTabId || result.tabs[0].id);
        } else {
          // Create first tab if none exist
          const newTab = await window.electron.invoke('create-tab', 'https://www.google.com');
          setTabs(newTab.tabs);
          setActiveTabId(newTab.activeTabId);
        }
      } catch (error) {
        console.error('Failed to initialize tabs:', error);
      }
    };

    initializeTabs();
  }, []);

  // Listen for tab updates
  useEffect(() => {
    const unsubscribe = window.electron.on('tabs-updated', (data: any) => {
      setTabs(data.tabs);
      setActiveTabId(data.activeTabId);
    });

    return unsubscribe;
  }, []);

  // Update the omnibox from the active, real WebContentsView-backed tab.
  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) setAddressBarValue(activeTab.url);
  }, [activeTabId, tabs]);

  // Browser shortcuts are handled at the application shell so they work regardless of page focus.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (event.key === 'F12') {
        event.preventDefault();
        window.electron.invoke('open-devtools', activeTabId || undefined);
        return;
      }
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        handleGoBack();
        return;
      }
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        handleGoForward();
        return;
      }
      if (!modifier) return;
      if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        addressBarRef.current?.focus();
        addressBarRef.current?.select();
      } else if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        if (event.shiftKey) handleReopenClosedTab();
        else handleCreateTab();
      } else if (event.key.toLowerCase() === 'w') {
        event.preventDefault();
        if (activeTabId) handleCloseTab(activeTabId);
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (event.shiftKey) window.electron.invoke('reload-hard');
        else handleReload();
      } else if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        if (activeTabId) window.electron.invoke('add-bookmark', tabs.find(t => t.id === activeTabId)?.title || '', addressBarValue);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        const query = window.prompt('Find in page');
        if (query) window.electron.invoke('find-in-page', query);
      } else if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        window.electron.invoke('print-page');
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        window.electron.invoke('save-page-pdf');
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        window.electron.invoke('zoom-in');
      } else if (event.key === '-') {
        event.preventDefault();
        window.electron.invoke('zoom-out');
      } else if (event.key === '0') {
        event.preventDefault();
        window.electron.invoke('zoom-reset');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTabId, addressBarValue, tabs]);

  const handleCreateTab = async () => {
    try {
      const result = await window.electron.invoke('create-tab', 'about:blank');
      setTabs(result.tabs);
      setActiveTabId(result.activeTabId);
    } catch (error) {
      console.error('Failed to create tab:', error);
    }
  };

  const handleCloseTab = async (tabId: string) => {
    try {
      const result = await window.electron.invoke('close-tab', tabId);
      setTabs(result.tabs);
      setActiveTabId(result.activeTabId);
    } catch (error) {
      console.error('Failed to close tab:', error);
    }
  };

  const handleSelectTab = async (tabId: string) => {
    try {
      const result = await window.electron.invoke('set-active-tab', tabId);
      setActiveTabId(result.activeTabId);
    } catch (error) {
      console.error('Failed to select tab:', error);
    }
  };

  const handleNavigate = async (url: string) => {
    try {
      await window.electron.invoke('navigate-to', url);
    } catch (error) {
      console.error('Failed to navigate:', error);
    }
  };

  const handleAddressBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressBarValue.trim()) {
      handleNavigate(addressBarValue);
    }
  };

  const handleGoBack = async () => {
    try {
      await window.electron.invoke('go-back');
    } catch (error) {
      console.error('Failed to go back:', error);
    }
  };

  const handleGoForward = async () => {
    try {
      await window.electron.invoke('go-forward');
    } catch (error) {
      console.error('Failed to go forward:', error);
    }
  };

  const handleReload = async () => {
    try {
      await window.electron.invoke('reload');
    } catch (error) {
      console.error('Failed to reload:', error);
    }
  };

  const handleReopenClosedTab = async () => {
    const result = await window.electron.invoke('reopen-closed-tab');
    setTabs(result.tabs || []);
    setActiveTabId(result.activeTabId || null);
  };

  const handleDuplicateTab = async (tabId: string) => {
    const result = await window.electron.invoke('duplicate-tab', tabId);
    setTabs(result.tabs || []);
    setActiveTabId(result.activeTabId || result.newTabId || null);
  };

  const handleToggleMute = async (tabId: string) => {
    await window.electron.invoke('toggle-tab-mute', tabId);
  };

  const handlePinTab = async (tabId: string, pinned: boolean) => {
    await window.electron.invoke('pin-tab', tabId, pinned);
  };

  const handleMoveTab = async (tabId: string, targetIndex: number) => {
    const result = await window.electron.invoke('move-tab', tabId, targetIndex);
    setTabs(result.tabs || []);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 dark:bg-neutral-950">
      {/* Sidebar */}
      <aside className="w-64 h-screen liquid-glass border-r border-glass-border flex flex-col">
        <div className="p-4 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          <SidebarItem icon={<Bot size={18} />} label="AI Workspace" active={true} />
          <SidebarItem icon={<Search size={18} />} label="Search" />
          <SidebarItem icon={<Files size={18} />} label="Explorer" />
          <SidebarItem icon={<Code size={18} />} label="Editor" />
          <SidebarItem icon={<Terminal size={18} />} label="Terminal" />
          
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Personal
          </div>
          <SidebarItem icon={<Bookmark size={18} />} label="Bookmarks" />
          <SidebarItem icon={<History size={18} />} label="History" />
        </nav>

        <div className="p-4 border-t border-glass-border">
          <SidebarItem icon={<Settings size={18} />} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="h-12 flex items-center gap-4 px-4 mac-toolbar">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleGoBack}
              className="mac-button hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleGoForward}
              className="mac-button hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={handleReload}
              className="mac-button hover:bg-black/5 dark:hover:bg-white/5"
            >
              <RotateCw size={16} />
            </button>
          </div>

          <form onSubmit={handleAddressBarSubmit} className="flex-1 max-w-2xl relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={14} />
            </div>
            <input
              ref={addressBarRef}
              type="text"
              value={addressBarValue}
              onChange={(e) => setAddressBarValue(e.target.value)}
              placeholder="Search or enter address"
              className="w-full bg-black/5 dark:bg-white/5 border border-glass-border rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </form>

          <div className="flex items-center gap-2">
            <button onClick={handleCreateTab} className="mac-button hover:bg-black/5 dark:hover:bg-white/5" title="New tab"><Plus size={16} /></button>
            <button className="mac-button hover:bg-black/5 dark:hover:bg-white/5"><Layout size={16} /></button>
            <button 
              className={`mac-button ${isAIPanelOpen ? 'bg-blue-500 text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
            >
              <Bot size={16} />
            </button>
          </div>
        </header>

        {/* Tab Bar */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleCreateTab}
          onReopenClosedTab={handleReopenClosedTab}
          onDuplicateTab={handleDuplicateTab}
          onToggleMute={handleToggleMute}
          onPinTab={handlePinTab}
          onMoveTab={handleMoveTab}
        />

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {children ? children : <BrowserView tabId={activeTabId} />}
        </div>
      </main>

      {/* AI Panel */}
      {isAIPanelOpen && (
        <aside className="w-96 h-screen border-l border-glass-border liquid-glass flex flex-col">
          <AIWorkspacePanel />
        </aside>
      )}
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
    {icon}
    <span>{label}</span>
  </button>
);

export default MainLayout;
