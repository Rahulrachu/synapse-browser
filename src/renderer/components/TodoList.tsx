import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export default function TodoList() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: newTodoText,
          completed: false,
          createdAt: Date.now(),
        },
      ]);
      setNewTodoText('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold">
          To-Do List ({completedCount}/{todos.length})
        </h2>
      </div>

      {/* Input */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="Add a new task..."
            className={`flex-1 px-3 py-2 rounded border ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
          <button
            onClick={handleAddTodo}
            className="px-3 py-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No tasks yet
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 px-4 py-3 border-b ${
                isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
              } transition`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className="flex-shrink-0 text-synapse-accent hover:text-synapse-accent-light transition"
              >
                {todo.completed ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Circle size={20} />
                )}
              </button>
              <span
                className={`flex-1 ${
                  todo.completed
                    ? 'line-through text-gray-500'
                    : isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="flex-shrink-0 p-1 rounded hover:bg-red-500 hover:text-white transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
