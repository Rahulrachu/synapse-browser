import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from './store/workspaceStore';
import { useWorkspaceTemplateStore } from './store/workspaceTemplateStore';
import { usePanelStore } from './store/panelStore';
import { useBrowserStore } from './store/browserStore';
import { useNotificationStore } from './store/notificationStore';
import { useDownloadStore } from './store/downloadStore';
import { Bell, Download } from 'lucide-react';
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
  const { templates, defaultTemplateId } = useWorkspaceTemplateStore();
  const { restorePanelState, setPanelLayout: setStorePanelLayout, setActivePanel } = usePanelStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const activeDownloadCount = useDownloadStore((state) => state.activeCount);

  // Load default template on startup
  useEffect(() => {
    if (defaultTemplateId) {
      const template = templates.find(t => t.id === defaultTemplateId);
      if (template) {
        setStorePanelLayout(template.panelLayout);
        restorePanelState(template.panelState);
        
        // Map panelLayout string to number for local state
        const layoutMap: Record<string, 2 | 3 | 4> = {
          'single': 2, // Default to 2 if single since MultiPanelLayout expects 2, 3, or 4
          'split-h': 2,
          'split-v': 2,
          'grid': 4
        };
        setPanelLayout(layoutMap[template.panelLayout] || 2);
      }
    }
  }, []);

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
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Synapse Browser</h1>
              <button 
                onClick={() => setActivePanel('notifications', 'right')}
                className={`relative p-2 rounded-full transition ${
                  isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-synapse-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-synapse-darker">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActivePanel('downloads', 'right')}
                className={`relative p-2 rounded-full transition ${
                  isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Download size={20} />
                {activeDownloadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-synapse-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-synapse-darker">
                    {activeDownloadCount}
                  </span>
                )}
              </button>
            </div>
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
          <div className="flex-1 overflow-hidden">
            <MultiPanelLayout panelCount={panelLayout} />
          </div>
          <StatusBar />
        </div>
      </div>
    </FadeIn>
  );
}
