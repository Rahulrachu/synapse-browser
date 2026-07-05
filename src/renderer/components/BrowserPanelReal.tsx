import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, RotateCcw, Loader } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Tab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
}

export default function BrowserPanelReal() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize tabs on mount
  useEffect(() => {
    const initTabs = async () => {
      const result = await window.electron.ipcRenderer.invoke('get-all-tabs');
      setTabs(result.tabs);
      setActiveTabId(result.activeTabId);
      if (result.tabs.length > 0) {
        setUrlInput(result.tabs[0].url);
      }
    };

    initTabs();

    // Listen for tab updates
    window.electron.ipcRenderer.on('tabs-updated', (data) => {
      setTabs(data.tabs);
      setActiveTabId(data.activeTabId);
    });

    window.electron.ipcRenderer.on('tab-updated', (tab) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => (t.id === tab.id ? { ...t, ...tab } : t))
      );
      if (tab.id === activeTabId) {
        setUrlInput(tab.url);
      }
    });

    return () => {
      window.electron.ipcRenderer.removeListener('tabs-updated', () => {});
      window.electron.ipcRenderer.removeListener('tab-updated', () => {});
    };
  }, [activeTabId]);

  const handleAddTab = async () => {
    const result = await window.electron.ipcRenderer.invoke('create-tab', 'about:blank');
    setTabs(result.tabs);
    setActiveTabId(result.activeTabId);
  };

  const handleCloseTab = async (tabId: string) => {
    const result = await window.electron.ipcRenderer.invoke('close-tab', tabId);
    setTabs(result.tabs);
    setActiveTabId(result.activeTabId);
  };

  const handleSelectTab = async (tabId: string) => {
    const result = await window.electron.ipcRenderer.invoke('set-active-tab', tabId);
    setActiveTabId(result.activeTabId);
    const tab = result.tabs.find((t: Tab) => t.id === tabId);
    if (tab) {
      setUrlInput(tab.url);
    }
  };

  const handleNavigate = async () => {
    if (urlInput.trim()) {
      await window.electron.ipcRenderer.invoke('navigate-to', urlInput);
    }
  };

  const handleGoBack = async () => {
    await window.electron.ipcRenderer.invoke('go-back');
  };

  const handleGoForward = async () => {
    await window.electron.ipcRenderer.invoke('go-forward');
  };

  const handleReload = async () => {
    await window.electron.ipcRenderer.invoke('reload');
  };

  const handleDuplicateTab = async (tabId: string) => {
    const result = await window.electron.ipcRenderer.invoke('duplicate-tab', tabId);
    setTabs(result.tabs);
    setActiveTabId(result.activeTabId);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Tab Bar */}
      <div className={`flex items-center gap-1 px-2 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'} overflow-x-auto`}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => handleSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer transition whitespace-nowrap ${
              activeTabId === tab.id
                ? isDarkMode ? 'bg-synapse-accent text-white' : 'bg-synapse-accent text-white'
                : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {tab.isLoading && <Loader size={14} className="animate-spin" />}
            <span className="text-sm truncate max-w-[100px]">{tab.title || 'New Tab'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTab(tab.id);
              }}
              className="hover:bg-red-500 rounded p-0.5 transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          onClick={handleAddTab}
          className={`ml-auto p-1 rounded hover:bg-synapse-accent hover:text-white transition`}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={handleGoBack}
          disabled={!canGoBack}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition disabled:opacity-50"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={handleGoForward}
          disabled={!canGoForward}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition disabled:opacity-50"
        >
          <ArrowRight size={18} />
        </button>
        <button
          onClick={handleReload}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
        >
          <RotateCcw size={18} />
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
      </div>

      {/* Browser Content - Placeholder for now */}
      <div className="flex-1 overflow-auto flex items-center justify-center">
        {activeTab ? (
          <div className="text-center">
            <p className="text-gray-400 mb-2">Browser View</p>
            <p className="text-sm text-gray-500">{activeTab.url}</p>
            <p className="text-xs text-gray-600 mt-2">
              {activeTab.isLoading ? 'Loading...' : 'Page loaded'}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400">No tabs open</p>
            <button
              onClick={handleAddTab}
              className="mt-4 px-4 py-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition"
            >
              Open New Tab
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
