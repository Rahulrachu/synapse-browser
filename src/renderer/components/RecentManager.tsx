import React, { useState } from 'react';
import { 
  Clock, 
  File, 
  Folder, 
  Pin, 
  PinOff, 
  Trash2, 
  Search, 
  X,
  ExternalLink,
  History
} from 'lucide-react';
import { useRecentStore } from '../store/recentStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { RecentItem } from '../types/recent';

export default function RecentManager() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { items, removeItem, clearHistory, togglePin } = useRecentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'file' | 'project'>('all');

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.path.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'all' || item.type === activeTab;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      // Pinned items first, then by last opened
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastOpened - a.lastOpened;
    });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpen = (item: RecentItem) => {
    // In a real app, this would trigger opening the file/project
    console.log(`Opening ${item.type}: ${item.path}`);
    (window as any).electron.ipcRenderer.send('open-recent-item', item);
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border ${
      isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
    } overflow-hidden`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${
        isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <History size={18} />
          <h2 className="text-lg font-bold">Recent Items</h2>
        </div>
        <button 
          onClick={clearHistory}
          className="p-1.5 rounded hover:bg-red-500/20 text-red-500 transition" 
          title="Clear unpinned history"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recent items..."
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(['all', 'file', 'project'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition capitalize ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-synapse-accent'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredItems.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Clock size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No recent items</p>
            <p className="text-xs">Your recently opened files and projects will appear here.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              className={`group p-3 rounded-lg border transition cursor-pointer ${
                isDarkMode ? 'border-gray-800 bg-gray-900/50 hover:bg-gray-800' : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm'
              }`}
              onClick={() => handleOpen(item)}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-2 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  {item.type === 'file' ? <File size={16} className="text-blue-500" /> : <Folder size={16} className="text-purple-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(item.id);
                        }}
                        className={`p-1 rounded transition ${
                          item.isPinned 
                            ? 'text-synapse-accent bg-synapse-accent/10 opacity-100' 
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={item.isPinned ? "Unpin" : "Pin"}
                      >
                        {item.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-red-500 transition"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className={`text-[10px] truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {item.path}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Opened: {formatDate(item.lastOpened)}
                    </span>
                    <ExternalLink size={10} className="text-synapse-accent opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
