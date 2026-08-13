import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Check, ChevronDown, Circle, Loader2, ShieldAlert, Square, Sparkles, X } from 'lucide-react';

type AgentEvent = { runId: string; type: string; message: string; data?: any; at: number };
type TaskState = { phase?: string; currentOrigin?: string; confidence?: number; remainingSteps?: number; recoveryAttempts?: number };

const statusLabel: Record<string, string> = {
  plan: 'Planning the next step',
  'tool-start': 'Working on the website',
  'tool-result': 'Verifying the result',
  assistant: 'Preparing the result',
  error: 'Needs attention',
  done: 'Finished',
};

export default function AIWorkspacePanel() {
  const [goal, setGoal] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<AgentEvent | null>(null);

  useEffect(() => window.electron.on('agent:event', (event: AgentEvent) => {
    if (runId && event.runId !== runId) return;
    setRunId(current => current || event.runId);
    setEvents(current => [...current.slice(-24), event]);
    if (event.type === 'confirmation') setConfirmation(event);
    if (event.type === 'done' || event.type === 'error') setRunning(false);
  }), [runId]);

  const latest = events[events.length - 1];
  const status = latest ? statusLabel[latest.type] || 'Working' : 'Ready when you are';
  const statusMessage = latest?.message || 'Tell ORION what you want to do on the current website.';
  const taskState: TaskState = latest?.data?.state || {};
  const confidence = typeof taskState.confidence === 'number' ? `${Math.round(taskState.confidence * 100)}%` : '—';
  const originLabel = taskState.currentOrigin ? taskState.currentOrigin.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'No origin yet';
  const confirmationAction = confirmation?.data?.action;
  const confirmationTarget = confirmationAction?.target;
  const confirmationText = useMemo(() => {
    if (!confirmationTarget) return 'This action may cause an external side effect.';
    return [confirmationTarget.name, confirmationTarget.label, confirmationTarget.text].filter(Boolean).join(' ') || 'the requested website action';
  }, [confirmationTarget]);

  const handleRun = async () => {
    const trimmed = goal.trim();
    if (!trimmed || running) return;
    setEvents([]);
    setConfirmation(null);
    setRunning(true);
    const result = await window.electron.invoke('agent:run', { goal: trimmed });
    setRunId(result?.runId || null);
  };

  const handleStop = async () => {
    if (!runId) return;
    await window.electron.invoke('agent:cancel', runId);
    setConfirmation(null);
    setRunning(false);
  };

  const handleConfirmation = async (confirmed: boolean) => {
    if (!runId) return;
    setConfirmation(null);
    await window.electron.invoke('agent:confirm', { runId, confirmed });
  };

  return (
    <section className="flex h-full flex-col bg-black text-white" aria-label="ORION browser agent">
      <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white shadow-[0_0_24px_rgba(255,255,255,0.06)]"><Sparkles size={15} /></div>
          <div><h2 className="text-[13px] font-semibold tracking-[0.16em] text-white">ORION</h2><p className="mt-0.5 text-[10px] text-white/40">Browser agent</p></div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/40"><Circle size={7} className={running ? 'fill-emerald-400 text-emerald-400' : 'fill-white/30 text-white/30'} />{running ? 'LIVE' : 'IDLE'}</div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-8">
        <div className="mx-auto max-w-[330px]">
          <div className="mb-8 text-center"><p className="text-[11px] uppercase tracking-[0.22em] text-white/35">What do you want me to do?</p><p className="mt-3 text-xs leading-5 text-white/45">ORION observes the current website, acts, verifies each step, and pauses when your approval is needed.</p></div>

          <div className="rounded-2xl border border-white/10 bg-[#050505] p-3 shadow-[0_14px_60px_rgba(0,0,0,0.48)] focus-within:border-white/25">
            <textarea aria-label="What do you want me to do?" value={goal} onChange={e => setGoal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleRun(); } }} rows={4} disabled={running} placeholder="Tell me what you want to do…" className="w-full resize-none bg-transparent px-1 py-1 text-[13px] leading-6 text-white outline-none placeholder:text-white/25 disabled:opacity-50" />
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3"><span className="text-[10px] text-white/25">Enter to run · Shift + Enter for a new line</span><button aria-label={running ? 'Stop ORION' : 'Run ORION'} onClick={running ? handleStop : handleRun} disabled={!running && !goal.trim()} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition ${running ? 'bg-white/10 text-white hover:bg-white/15' : goal.trim() ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white/25'}`}>{running ? <><Square size={12} fill="currentColor" />Stop</> : <><Activity size={13} />Run</>}</button></div>
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3"><div className="flex items-center gap-2 text-[11px] text-white/65">{running ? <Loader2 size={13} className="animate-spin text-white" /> : latest?.type === 'done' ? <Check size={13} className="text-emerald-400" /> : <Circle size={8} className="fill-white/30 text-white/30" />}<span>{status}</span><span className="ml-auto text-[10px] text-white/25">{events.length ? `${events.length} updates` : ''}</span></div><p className="mt-2 truncate text-[11px] text-white/40">{statusMessage}</p><div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-[9px] uppercase tracking-[0.12em] text-white/25"><span><span className="block text-white/55">Phase</span>{taskState.phase || 'ready'}</span><span><span className="block text-white/55">Confidence</span>{confidence}</span><span className="text-right"><span className="block text-white/55">Steps</span>{typeof taskState.remainingSteps === 'number' ? taskState.remainingSteps : '—'}</span></div><p className="mt-2 truncate text-[10px] text-white/25">{originLabel}</p></div>

          {confirmation && <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[0.06] p-4"><div className="flex gap-3"><ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-200" /><div><p className="text-[12px] font-medium text-amber-100">Confirmation required</p><p className="mt-2 text-[11px] leading-5 text-white/55">ORION is ready to activate <span className="text-white/85">{confirmationText}</span>. This may cause an external side effect.</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => void handleConfirmation(false)} className="rounded-lg px-3 py-2 text-[11px] text-white/55 hover:bg-white/10">Cancel</button><button onClick={() => void handleConfirmation(true)} className="rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-black hover:bg-white/90">Confirm</button></div></div></div></div>}

          <button onClick={() => setDetailsOpen(value => !value)} className="mt-5 flex w-full items-center justify-between border-t border-white/[0.07] pt-4 text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60"><span>Details</span><ChevronDown size={13} className={detailsOpen ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>
          {detailsOpen && <div className="mt-3 space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">{events.length === 0 ? <p className="text-[10px] text-white/30">No run details yet.</p> : events.map((event, index) => <div key={`${event.at}-${index}`} className="flex gap-2 text-[10px] leading-4 text-white/40"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" /><span>{event.message}</span></div>)}</div>}
        </div>
      </div>
      <footer className="border-t border-white/[0.07] px-5 py-3 text-center text-[9px] tracking-wide text-white/20"><span className="inline-flex items-center gap-1.5"><ShieldAlert size={10} />Consequential actions always require your confirmation</span></footer>
    </section>
  );
}
