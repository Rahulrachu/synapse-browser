import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSearch } from '../hooks/useSearch';

export default function CommandPalette() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [search, setSearch] = useState('');
  const { results, search: performSearch } = useSearch();
  const commands = ['New Tab', 'New Note', 'Settings', 'Help'];

  useEffect(() => {
    if (search.trim()) {
      performSearch({ text: search, limit: 5 });
    }
  }, [search, performSearch]);

  const filteredCommands = commands.filter((cmd) => cmd.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <h2 className="text-lg font-bold mb-4">Commands</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search commands..."
          className={`w-full px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCommands.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Commands</h3>
            <div className="space-y-1">
              {filteredCommands.map((cmd) => (
                <div key={cmd} className={`p-2 rounded cursor-pointer text-sm hover:bg-synapse-accent hover:text-white transition`}>
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Search Results</h3>
            <div className="space-y-1">
              {results.map((result) => (
                <div key={result.id} className={`p-2 rounded cursor-pointer hover:bg-synapse-accent hover:text-white transition`}>
                  <div className="text-sm font-medium">{result.title}</div>
                  <div className="text-xs opacity-70 truncate">{result.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
