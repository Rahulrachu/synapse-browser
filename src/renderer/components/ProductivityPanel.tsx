import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function ProductivityPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [todos, setTodos] = useState<string[]>(['Task 1', 'Task 2']);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <h2 className="text-lg font-bold">Productivity</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {todos.map((todo, i) => (
            <div key={i} className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {todo}
            </div>
          ))}
        </div>
      </div>
      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 flex gap-2`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add todo..."
          className={`flex-1 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
        />
        <button onClick={addTodo} className="px-4 py-2 bg-synapse-accent text-white rounded">
          Add
        </button>
      </div>
    </div>
  );
}
