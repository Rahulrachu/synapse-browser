import React, { useEffect, useState } from 'react';
import { KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

type Entry = { id: string; name: string; username: string; url?: string; updatedAt: number };

type Draft = { name: string; username: string; password: string; url: string };
const emptyDraft: Draft = { name: '', username: '', password: '', url: '' };

export default function PasswordManagerPanel() {
  const isDarkMode = useWorkspaceStore(state => state.isDarkMode);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [message, setMessage] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const refresh = async () => {
    const result = await window.electron.ipcRenderer.invoke('passwords:list');
    setEntries(result || []);
  };

  useEffect(() => { void refresh(); }, []);

  const save = async () => {
    if (!draft.name.trim() || !draft.username.trim() || !draft.password) return;
    await window.electron.ipcRenderer.invoke('passwords:save', draft);
    setDraft(emptyDraft);
    setMessage('Saved in encrypted Windows secure storage.');
    await refresh();
  };

  const remove = async (id: string) => {
    await window.electron.ipcRenderer.invoke('passwords:delete', id);
    await refresh();
  };

  const autofill = async () => {
    if (!confirmId) return;
    try {
      await window.electron.ipcRenderer.invoke('passwords:autofill', confirmId);
      setMessage('Credentials filled into the active page.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Autofill failed.');
    } finally {
      setConfirmId(null);
    }
  };

  const field = (key: keyof Draft, placeholder: string, type = 'text') => (
    <input type={type} value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className={`w-full rounded border px-3 py-2 text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-300 bg-white text-gray-900'}`} />
  );

  return <section className={`flex h-full flex-col ${isDarkMode ? 'bg-synapse-darker text-white' : 'bg-white text-gray-900'}`}>
    <header className={`flex items-center justify-between border-b p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2"><KeyRound size={20} className="text-synapse-accent" /><div><h2 className="text-lg font-bold">Password Manager</h2><p className="text-xs opacity-60">Encrypted local credentials</p></div></div>
      <ShieldCheck size={18} className="text-emerald-500" aria-label="Encrypted storage" />
    </header>
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <div className={`rounded-lg border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50'}`}>
        <h3 className="mb-3 font-semibold">Add login</h3>
        <div className="grid gap-2">{field('name', 'Name, e.g. YouTube')}{field('url', 'Website URL (optional)')}{field('username', 'Username or email')}{field('password', 'Password', 'password')}</div>
        <button onClick={() => void save()} disabled={!draft.name.trim() || !draft.username.trim() || !draft.password} className="mt-3 inline-flex items-center gap-2 rounded bg-synapse-accent px-3 py-2 text-sm text-white disabled:opacity-40"><Plus size={16} />Save login</button>
      </div>
      {message && <p className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600">{message}</p>}
      <div className="space-y-2">{entries.length === 0 ? <p className="text-sm opacity-60">No saved logins yet.</p> : entries.map(entry => <div key={entry.id} className={`flex items-center justify-between rounded-lg border p-3 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200'}`}><div><p className="font-medium">{entry.name}</p><p className="text-xs opacity-60">{entry.username}{entry.url ? ` · ${entry.url}` : ''}</p></div><div className="flex gap-2"><button onClick={() => setConfirmId(entry.id)} className="rounded border border-synapse-accent px-2 py-1 text-xs text-synapse-accent">Autofill</button><button onClick={() => void remove(entry.id)} aria-label={`Delete ${entry.name}`} className="rounded p-1 text-red-500 hover:bg-red-500/10"><Trash2 size={16} /></button></div></div>)}</div>
    </div>
    <footer className="border-t p-3 text-center text-[11px] opacity-60">ORION must receive your explicit approval before credentials are filled.</footer>
    {confirmId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className={`w-full max-w-sm rounded-xl p-5 shadow-xl ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}><h3 className="font-semibold">Confirm autofill</h3><p className="mt-2 text-sm opacity-70">Fill this saved login into the active website? The password will not be shown in the panel.</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => setConfirmId(null)} className="rounded px-3 py-2 text-sm opacity-70">Cancel</button><button onClick={() => void autofill()} className="rounded bg-synapse-accent px-3 py-2 text-sm text-white">Confirm autofill</button></div></div></div>}
  </section>;
}
