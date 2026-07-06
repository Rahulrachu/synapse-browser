import React, { useState, useEffect } from 'react';
import { Plus, X, Save, RotateCcw, Grid3x3, Columns2, Columns3 } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface WorkspaceLayout {
  id: string;
  name: string;
  type: 'vertical' | 'horizontal' | 'grid';
  panelCount: 2 | 3 | 4;
  createdAt: number;
}

export default function WorkspaceLayoutManager() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [layouts, setLayouts] = useState<WorkspaceLayout[]>([]);
  const [showNewLayoutForm, setShowNewLayoutForm] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutType, setNewLayoutType] = useState<'vertical' | 'horizontal' | 'grid'>('vertical');
  const [newLayoutPanels, setNewLayoutPanels] = useState<2 | 3 | 4>(2);

  useEffect(() => {
    loadLayouts();
  }, []);

  const loadLayouts = async () => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('get-layouts');
      setLayouts(result || []);
    } catch (error) {
      console.error('Failed to load layouts:', error);
    }
  };

  const handleCreateLayout = async () => {
    if (newLayoutName.trim()) {
      try {
        const layout = {
          name: newLayoutName,
          type: newLayoutType,
          panelCount: newLayoutPanels,
        };
        await (window as any).electron.ipcRenderer.invoke('create-layout', newLayoutName, layout);
        await loadLayouts();
        setNewLayoutName('');
        setNewLayoutType('vertical');
        setNewLayoutPanels(2);
        setShowNewLayoutForm(false);
      } catch (error) {
        console.error('Failed to create layout:', error);
      }
    }
  };

  const handleDeleteLayout = async (layoutId: string) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('delete-layout', layoutId);
      await loadLayouts();
    } catch (error) {
      console.error('Failed to delete layout:', error);
    }
  };

  const handleLoadLayout = async (layoutId: string) => {
    try {
      const layout = await (window as any).electron.ipcRenderer.invoke('get-layout', layoutId);
      // Dispatch event to load this layout in the main app
      window.dispatchEvent(new CustomEvent('load-workspace-layout', { detail: layout }));
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  };

  const getLayoutIcon = (type: string) => {
    switch (type) {
      case 'vertical':
        return <Columns2 size={16} />;
      case 'horizontal':
        return <Columns3 size={16} />;
      case 'grid':
        return <Grid3x3 size={16} />;
      default:
        return <Columns2 size={16} />;
    }
  };

  return (
    <div
      className={`flex flex-col h-full rounded-lg border ${
        isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
      } overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <h2 className="text-lg font-bold">Workspace Layouts</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* New Layout Form */}
        {!showNewLayoutForm ? (
          <button
            onClick={() => setShowNewLayoutForm(true)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition mb-4 ${
              isDarkMode
                ? 'bg-synapse-accent hover:bg-synapse-accent-light text-white'
                : 'bg-synapse-accent hover:bg-synapse-accent-light text-white'
            }`}
          >
            <Plus size={18} />
            New Layout
          </button>
        ) : (
          <div
            className={`p-3 rounded-lg mb-4 border ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
            }`}
          >
            <input
              type="text"
              value={newLayoutName}
              onChange={(e) => setNewLayoutName(e.target.value)}
              placeholder="Layout name..."
              className={`w-full px-3 py-2 rounded border mb-2 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              autoFocus
            />

            <div className="mb-2">
              <label className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Layout Type
              </label>
              <select
                value={newLayoutType}
                onChange={(e) => setNewLayoutType(e.target.value as any)}
                className={`w-full px-3 py-1 rounded border text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              >
                <option value="vertical">Vertical Split</option>
                <option value="horizontal">Horizontal Split</option>
                <option value="grid">Grid Layout</option>
              </select>
            </div>

            <div className="mb-2">
              <label className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Panel Count
              </label>
              <select
                value={newLayoutPanels}
                onChange={(e) => setNewLayoutPanels(parseInt(e.target.value) as any)}
                className={`w-full px-3 py-1 rounded border text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              >
                <option value="2">2 Panels</option>
                <option value="3">3 Panels</option>
                <option value="4">4 Panels</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateLayout}
                className="flex-1 px-3 py-1 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition text-sm"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewLayoutForm(false);
                  setNewLayoutName('');
                  setNewLayoutType('vertical');
                  setNewLayoutPanels(2);
                }}
                className={`flex-1 px-3 py-1 rounded transition text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Layouts List */}
        {layouts.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No workspace layouts yet</p>
            <p className="text-sm mt-2">Create a layout to save your workspace configuration</p>
          </div>
        ) : (
          <div className="space-y-2">
            {layouts.map((layout) => (
              <div
                key={layout.id}
                className={`p-3 rounded-lg border transition ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getLayoutIcon(layout.type)}
                    <div>
                      <h3 className="font-semibold text-sm">{layout.name}</h3>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {layout.panelCount} panels • {layout.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLayout(layout.id)}
                    className="p-1 hover:bg-red-500 rounded transition"
                  >
                    <X size={16} />
                  </button>
                </div>

                <button
                  onClick={() => handleLoadLayout(layout.id)}
                  className="w-full px-3 py-1 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition text-xs"
                >
                  Load Layout
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
