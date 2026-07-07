import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap, Code, FileText, GitBranch, Settings } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Command {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

interface EnhancedCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedCommandPalette({
  isOpen,
  onClose,
}: EnhancedCommandPaletteProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [commands, setCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize commands
  useEffect(() => {
    const allCommands: Command[] = [
      // File commands
      {
        id: 'new-file',
        title: 'New File',
        description: 'Create a new file',
        category: 'File',
        icon: <FileText size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-new-file');
          onClose();
        },
        keywords: ['new', 'file', 'create'],
      },
      {
        id: 'open-file',
        title: 'Open File',
        description: 'Open an existing file',
        category: 'File',
        icon: <FileText size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-open-file');
          onClose();
        },
        keywords: ['open', 'file', 'browse'],
      },
      {
        id: 'save-file',
        title: 'Save File',
        description: 'Save the current file',
        category: 'File',
        icon: <FileText size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-save-file');
          onClose();
        },
        keywords: ['save', 'file', 'persist'],
      },

      // Project commands
      {
        id: 'analyze-project',
        title: 'Analyze Project',
        description: 'Analyze the current project structure',
        category: 'Project',
        icon: <Code size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-analyze-project');
          onClose();
        },
        keywords: ['analyze', 'project', 'intelligence'],
      },
      {
        id: 'project-summary',
        title: 'Project Summary',
        description: 'View project summary and statistics',
        category: 'Project',
        icon: <Code size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-project-summary');
          onClose();
        },
        keywords: ['summary', 'project', 'overview'],
      },

      // Git commands
      {
        id: 'git-status',
        title: 'Git Status',
        description: 'Check git repository status',
        category: 'Git',
        icon: <GitBranch size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-git-status');
          onClose();
        },
        keywords: ['git', 'status', 'repository'],
      },
      {
        id: 'git-commit',
        title: 'Git Commit',
        description: 'Create a new commit',
        category: 'Git',
        icon: <GitBranch size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-git-commit');
          onClose();
        },
        keywords: ['git', 'commit', 'save'],
      },
      {
        id: 'git-push',
        title: 'Git Push',
        description: 'Push changes to remote',
        category: 'Git',
        icon: <GitBranch size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-git-push');
          onClose();
        },
        keywords: ['git', 'push', 'remote'],
      },

      // AI commands
      {
        id: 'explain-code',
        title: 'Explain Code',
        description: 'Get AI explanation of selected code',
        category: 'AI',
        icon: <Zap size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-explain-code');
          onClose();
        },
        keywords: ['explain', 'code', 'ai', 'understand'],
      },
      {
        id: 'generate-docs',
        title: 'Generate Documentation',
        description: 'Generate documentation for code',
        category: 'AI',
        icon: <Zap size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-generate-docs');
          onClose();
        },
        keywords: ['generate', 'documentation', 'docs'],
      },
      {
        id: 'find-bugs',
        title: 'Find Bugs',
        description: 'Analyze code for potential bugs',
        category: 'AI',
        icon: <Zap size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-find-bugs');
          onClose();
        },
        keywords: ['find', 'bugs', 'errors', 'issues'],
      },

      // Settings commands
      {
        id: 'open-settings',
        title: 'Open Settings',
        description: 'Open application settings',
        category: 'Settings',
        icon: <Settings size={16} />,
        action: () => {
          window.electron.ipcRenderer.send('command-open-settings');
          onClose();
        },
        keywords: ['settings', 'preferences', 'config'],
      },
    ];

    setCommands(allCommands);
    setFilteredCommands(allCommands);
  }, []);

  // Filter commands based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredCommands(commands);
      setSelectedIndex(0);
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = commands.filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(queryLower);
      const descMatch = cmd.description.toLowerCase().includes(queryLower);
      const keywordMatch = cmd.keywords.some((kw) =>
        kw.toLowerCase().includes(queryLower)
      );
      return titleMatch || descMatch || keywordMatch;
    });

    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [query, commands]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        Math.min(prev + 1, filteredCommands.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div
        className={`w-full max-w-2xl rounded-lg shadow-xl overflow-hidden ${
          isDarkMode ? 'bg-synapse-darker' : 'bg-white'
        }`}
      >
        {/* Search Input */}
        <div
          className={`flex items-center gap-3 px-4 py-3 border-b ${
            isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <Search size={20} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className={`flex-1 bg-transparent text-lg focus:outline-none ${
              isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>

        {/* Commands List */}
        <div
          className={`max-h-96 overflow-y-auto ${
            isDarkMode ? 'bg-synapse-darker' : 'bg-white'
          }`}
        >
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <p>No commands found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition text-left ${
                    index === selectedIndex
                      ? isDarkMode
                        ? 'bg-synapse-accent text-white'
                        : 'bg-blue-100 text-blue-900'
                      : isDarkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0 text-gray-400">{cmd.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{cmd.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {cmd.description}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                    {cmd.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-4 py-2 border-t text-xs text-gray-400 ${
            isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <p>
            ↑↓ Navigate • Enter Select • Esc Close
          </p>
        </div>
      </div>
    </div>
  );
}
