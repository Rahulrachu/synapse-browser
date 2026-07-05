import React, { useState } from 'react';
import { Zap, Plus, X } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface AIPanel {
  id: string;
  name: string;
  url: string;
  type: 'chatgpt' | 'gemini' | 'claude' | 'custom';
}

export default function AIWorkspace() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [aiPanels, setAIPanels] = useState<AIPanel[]>([
    { id: '1', name: 'ChatGPT', url: 'https://chat.openai.com', type: 'chatgpt' },
    { id: '2', name: 'Google Gemini', url: 'https://gemini.google.com', type: 'gemini' },
  ]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newPanelName, setNewPanelName] = useState('');
  const [newPanelUrl, setNewPanelUrl] = useState('');

  const aiServices = [
    { name: 'ChatGPT', url: 'https://chat.openai.com', type: 'chatgpt' },
    { name: 'Google Gemini', url: 'https://gemini.google.com', type: 'gemini' },
    { name: 'Claude', url: 'https://claude.ai', type: 'claude' },
  ];

  const handleAddPanel = (service: typeof aiServices[0]) => {
    const newPanel: AIPanel = {
      id: Date.now().toString(),
      name: service.name,
      url: service.url,
      type: service.type as AIPanel['type'],
    };
    setAIPanels([...aiPanels, newPanel]);
  };

  const handleRemovePanel = (id: string) => {
    setAIPanels(aiPanels.filter((p) => p.id !== id));
  };

  const handleAddCustom = () => {
    if (newPanelName && newPanelUrl) {
      const newPanel: AIPanel = {
        id: Date.now().toString(),
        name: newPanelName,
        url: newPanelUrl,
        type: 'custom',
      };
      setAIPanels([...aiPanels, newPanel]);
      setNewPanelName('');
      setNewPanelUrl('');
      setShowAddPanel(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <Zap size={18} />
          AI Workspace
        </h2>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Add Panel Section */}
      {showAddPanel && (
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'}`}>
          <p className="text-sm font-semibold mb-3">Add AI Service</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {aiServices.map((service) => (
              <button
                key={service.type}
                onClick={() => handleAddPanel(service)}
                className={`px-3 py-2 rounded text-sm transition ${
                  aiPanels.some((p) => p.type === service.type)
                    ? 'bg-gray-500 text-white cursor-not-allowed'
                    : 'bg-synapse-accent text-white hover:bg-synapse-accent-light'
                }`}
                disabled={aiPanels.some((p) => p.type === service.type)}
              >
                {service.name}
              </button>
            ))}
          </div>
          <div className="border-t pt-3">
            <p className="text-xs font-semibold mb-2">Custom Service</p>
            <input
              type="text"
              value={newPanelName}
              onChange={(e) => setNewPanelName(e.target.value)}
              placeholder="Service name..."
              className={`w-full px-3 py-2 rounded border mb-2 text-sm ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
            />
            <input
              type="text"
              value={newPanelUrl}
              onChange={(e) => setNewPanelUrl(e.target.value)}
              placeholder="URL..."
              className={`w-full px-3 py-2 rounded border mb-2 text-sm ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
            />
            <button
              onClick={handleAddCustom}
              className="w-full px-3 py-2 bg-synapse-accent text-white rounded text-sm hover:bg-synapse-accent-light transition"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Active Panels */}
      <div className="flex-1 overflow-y-auto">
        {aiPanels.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No AI services added yet
          </div>
        ) : (
          aiPanels.map((panel) => (
            <div
              key={panel.id}
              className={`flex items-center justify-between px-4 py-3 border-b ${
                isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
              } transition`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{panel.name}</p>
                <p className="text-xs text-gray-400 truncate">{panel.url}</p>
              </div>
              <button
                onClick={() => handleRemovePanel(panel.id)}
                className="ml-2 p-1 rounded hover:bg-red-500 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
