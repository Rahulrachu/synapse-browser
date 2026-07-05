import React, { useState } from 'react';
import { History, Trash2, Search } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function HistoryPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const history = useBrowserStore((state) => state.history);
  const addToHistory = useBrowserStore((state) => state.addToHistory);
  const clearHistory = useBrowserStore((state) => state.clearHistory);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(
    (entry) =>
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <History size={18} />
          History
        </h2>
        <button
          onClick={clearHistory}
          className="text-sm px-2 py-1 rounded hover:bg-red-500 hover:text-white transition"
        >
          Clear
        </button>
      </div>

      {/* Search Bar */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className={`w-full pl-9 pr-3 py-2 rounded border ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            {history.length === 0 ? 'No history yet' : 'No matching results'}
          </div>
        ) : (
          filteredHistory.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between px-4 py-3 border-b ${
                isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
              } transition`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.title}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 truncate">{entry.url}</p>
                  <p className="text-xs text-gray-500 ml-2">{formatDate(entry.visitedAt)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
