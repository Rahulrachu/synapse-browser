import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Loader, Home, X, Plus } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useBrowserStore } from '../store/browserStore';
import AdvancedTabBar from './AdvancedTabBar';

interface Tab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  viewId?: number;
  isPinned?: boolean;
  isSleeping?: boolean;
  color?: string;
  groupId?: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export default function BrowserPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { tabs: storeTabs } = useBrowserStore();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const browserAreaRef = useRef<HTMLDivElement>(null);

  // Initialize tabs on mount
  useEffect(() => {
    const initTabs = async () => {
      try {
        const result = await (window as any).electron.ipcRenderer.invoke('get-all-tabs');
        const mappedTabs = result.tabs.map((tab: any) => ({
          ...tab,
          isPinned: storeTabs.find(t => t.id === tab.id)?.isPinned || false,
          isSleeping: storeTabs.find(t => t.id === tab.id)?.isSleeping || false,
          color: storeTabs.find(t => t.id === tab.id)?.color,
          groupId: storeTabs.find(t => t.id === tab.id)?.groupId,
        }));
        setTabs(mappedTabs);
        setActiveTabId(result.activeTabId);
        if (mappedTabs.length > 0) {
          setUrlInput(mappedTabs[0].url);
          setCanGoBack(mappedTabs[0].canGoBack || false);
          setCanGoForward(mappedTabs[0].canGoForward || false);
        }
      } catch (error) {
        console.error('Failed to initialize tabs:', error);
      }
    };

    initTabs();

    // Listen for tab updates
    const handleTabsUpdated = (data: any) => {
      const mappedTabs = data.tabs.map((tab: any) => ({
        ...tab,
        isPinned: storeTabs.find(t => t.id === tab.id)?.isPinned || false,
        isSleeping: storeTabs.find(t => t.id === tab.id)?.isSleeping || false,
        color: storeTabs.find(t => t.id === tab.id)?.color,
        groupId: storeTabs.find(t => t.id === tab.id)?.groupId,
      }));
      setTabs(mappedTabs);
      setActiveTabId(data.activeTabId);
    };

    const handleTabUpdated = (tab: Tab) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => (t.id === tab.id ? { ...t, ...tab } : t))
      );
      if (tab.id === activeTabId) {
        setUrlInput(tab.url);
        setCanGoBack(tab.canGoBack || false);
        setCanGoForward(tab.canGoForward || false);
      }
    };

    (window as any).electron.ipcRenderer.on('tabs-updated', handleTabsUpdated);
    (window as any).electron.ipcRenderer.on('tab-updated', handleTabUpdated);

    return () => {
      (window as any).electron.ipcRenderer.removeListener('tabs-updated', handleTabsUpdated);
      (window as any).electron.ipcRenderer.removeListener('tab-updated', handleTabUpdated);
    };
  }, [storeTabs]);

  // Send browser area bounds to main process when size changes
  useEffect(() => {
    const sendBrowserBounds = () => {
      if (browserAreaRef.current) {
        const rect = browserAreaRef.current.getBoundingClientRect();
        (window as any).electron.ipcRenderer.invoke('resize-browser-area', {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }).catch((err: Error) => {
          console.error('Failed to resize browser area:', err);
        });
      }
    };

    // Send on mount
    sendBrowserBounds();

    // Send on window resize
    const handleResize = () => {
      sendBrowserBounds();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleAddTab = async () => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('create-tab', 'about:blank');
      const mappedTabs = result.tabs.map((tab: any) => ({
        ...tab,
        isPinned: storeTabs.find(t => t.id === tab.id)?.isPinned || false,
        isSleeping: storeTabs.find(t => t.id === tab.id)?.isSleeping || false,
        color: storeTabs.find(t => t.id === tab.id)?.color,
        groupId: storeTabs.find(t => t.id === tab.id)?.groupId,
      }));
      setTabs(mappedTabs);
      setActiveTabId(result.activeTabId);
    } catch (error) {
      console.error('Failed to create tab:', error);
    }
  };

  const handleCloseTab = async (tabId: string) => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('close-tab', tabId);
      const mappedTabs = result.tabs.map((tab: any) => ({
        ...tab,
        isPinned: storeTabs.find(t => t.id === tab.id)?.isPinned || false,
        isSleeping: storeTabs.find(t => t.id === tab.id)?.isSleeping || false,
        color: storeTabs.find(t => t.id === tab.id)?.color,
        groupId: storeTabs.find(t => t.id === tab.id)?.groupId,
      }));
      setTabs(mappedTabs);
      setActiveTabId(result.activeTabId);
    } catch (error) {
      console.error('Failed to close tab:', error);
    }
  };

  const handleSelectTab = async (tabId: string) => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('set-active-tab', tabId);
      setActiveTabId(result.activeTabId);
      const tab = result.tabs.find((t: Tab) => t.id === tabId);
      if (tab) {
        setUrlInput(tab.url);
        setCanGoBack(tab.canGoBack || false);
        setCanGoForward(tab.canGoForward || false);
      }
    } catch (error) {
      console.error('Failed to select tab:', error);
    }
  };

  const handleNavigate = async () => {
    if (urlInput.trim()) {
      try {
        await (window as any).electron.ipcRenderer.invoke('navigate-to', urlInput);
      } catch (error) {
        console.error('Failed to navigate:', error);
      }
    }
  };

  const handleGoBack = async () => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('go-back');
      setCanGoBack(result?.canGoBack || false);
    } catch (error) {
      console.error('Failed to go back:', error);
    }
  };

  const handleGoForward = async () => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('go-forward');
      setCanGoForward(result?.canGoForward || false);
    } catch (error) {
      console.error('Failed to go forward:', error);
    }
  };

  const handleReload = async () => {
    try {
      await (window as any).electron.ipcRenderer.invoke('reload');
    } catch (error) {
      console.error('Failed to reload:', error);
    }
  };

  const handleHome = async () => {
    try {
      await (window as any).electron.ipcRenderer.invoke('navigate-to', 'https://www.google.com');
    } catch (error) {
      console.error('Failed to navigate home:', error);
    }
  };

  const handleDuplicateTab = async (tabId: string) => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('duplicate-tab', tabId);
      const mappedTabs = result.tabs.map((tab: any) => ({
        ...tab,
        isPinned: storeTabs.find(t => t.id === tab.id)?.isPinned || false,
        isSleeping: storeTabs.find(t => t.id === tab.id)?.isSleeping || false,
        color: storeTabs.find(t => t.id === tab.id)?.color,
        groupId: storeTabs.find(t => t.id === tab.id)?.groupId,
      }));
      setTabs(mappedTabs);
      setActiveTabId(result.activeTabId);
    } catch (error) {
      console.error('Failed to duplicate tab:', error);
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div
      className={`flex-1 flex flex-col rounded-lg border ${
        isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
      } overflow-hidden`}
    >
      {/* Advanced Tab Bar */}
      <AdvancedTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onAddTab={handleAddTab}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onDuplicateTab={handleDuplicateTab}
      />

      {/* Navigation Bar */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <button
          onClick={handleGoBack}
          disabled={!canGoBack}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition disabled:opacity-50"
          title="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleGoForward}
          disabled={!canGoForward}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition disabled:opacity-50"
          title="Go Forward"
        >
          <ArrowRight size={18} />
        </button>
        <button
          onClick={handleReload}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
          title="Reload"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={handleHome}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
          title="Home"
        >
          <Home size={18} />
        </button>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigate()}
          placeholder="Enter URL..."
          className={`flex-1 px-3 py-1 rounded border ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
        />
        {activeTab?.isLoading && (
          <Loader size={18} className="animate-spin text-synapse-accent" />
        )}
      </div>

      {/* Browser Content Area - WebContentsView will render here */}
      <div
        ref={browserAreaRef}
        className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
      >
        {tabs.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-400'}>No tabs open</p>
              <button
                onClick={handleAddTab}
                className="mt-4 px-4 py-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Open New Tab
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
