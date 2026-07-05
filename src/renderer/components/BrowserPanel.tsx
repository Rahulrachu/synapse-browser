import React, { useState } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { TabData } from '@/common/utils';

export default function BrowserPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const tabs = useBrowserStore((state) => state.tabs);
  const activeTabId = useBrowserStore((state) => state.activeTabId);
  const addTab = useBrowserStore((state) => state.addTab);
  const closeTab = useBrowserStore((state) => state.closeTab);
  const setActiveTab = useBrowserStore((state) => state.setActiveTab);
  const updateTab = useBrowserStore((state) => state.updateTab);
  const [urlInput, setUrlInput] = useState('');

  const handleAddTab = () => {
    const newTab: TabData = {
      id: Date.now().toString(),
      title: 'New Tab',
      url: 'about:blank',
      isActive: true,
    };
    addTab(newTab);
  };

  const handleNavigate = (url: string) => {
    if (activeTabId) {
      updateTab(activeTabId, { url, title: url });
      setUrlInput('');
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Tab Bar */}
      <div className={`flex items-center gap-1 px-2 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'} overflow-x-auto`}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer transition ${
              activeTabId === tab.id
                ? isDarkMode ? 'bg-synapse-accent text-white' : 'bg-synapse-accent text-white'
                : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <span className="text-sm truncate max-w-[100px]">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
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
        <button className="p-1 rounded hover:bg-synapse-accent hover:text-white transition">
          <ArrowLeft size={18} />
        </button>
        <button className="p-1 rounded hover:bg-synapse-accent hover:text-white transition">
          <ArrowRight size={18} />
        </button>
        <button className="p-1 rounded hover:bg-synapse-accent hover:text-white transition">
          <RotateCcw size={18} />
        </button>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleNavigate(urlInput)}
          placeholder="Enter URL..."
          className={`flex-1 px-3 py-1 rounded border ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
        />
      </div>

      {/* Browser Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center">
        {activeTab ? (
          <div className="text-center">
            <p className="text-gray-400 mb-2">Browser View</p>
            <p className="text-sm text-gray-500">{activeTab.url}</p>
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
