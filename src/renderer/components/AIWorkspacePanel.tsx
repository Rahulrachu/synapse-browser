import React, { useEffect, useRef, useState } from 'react';
import { Loader, Send, Square, Wrench, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

type Message = { role: 'user' | 'assistant'; content: string };
type AgentEvent = { runId: string; type: string; message: string; data?: unknown; at: number };
declare global { interface Window { electron: { invoke: (channel: string, ...args: any[]) => Promise<any>; on: (channel: string, fn: (...args: any[]) => void) => () => void } } }

export default function AIWorkspacePanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [input, setInput] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, events]);
  useEffect(() => window.electron.on('agent:event', (event: AgentEvent) => {
    setEvents((current) => [...current.slice(-39), event]);
    if (event.type === 'assistant') setMessages((current) => [...current, { role: 'assistant', content: event.message }]);
    if (event.type === 'done' || event.type === 'error') { setIsLoading(false); setRunId(null); }
  }), []);
  const run = async () => { const goal = input.trim(); if (!goal || isLoading) return; setMessages((current) => [...current, { role: 'user', content: goal }]); setInput(''); setEvents([]); setIsLoading(true); try { const result = await window.electron.invoke('agent:run', { goal }); setRunId(result.runId || null); } catch (error: any) { setMessages((current) => [...current, { role: 'assistant', content: error?.message || 'Agent failed to start.' }]); setIsLoading(false); } };
  const cancel = async () => { if (runId) await window.electron.invoke('agent:cancel', runId); else setIsLoading(false); };
  const icon = (type: string) => type === 'tool-start' ? <Wrench size={13} /> : type === 'error' ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />;
  return <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker text-white' : 'bg-white text-gray-900'}`}>
    <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}><h2 className="text-lg font-bold">AI Workspace</h2><p className="text-xs text-gray-500">Agent mode: browser, research, workspace, and safe developer tools</p></div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && <div className="h-full flex items-center justify-center text-gray-500 text-center"><p>Ask Synapse to research, inspect, create, or verify a task.</p></div>}
      {messages.map((msg, i) => <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap ${msg.role === 'user' ? 'bg-synapse-accent text-white' : (isDarkMode ? 'bg-gray-800' : 'bg-gray-100')}`}>{msg.content}</div></div>)}
      {events.length > 0 && <div className={`rounded border p-3 text-xs space-y-1 ${isDarkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}><div className="font-semibold mb-2">Execution trace</div>{events.map((event, i) => <div key={`${event.at}-${i}`} className={`flex gap-2 items-start ${event.type === 'error' ? 'text-red-400' : 'text-gray-400'}`}>{icon(event.type)}<span>{event.message}</span></div>)}</div>}
      {isLoading && <div className="flex items-center gap-2 text-xs text-gray-500"><Loader className="animate-spin text-synapse-accent" size={16} /> Working through tools…</div>}
      <div ref={endRef} />
    </div>
    <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 flex gap-2`}><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="Ask AI to execute a task…" disabled={isLoading} className={`flex-1 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-synapse-accent`} />{isLoading ? <button onClick={cancel} className="p-2 bg-red-600 text-white rounded" title="Cancel"><Square size={20} /></button> : <button onClick={run} disabled={!input.trim()} className="p-2 bg-synapse-accent text-white rounded disabled:opacity-50"><Send size={20} /></button>}</div>
  </div>;
}
