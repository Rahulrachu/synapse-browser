import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, History, Sparkles, ChevronDown, CheckCircle2, Search, Wrench, AlertCircle, Loader2, X, Copy, Plus } from 'lucide-react';

export default function AIWorkspacePanel() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, events]);

  useEffect(() => {
    return window.electron.on('agent:event', (event: any) => {
      setEvents(prev => [...prev.slice(-20), event]);
      if (event.type === 'assistant') {
        setMessages(prev => [...prev, { role: 'assistant', content: event.message }]);
      }
      if (event.type === 'done' || event.type === 'error') {
        setIsLoading(false);
      }
    });
  }, []);

  const handleRun = async () => {
    if (!input.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setIsLoading(true);
    setEvents([]);
    await window.electron.invoke('agent:run', { goal: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f14] text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-synapse-accent" />
          <h2 className="text-sm font-semibold">AI Workspace</h2>
        </div>
        <div className="flex gap-2">
          <History size={16} className="text-gray-500 cursor-pointer hover:text-white" />
          <X size={16} className="text-gray-500 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-2">
        <button className="px-4 py-2 text-xs font-medium border-b-2 border-synapse-accent">Chat</button>
        <button className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-300">Context</button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar no-scrollbar">
        {messages.length === 0 && (
          <div className="bg-[#1a1d24]/50 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-400 leading-relaxed">
              What are the latest advancements in WebAssembly and how are they impacting web development?
            </p>
            <div className="mt-2 text-[10px] text-gray-600">10:42 AM</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-xl text-xs ${
              msg.role === 'user' ? 'bg-synapse-accent text-white' : 'bg-[#1a1d24] border border-white/5'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Execution Trace - Image 1 Style */}
        <div className="bg-[#1a1d24]/30 rounded-xl border border-white/5 overflow-hidden">
          <div className="px-3 py-2 bg-white/5 flex items-center justify-between text-[10px] font-semibold text-gray-400">
            <div className="flex items-center gap-2">
              <ChevronDown size={12} />
              <span>Execution trace</span>
            </div>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-green-500">
              <CheckCircle2 size={12} />
              <span>Understanding the request</span>
              <span className="ml-auto text-gray-600">10:42:11 AM</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-green-500">
              <CheckCircle2 size={12} />
              <span>Searching for latest WebAssembly advanc...</span>
              <span className="ml-auto text-gray-600">10:42:12 AM</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-green-500">
              <CheckCircle2 size={12} />
              <span>Analyzing 12 sources</span>
              <span className="ml-auto text-gray-600">10:42:21 AM</span>
            </div>
          </div>
        </div>

        {/* Research Sources - Image 1 Style */}
        <div className="bg-[#1a1d24]/30 rounded-xl border border-white/5 overflow-hidden">
          <div className="px-3 py-2 bg-white/5 flex items-center justify-between text-[10px] font-semibold text-gray-400">
            <div className="flex items-center gap-2">
              <ChevronDown size={12} />
              <span>Research sources</span>
              <span className="bg-white/10 px-1.5 rounded-full ml-1">12</span>
            </div>
            <Copy size={12} className="cursor-pointer hover:text-white" />
          </div>
          <div className="p-2 space-y-1">
            <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-black font-bold text-[10px]">M</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium truncate">WebAssembly | MDN</div>
                <div className="text-[9px] text-gray-500 truncate">developer.mozilla.org</div>
              </div>
              <div className="text-[9px] text-synapse-accent">MDN</div>
            </div>
            <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="w-6 h-6 bg-[#24292e] rounded flex items-center justify-center text-white font-bold text-[10px]">G</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium truncate">WebAssembly Roadmap (2024)</div>
                <div className="text-[9px] text-gray-500 truncate">github.com/WebAssembly/roadmap</div>
              </div>
              <div className="text-[9px] text-gray-400">GitHub</div>
            </div>
          </div>
        </div>

        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-[#0d0f14]">
        <div className="bg-[#1a1d24] border border-white/10 rounded-xl p-3 focus-within:border-synapse-accent/50 transition-all">
          <textarea 
            rows={2}
            className="w-full bg-transparent border-none outline-none text-xs resize-none placeholder-gray-600"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleRun()}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2 text-gray-500">
              <Plus size={14} className="hover:text-white cursor-pointer" />
              <Search size={14} className="hover:text-white cursor-pointer" />
              <Wrench size={14} className="hover:text-white cursor-pointer" />
            </div>
            <button 
              className={`p-1.5 rounded-lg transition-all ${
                input.trim() ? 'bg-synapse-accent text-white shadow-lg shadow-synapse-accent/20' : 'bg-gray-800 text-gray-600'
              }`}
              onClick={handleRun}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
