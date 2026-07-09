import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function AIWorkspacePanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      const newMessages = [...messages, { role: 'user', content: input }];
      setMessages(newMessages);
      setInput('');
      
      // Mock AI response
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I am your Synapse AI Assistant. How can I help you today?' }]);
      }, 1000);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <h2 className="text-lg font-bold">AI Workspace</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Start a conversation with Synapse AI</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-synapse-accent text-white' 
                : (isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900')
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 flex gap-2`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI..."
          className={`flex-1 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
        />
        <button onClick={handleSend} className="px-4 py-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light">
          Send
        </button>
      </div>
    </div>
  );
}
