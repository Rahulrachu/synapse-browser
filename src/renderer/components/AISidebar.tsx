import React, { useState } from 'react';
import {
  Zap,
  FileText,
  Code,
  Bug,
  Search,
  Lightbulb,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActionType =
  | 'explain-file'
  | 'explain-code'
  | 'refactor'
  | 'generate-docs'
  | 'find-bugs'
  | 'search-project'
  | 'answer-question';

export default function AISidebar({ isOpen, onClose }: AISidebarProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = [
    {
      id: 'explain-file',
      label: 'Explain Current File',
      icon: FileText,
      description: 'Get AI explanation of the current file',
    },
    {
      id: 'explain-code',
      label: 'Explain Selected Code',
      icon: Code,
      description: 'Explain the selected code snippet',
    },
    {
      id: 'refactor',
      label: 'Refactor Selection',
      icon: RefreshCw,
      description: 'Suggest refactoring for selected code',
    },
    {
      id: 'generate-docs',
      label: 'Generate Documentation',
      icon: FileText,
      description: 'Generate documentation for code',
    },
    {
      id: 'find-bugs',
      label: 'Find Bugs',
      icon: Bug,
      description: 'Analyze code for potential bugs',
    },
    {
      id: 'search-project',
      label: 'Search Project',
      icon: Search,
      description: 'Search project with natural language',
    },
    {
      id: 'answer-question',
      label: 'Answer Question',
      icon: Lightbulb,
      description: 'Ask a question about the project',
    },
  ];

  const handleExecuteAction = async () => {
    if (!selectedAction || !input.trim()) return;

    setIsLoading(true);
    setError(null);
    setOutput('');

    try {
      const result = await window.electron.ipcRenderer.invoke(
        'ai-sidebar-action',
        {
          action: selectedAction,
          input,
        }
      );

      if (result && result.output) {
        setOutput(result.output);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed';
      setError(errorMessage);
      console.error('Error executing action:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-0 top-0 h-screen w-96 shadow-lg transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isDarkMode ? 'bg-synapse-darker border-l border-gray-700' : 'bg-white border-l border-gray-200'}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-synapse-accent" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-700 transition"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Actions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  setSelectedAction(action.id as ActionType);
                  setInput('');
                  setOutput('');
                }}
                className={`w-full text-left px-3 py-2 rounded transition ${
                  selectedAction === action.id
                    ? 'bg-synapse-accent text-white'
                    : isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Input/Output Area */}
        {selectedAction && (
          <div
            className={`border-t ${
              isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
            } p-3 flex flex-col gap-3`}
          >
            {/* Input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your request or code..."
              disabled={isLoading}
              className={`w-full px-3 py-2 rounded border text-sm resize-none ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent disabled:opacity-50`}
              rows={3}
            />

            {/* Execute Button */}
            <button
              onClick={handleExecuteAction}
              disabled={isLoading || !input.trim()}
              className={`w-full px-3 py-2 rounded font-medium text-sm transition ${
                isLoading || !input.trim()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-synapse-accent text-white hover:bg-synapse-accent-light'
              }`}
            >
              {isLoading ? 'Processing...' : 'Execute'}
            </button>

            {/* Error */}
            {error && (
              <div className="px-3 py-2 bg-red-100 border border-red-300 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Output */}
            {output && (
              <div
                className={`px-3 py-2 rounded border text-sm max-h-40 overflow-y-auto ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-100'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-xs">Output:</p>
                  <button
                    onClick={handleCopyOutput}
                    className="p-1 rounded hover:bg-gray-700 transition"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="whitespace-pre-wrap text-xs">{output}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
