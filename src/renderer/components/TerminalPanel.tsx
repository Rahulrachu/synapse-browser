import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: number;
}

export default function TerminalPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '0',
      type: 'output',
      content: 'Synapse Terminal v1.0.0',
      timestamp: Date.now(),
    },
    {
      id: '1',
      type: 'output',
      content: 'Type "help" for available commands',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add to history
    setHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Add input line
    const inputLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'input',
      content: `$ ${command}`,
      timestamp: Date.now(),
    };
    setLines((prev) => [...prev, inputLine]);
    setInput('');
    setIsExecuting(true);

    try {
      // Execute command via IPC
      const result = await window.electron.ipcRenderer.invoke('terminal-execute', {
        command,
      });

      if (result && result.output) {
        const outputLine: TerminalLine = {
          id: (Date.now() + 1).toString(),
          type: 'output',
          content: result.output,
          timestamp: Date.now(),
        };
        setLines((prev) => [...prev, outputLine]);
      }

      if (result && result.error) {
        const errorLine: TerminalLine = {
          id: (Date.now() + 2).toString(),
          type: 'error',
          content: result.error,
          timestamp: Date.now(),
        };
        setLines((prev) => [...prev, errorLine]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Command execution failed';
      const errorLine: TerminalLine = {
        id: (Date.now() + 3).toString(),
        type: 'error',
        content: errorMessage,
        timestamp: Date.now(),
      };
      setLines((prev) => [...prev, errorLine]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex < history.length) {
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const clearTerminal = () => {
    setLines([]);
  };

  const copyOutput = () => {
    const output = lines.map((line) => line.content).join('\n');
    navigator.clipboard.writeText(output);
  };

  return (
    <div
      className={`flex flex-col h-full rounded-lg border ${
        isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
      } overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <h2 className="font-semibold text-sm">Terminal</h2>
        <div className="flex gap-2">
          <button
            onClick={copyOutput}
            title="Copy Output"
            className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={clearTerminal}
            title="Clear Terminal"
            className="p-1 rounded hover:bg-red-500 hover:text-white transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        className={`flex-1 overflow-y-auto p-3 font-mono text-sm ${
          isDarkMode ? 'bg-black text-green-400' : 'bg-gray-900 text-green-400'
        }`}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`${
              line.type === 'error'
                ? 'text-red-400'
                : line.type === 'input'
                  ? 'text-cyan-400'
                  : 'text-green-400'
            }`}
          >
            {line.content}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Input Area */}
      <div
        className={`border-t ${
          isDarkMode ? 'border-gray-700 bg-black' : 'border-gray-200 bg-gray-900'
        } p-3 flex items-center gap-2`}
      >
        <span className="text-green-400 font-mono text-sm">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          disabled={isExecuting}
          className="flex-1 bg-transparent text-green-400 font-mono text-sm focus:outline-none placeholder-gray-600 disabled:opacity-50"
        />
      </div>
    </div>
  );
}
