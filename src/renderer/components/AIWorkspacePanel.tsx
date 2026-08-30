import React, { useMemo, useState } from 'react';
import { CheckCircle2, CircleHelp, FilePlus2, Send, ShieldAlert } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

type Message = { role: 'user' | 'assistant'; content: string; question?: boolean };

export default function AIWorkspacePanel() {
  const isDarkMode = useWorkspaceStore(state => state.isDarkMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [waitingForReply, setWaitingForReply] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [fileMessage, setFileMessage] = useState('');

  const latestAssistant = useMemo(() => [...messages].reverse().find(message => message.role === 'assistant'), [messages]);
  const conversationText = messages.map(message => `${message.role === 'user' ? 'You' : 'Synapse'}: ${message.content}`).join('\n\n');

  const handleSend = () => {
    const text = (waitingForReply ? reply : input).trim();
    if (!text) return;
    if (waitingForReply) {
      setMessages(current => [...current, { role: 'user', content: text }, { role: 'assistant', content: 'Thanks. I have your answer and can continue the task.' }]);
      setReply('');
      setWaitingForReply(false);
      return;
    }
    setMessages(current => [...current, { role: 'user', content: text }]);
    setInput('');
    window.setTimeout(() => {
      const asksForApproval = /\b(confirm|approve|should I|do you want|shall I|yes or no)\b/i.test(text);
      const response = asksForApproval
        ? 'I need your approval before I continue. Should I proceed with this action?'
        : `I’m ready to work on “${text}”. Tell me if you want me to continue, change the plan, or stop.`;
      setMessages(current => [...current, { role: 'assistant', content: response, question: true }]);
      setWaitingForReply(true);
    }, 400);
  };

  const markCompleted = () => {
    setCompleted(true);
    setWaitingForReply(false);
    setMessages(current => [...current, { role: 'assistant', content: 'Task completed successfully.' }]);
  };

  const saveConversation = async () => {
    if (!conversationText) return;
    try {
      const result = await window.electron.ipcRenderer.invoke('save-file-as', { defaultPath: 'synapse-task.txt', content: conversationText });
      setFileMessage(result?.canceled ? 'Save canceled.' : `Saved: ${result.filePath}`);
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : 'Unable to save the file.');
    }
  };

  return <section className={`flex h-full flex-col ${isDarkMode ? 'bg-synapse-darker text-white' : 'bg-white text-gray-900'}`} aria-label="Synapse AI assistant">
    <header className={`flex items-center justify-between border-b p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div><h2 className="text-lg font-bold">AI Workspace</h2><p className="text-xs opacity-60">Ask Synapse to work with you</p></div>
      {completed && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-500"><CheckCircle2 size={14} /> Completed</span>}
    </header>
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {completed && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-600"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} />Task completed</div><p className="mt-1 text-xs opacity-80">Synapse finished this task. You can save the result or start another request.</p></div>}
      {messages.length === 0 && <div className="flex h-full min-h-40 items-center justify-center text-center text-sm opacity-60"><p>Tell Synapse what to do, then answer any question it asks.</p></div>}
      {messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-lg p-3 text-sm ${message.role === 'user' ? 'bg-synapse-accent text-white' : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>{message.question && <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-amber-500"><CircleHelp size={14} />Response needed</div>}{message.content}</div></div>)}
      {latestAssistant?.role === 'assistant' && !completed && <button onClick={markCompleted} className="inline-flex items-center gap-2 rounded border border-emerald-500/40 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-500/10"><CheckCircle2 size={14} />Mark task completed</button>}
      {conversationText && <button onClick={() => void saveConversation()} className="inline-flex items-center gap-2 rounded border border-synapse-accent/40 px-3 py-2 text-xs text-synapse-accent hover:bg-synapse-accent/10"><FilePlus2 size={14} />Save conversation as file</button>}
      {fileMessage && <p className="text-xs opacity-60">{fileMessage}</p>}
    </div>
    {waitingForReply && !completed && <div className={`border-t p-4 ${isDarkMode ? 'border-gray-700 bg-amber-500/5' : 'border-gray-200 bg-amber-50'}`}><label className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-600"><ShieldAlert size={15} />Synapse is waiting for your reply</label><div className="flex gap-2"><input autoFocus value={reply} onChange={event => setReply(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') handleSend(); }} placeholder="Type your answer…" className={`flex-1 rounded px-3 py-2 text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'}`} /><button onClick={handleSend} className="rounded bg-synapse-accent px-3 py-2 text-white" aria-label="Send reply"><Send size={16} /></button></div></div>}
    {!waitingForReply && !completed && <div className={`border-t p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}><div className="flex gap-2"><input autoFocus value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') handleSend(); }} placeholder="Ask AI…" className={`flex-1 rounded px-3 py-2 text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`} /><button onClick={handleSend} className="rounded bg-synapse-accent px-3 py-2 text-white" aria-label="Send prompt"><Send size={16} /></button></div></div>}
  </section>;
}
