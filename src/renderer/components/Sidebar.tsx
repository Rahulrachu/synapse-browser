import React from 'react';
import { Settings } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { usePanelStore } from '../store/panelStore';
import { panelRegistry } from '../registry/PanelRegistry';

export default function Sidebar() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const toggleDarkMode = useWorkspaceStore((state) => state.toggleDarkMode);
  const activePanel = usePanelStore((state) => state.activePanel);
  const setActivePanel = usePanelStore((state) => state.setActivePanel);

  const menuItems = panelRegistry.getAll();

  return (
    <aside className={`w-16 border-r ${isDarkMode ? 'border-gray-800 bg-synapse-darker' : 'border-gray-200 bg-gray-100'} flex flex-col items-center py-4 gap-4 z-10`}>
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-synapse-accent flex items-center justify-center text-white font-bold">
        S
      </div>

      {/* Menu Items */}
      <nav className="flex flex-col gap-4 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePanel(item.id, 'left')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
              activePanel === item.id
                ? 'bg-synapse-accent text-white'
                : `hover:bg-synapse-accent hover:text-white ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`
            }`}
            title={item.title}
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
          onClick={() => setActivePanel('settings', 'left')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
            activePanel === 'settings'
              ? 'bg-synapse-accent text-white'
              : 'hover:bg-synapse-accent hover:text-white'
          }`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </aside>
  );
}
