import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  text: string;
}

export default function Terminal() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '0',
      type: 'output',
      text: 'Synapse Browser Terminal v1.0.0',
    },
    {
      id: '1',
      type: 'output',
      text: 'Type commands here...',
    },
  ]);
  const [input, setInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleCommand = (command: string) => {
    if (!command.trim()) return;

    const newId = Date.now().toString();
    setLines((prev) => [
      ...prev,
      { id: newId, type: 'input', text: `$ ${command}` },
    ]);

    // Simulate command execution
    setTimeout(() => {
      let output = '';
      if (command.startsWith('echo ')) {
        output = command.substring(5);
      } else if (command === 'help') {
        output = 'Available commands: echo, help, clear, ls, pwd';
      } else if (command === 'clear') {
        setLines([]);
        setInput('');
        return;
      } else if (command === 'ls') {
        output = 'src/  public/  package.json  README.md';
      } else if (command === 'pwd') {
        output = '/home/synapse-browser';
      } else {
        output = `Command not found: ${command}`;
      }

      setLines((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'output', text: output },
      ]);
    }, 100);

    setInput('');
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <TerminalIcon size={18} />
          Terminal
        </h2>
        <button className="p-1 rounded hover:bg-red-500 hover:text-white transition">
          <X size={18} />
        </button>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className={`flex-1 overflow-y-auto p-4 font-mono text-sm ${
          isDarkMode ? 'bg-black text-green-400' : 'bg-gray-900 text-green-400'
        }`}
      >
        {lines.map((line) => (
          <div key={line.id} className={line.type === 'error' ? 'text-red-400' : ''}>
            {line.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-black' : 'border-gray-300 bg-gray-900'} px-4 py-2 flex items-center gap-2`}>
        <span className="text-green-400 font-mono">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCommand(input);
            }
          }}
          className="flex-1 bg-transparent text-green-400 font-mono outline-none"
          autoFocus
        />
      </div>
    </div>
  );
}
