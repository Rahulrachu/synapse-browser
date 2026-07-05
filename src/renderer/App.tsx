import React, { useState } from 'react';
import { useWorkspaceStore } from './store/workspaceStore';
import { useBrowserStore } from './store/browserStore';
import { useKeyboardShortcuts, SHORTCUTS } from './hooks/useKeyboardShortcuts';
import BrowserPanel from './components/BrowserPanel';
import Sidebar from './components/Sidebar';
import WorkspacePanel from './components/WorkspacePanel';
import MultiPanelLayout from './components/MultiPanelLayout';
import FadeIn from './components/FadeIn';

export default function App() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const toggleDarkMode = useWorkspaceStore((state) => state.toggleDarkMode);
  const addTab = useBrowserStore((state) => state.addTab);
  const addNote = useWorkspaceStore((state) => state.addNote);
  const [panelLayout, setPanelLayout] = useState<2 | 3 | 4>(2);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.NEW_TAB,
      handler: () => {
        addTab({
          id: Date.now().toString(),
          title: 'New Tab',
          url: 'about:blank',
          isActive: true,
        });
      },
    },
    {
      ...SHORTCUTS.NEW_NOTE,
      handler: () => {
        addNote('Untitled Note', '');
      },
    },
    {
      ...SHORTCUTS.TOGGLE_THEME,
      handler: toggleDarkMode,
    },
  ]);

  return (
    <FadeIn>
      <div className={`h-screen flex ${isDarkMode ? 'bg-synapse-dark text-white' : 'bg-white text-gray-900'}`}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className={`border-b ${isDarkMode ? 'border-gray-800 bg-synapse-darker' : 'border-gray-200 bg-gray-50'} px-4 py-3 flex items-center justify-between`}>
            <h1 className="text-xl font-bold">Synapse Browser</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setPanelLayout(2)}
                className={`px-3 py-1 rounded text-sm transition ${
                  panelLayout === 2
                    ? 'bg-synapse-accent text-white'
                    : 'hover:bg-synapse-accent hover:text-white'
                }`}
              >
                2-Panel
              </button>
              <button
                onClick={() => setPanelLayout(3)}
                className={`px-3 py-1 rounded text-sm transition ${
                  panelLayout === 3
                    ? 'bg-synapse-accent text-white'
                    : 'hover:bg-synapse-accent hover:text-white'
                }`}
              >
                3-Panel
              </button>
              <button
                onClick={() => setPanelLayout(4)}
                className={`px-3 py-1 rounded text-sm transition ${
                  panelLayout === 4
                    ? 'bg-synapse-accent text-white'
                    : 'hover:bg-synapse-accent hover:text-white'
                }`}
              >
                4-Panel
              </button>
            </div>
          </header>

          {/* Panels Container */}
          <MultiPanelLayout panelCount={panelLayout} />
        </div>
      </div>
    </FadeIn>
  );
}
