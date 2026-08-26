import React, { useState } from 'react';

const providers = [
  { id: 'openai', name: 'OpenAI', needsKey: true, defaultUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', note: 'Use an API key. A consumer ChatGPT subscription does not automatically provide API access.' },
  { id: 'google', name: 'Google Gemini', needsKey: true, defaultUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash', note: 'Use a Gemini API key from Google AI Studio.' },
  { id: 'anthropic', name: 'Anthropic Claude', needsKey: true, defaultUrl: 'https://api.anthropic.com', model: 'claude-3-5-haiku-latest', note: 'Use an Anthropic API key. A consumer Claude subscription is separate from API access.' },
  { id: 'openrouter', name: 'OpenRouter', needsKey: true, defaultUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4.1-mini', note: 'Use an OpenRouter API key and select an available routed model.' },
  { id: 'groq', name: 'Groq', needsKey: true, defaultUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', note: 'Use a Groq API key.' },
  { id: 'ollama', name: 'Ollama / local model', needsKey: false, defaultUrl: 'http://127.0.0.1:11434/v1', model: 'llama3.2', note: 'No API key is required. Ollama must be running locally.' },
  { id: 'custom', name: 'Custom OpenAI-compatible', needsKey: true, defaultUrl: 'https://your-provider.example/v1', model: 'your-model', note: 'Use the provider’s API key, endpoint, and model.' },
] as const;

type ProviderId = typeof providers[number]['id'];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [provider, setProvider] = useState<ProviderId>('openai');
  const selected = providers.find(item => item.id === provider) || providers[0];
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState<string>(selected.defaultUrl);
  const [model, setModel] = useState<string>(selected.model);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const chooseProvider = (id: ProviderId) => {
    const next = providers.find(item => item.id === id) || providers[0];
    setProvider(id); setBaseUrl(next.defaultUrl); setModel(next.model); setApiKey(''); setStatus('');
  };
  const saveConfig = async (test: boolean) => {
    if (!window.electron) { setStatus('AI setup is available in the desktop application.'); return false; }
    if (selected.needsKey && !apiKey.trim()) { setStatus('Enter an API key or choose Skip Setup.'); return false; }
    setBusy(true); setStatus(test ? 'Testing connection…' : 'Saving setup…');
    try {
      const saved = await window.electron.invoke('agent:set-config', { provider, apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim(), enabled: true });
      if (test) {
        const result = await window.electron.invoke('agent:test-connection', { provider, apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() });
        if (!result?.ok) throw new Error(result?.message || 'Provider connection failed.');
        setStatus('Connected successfully.');
      } else { setStatus(saved?.configured || !selected.needsKey ? 'AI setup saved.' : 'Setup saved.'); }
      localStorage.setItem('synapse.onboardingComplete', 'true');
      return true;
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to save or test this provider.'); return false; } finally { setBusy(false); }
  };
  const skip = () => { localStorage.setItem('synapse.onboardingComplete', 'true'); onComplete(); };

  return <main className="flex h-screen w-screen items-center justify-center bg-black px-6 text-white"><section className="glass-panel w-full max-w-2xl p-8" aria-label="Welcome to Synapse Browser">
    <div className="mb-8 flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-bold text-black">S</div><div><p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Synapse Browser</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{step === 0 ? 'Welcome to Synapse Browser' : step === 1 ? 'Connect an AI provider' : 'Ready when you are'}</h1></div></div>
    {step === 0 && <div><p className="max-w-xl text-sm leading-6 text-white/55">A focused desktop browser with integrated AI, workspace tools, and safe automation. You can configure AI now or skip setup and do it later from Settings.</p><div className="mt-10 flex justify-between"><button type="button" onClick={skip} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-white/60 hover:bg-white/10">Skip Setup</button><button type="button" onClick={() => setStep(1)} className="rounded-lg bg-white px-5 py-2.5 text-xs font-medium text-black hover:bg-white/90">Get Started</button></div></div>}
    {step === 1 && <div><p className="text-sm leading-6 text-white/55">Choose how ORION should connect. API authentication is separate from any Synapse Browser account or consumer subscription.</p><label className="mt-6 block text-xs text-white/55">Provider<select aria-label="AI provider" value={provider} onChange={event => chooseProvider(event.target.value as ProviderId)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-3 text-xs text-white outline-none"><option value="openai">OpenAI</option><option value="google">Google Gemini</option><option value="anthropic">Anthropic Claude</option><option value="openrouter">OpenRouter</option><option value="groq">Groq</option><option value="ollama">Ollama / local model</option><option value="custom">Custom OpenAI-compatible</option></select></label><p className="mt-3 text-[11px] leading-5 text-white/40">{selected.note}</p><div className="mt-4 grid gap-2"><input aria-label="Onboarding API key" type="password" autoComplete="off" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder={selected.needsKey ? 'API key' : 'No key required'} disabled={!selected.needsKey} className="rounded-lg border border-white/10 bg-black/50 px-3 py-3 text-xs text-white outline-none disabled:opacity-40" /><input aria-label="Onboarding base URL" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder="Base URL" className="rounded-lg border border-white/10 bg-black/50 px-3 py-3 text-xs text-white outline-none" /><input aria-label="Onboarding model" value={model} onChange={event => setModel(event.target.value)} placeholder="Model" className="rounded-lg border border-white/10 bg-black/50 px-3 py-3 text-xs text-white outline-none" /></div>{status && <p className={`mt-3 text-xs ${status.includes('successfully') || status.includes('saved') ? 'text-emerald-300' : 'text-amber-200'}`}>{status}</p>}<div className="mt-8 flex justify-between"><button type="button" onClick={() => setStep(0)} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs text-white/60 hover:bg-white/10">Back</button><div className="flex gap-2"><button type="button" onClick={() => void saveConfig(true)} disabled={busy} className="rounded-lg border border-white/15 px-4 py-2.5 text-xs text-white/75 disabled:opacity-40">{busy ? 'Working…' : 'Test Connection'}</button><button type="button" onClick={() => void saveConfig(false).then(ok => { if (ok) setStep(2); })} disabled={busy} className="rounded-lg bg-white px-4 py-2.5 text-xs font-medium text-black disabled:opacity-40">Save and Continue</button></div></div></div>}
    {step === 2 && <div><div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5"><p className="text-sm font-medium text-emerald-100">Setup complete</p><p className="mt-2 text-xs leading-5 text-white/55">You can now browse normally. Change providers, replace credentials, or test the connection any time from Settings → AI provider.</p></div><div className="mt-8 flex justify-end"><button type="button" onClick={onComplete} className="rounded-lg bg-white px-5 py-2.5 text-xs font-medium text-black">Open Synapse Browser</button></div></div>}
  </section></main>;
}
