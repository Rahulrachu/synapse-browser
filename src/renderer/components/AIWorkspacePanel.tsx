import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Send, Loader } from 'lucide-react';

export default function AIWorkspacePanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = { role: 'user', content: input };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      setIsLoading(true);
      
      try {
        const response = await window.electron.ipcRenderer.invoke(
          'ai:chat', 
          'openai-default',
          newMessages.map(m => ({ role: m.role, content: m.content }))
        );
        
        const assistantMessage = { 
          role: 'assistant', 
          content: typeof response === 'string' ? response : (response.content || 'No response received') 
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('AI Workspace Error:', error);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request.' 
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker text-white' : 'bg-white text-gray-900'}`}>
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
        {isLoading && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Loader className="animate-spin text-synapse-accent" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 flex gap-2`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI..."
          disabled={isLoading}
          className={`flex-1 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
        />
        <button 
          onClick={handleSend} 
          disabled={isLoading || !input.trim()}
          className={`p-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
