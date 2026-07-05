import React from 'react';
import { Globe, BookmarkIcon, History, Settings, FileText, Terminal, Zap } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Sidebar() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const toggleDarkMode = useWorkspaceStore((state) => state.toggleDarkMode);

  const menuItems = [
    { icon: Globe, label: 'Browser', id: 'browser' },
    { icon: BookmarkIcon, label: 'Bookmarks', id: 'bookmarks' },
    { icon: History, label: 'History', id: 'history' },
    { icon: FileText, label: 'Notes', id: 'notes' },
    { icon: Terminal, label: 'Terminal', id: 'terminal' },
    { icon: Zap, label: 'Prompts', id: 'prompts' },
  ];

  return (
    <aside className={`w-16 border-r ${isDarkMode ? 'border-gray-800 bg-synapse-darker' : 'border-gray-200 bg-gray-100'} flex flex-col items-center py-4 gap-4`}>
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-synapse-accent flex items-center justify-center text-white font-bold">
        S
      </div>

      {/* Menu Items */}
      <nav className="flex flex-col gap-4 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition hover:bg-synapse-accent hover:text-white ${
              isDarkMode ? 'hover:bg-synapse-accent' : 'hover:bg-synapse-accent'
            }`}
            title={item.label}
          >
            <item.icon size={20} />
          </button>
        ))}
      </nav>

      {/* Settings & Theme Toggle */}
      <div className="flex flex-col gap-2">
        <button
          onClick={toggleDarkMode}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition hover:bg-synapse-accent hover:text-white`}
          title="Toggle Theme"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition hover:bg-synapse-accent hover:text-white`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </aside>
  );
}
