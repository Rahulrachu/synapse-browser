import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatPanelProps {
  serviceId: string;
  serviceName: string;
  serviceType: 'chatgpt' | 'gemini' | 'claude' | 'custom';
  conversationId?: string;
}

export default function AIChatPanel({
  serviceId,
  serviceName,
  serviceType,
  conversationId,
}: AIChatPanelProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'get-conversation',
        conversationId
      );
      if (result && result.messages) {
        setMessages(result.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Failed to load conversation history');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Save user message to conversation
      if (conversationId) {
        await window.electron.ipcRenderer.invoke('add-message', {
          conversationId,
          message: userMessage,
        });
      }

      // Send to AI service (this would integrate with AIServiceManager)
      const response = await window.electron.ipcRenderer.invoke(
        'ai-service-send-message',
        {
          serviceId,
          serviceType,
          message: input,
          conversationId,
        }
      );

      const assistantMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content || 'No response received',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to conversation
      if (conversationId) {
        await window.electron.ipcRenderer.invoke('add-message', {
          conversationId,
          message: assistantMessage,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
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
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h3 className="font-semibold text-sm">{serviceName}</h3>
        </div>
        <span className="text-xs text-gray-400">{serviceType}</span>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-3 ${
          isDarkMode ? 'bg-synapse-dark' : 'bg-gray-50'
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-gray-400 text-sm mb-2">No messages yet</p>
              <p className="text-gray-500 text-xs">
                Start a conversation with {serviceName}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.role === 'user'
                      ? isDarkMode
                        ? 'bg-synapse-accent text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`px-3 py-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                >
                  <Loader size={16} className="animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 border-t border-red-300 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div
        className={`border-t ${
          isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-white'
        } p-3`}
      >
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Ctrl+Enter to send)"
            disabled={isLoading}
            className={`flex-1 px-3 py-2 rounded border text-sm resize-none ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent disabled:opacity-50`}
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className={`px-3 py-2 rounded transition ${
              isLoading || !input.trim()
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-synapse-accent text-white hover:bg-synapse-accent-light'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
