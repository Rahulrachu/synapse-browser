import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function CommandPalette() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [search, setSearch] = useState('');
  const commands = ['New Tab', 'New Note', 'Settings', 'Help'];

  const filtered = commands.filter((cmd) => cmd.toLowerCase().includes(search.toLowerCase()));

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
        <div className="space-y-2">
          {filtered.map((cmd) => (
            <div key={cmd} className={`p-3 rounded cursor-pointer hover:bg-synapse-accent hover:text-white`}>
              {cmd}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
