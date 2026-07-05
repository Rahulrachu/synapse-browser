import React, { useState } from 'react';
import { Zap, Plus, Trash2, Copy, Folder } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function PromptHistory() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const prompts = useWorkspaceStore((state) => state.prompts);
  const addPrompt = useWorkspaceStore((state) => state.addPrompt);
  const deletePrompt = useWorkspaceStore((state) => state.deletePrompt);
  const [newPromptText, setNewPromptText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['general', 'coding', 'writing', 'analysis', 'creative'];
  const filteredPrompts = prompts.filter((p) => p.category === selectedCategory);

  const handleAddPrompt = () => {
    if (newPromptText.trim()) {
      addPrompt(newPromptText, selectedCategory);
      setNewPromptText('');
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <Zap size={18} />
          Prompt Library
        </h2>
      </div>

      {/* Categories */}
      <div className={`flex gap-2 px-4 py-3 border-b overflow-x-auto ${isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'}`}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded text-sm transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-synapse-accent text-white'
                : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Prompt */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex gap-2">
          <textarea
            value={newPromptText}
            onChange={(e) => setNewPromptText(e.target.value)}
            placeholder="Add a new prompt..."
            rows={2}
            className={`flex-1 px-3 py-2 rounded border resize-none ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
          <button
            onClick={handleAddPrompt}
            className="px-3 py-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition h-fit"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Prompts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPrompts.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No prompts in this category
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`flex items-start justify-between gap-3 px-4 py-3 border-b ${
                isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
              } transition`}
            >
              <p className="flex-1 text-sm">{prompt.text}</p>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleCopyPrompt(prompt.text, prompt.id)}
                  className={`p-1 rounded transition ${
                    copiedId === prompt.id
                      ? 'bg-green-500 text-white'
                      : 'hover:bg-synapse-accent hover:text-white'
                  }`}
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => deletePrompt(prompt.id)}
                  className="p-1 rounded hover:bg-red-500 hover:text-white transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
