import React, { useEffect, useMemo, useState } from 'react';

const providers = [
  { id: 'openai', name: 'OpenAI', short: 'OAI', needsKey: true, defaultUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', note: 'Use an API key. A consumer ChatGPT subscription does not automatically provide API access.' },
  { id: 'google', name: 'Google Gemini', short: 'G', needsKey: true, defaultUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash', note: 'Use a Gemini API key from Google AI Studio.' },
  { id: 'anthropic', name: 'Anthropic Claude', short: 'A', needsKey: true, defaultUrl: 'https://api.anthropic.com', model: 'claude-3-5-haiku-latest', note: 'Use an Anthropic API key. A consumer Claude subscription is separate from API access.' },
  { id: 'openrouter', name: 'OpenRouter', short: 'OR', needsKey: true, defaultUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4.1-mini', note: 'Use an OpenRouter API key and select an available routed model.' },
  { id: 'groq', name: 'Groq', short: 'G', needsKey: true, defaultUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', note: 'Use a Groq API key.' },
  { id: 'ollama', name: 'Ollama / local', short: 'OL', needsKey: false, defaultUrl: 'http://127.0.0.1:11434/v1', model: 'llama3.2', note: 'No API key is required. Ollama must be running locally.' },
  { id: 'custom', name: 'Custom endpoint', short: 'C', needsKey: true, defaultUrl: 'https://your-provider.example/v1', model: 'your-model', note: 'Use the provider’s API key, endpoint, and model.' },
] as const;

type ProviderId = typeof providers[number]['id'];
type Stage = 'boot' | 'welcome' | 'setup' | 'complete';

const bootSteps = ['INITIALIZING SYNAPSE', 'LOADING BROWSER ENGINE', 'CONNECTING WORKSPACE', 'INITIALIZING ORION', 'SECURING LOCAL PROFILE'];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>('boot');
  const [bootIndex, setBootIndex] = useState(-1);
  const [provider, setProvider] = useState<ProviderId>('openai');
  const selected = useMemo(() => providers.find(item => item.id === provider) || providers[0], [provider]);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState<string>(selected.defaultUrl);
  const [model, setModel] = useState<string>(selected.model);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('synapse.reduceMotion') === 'true');

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(localStorage.getItem('synapse.reduceMotion') === 'true' || Boolean(media?.matches));
    update(); media?.addEventListener?.('change', update);
    return () => media?.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (stage !== 'boot') return;
    const interval = window.setInterval(() => setBootIndex(current => Math.min(current + 1, bootSteps.length)), reducedMotion ? 80 : 280);
    const timeout = window.setTimeout(() => setStage('welcome'), reducedMotion ? 180 : 2100);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [stage, reducedMotion]);

  useEffect(() => {
    const next = providers.find(item => item.id === provider) || providers[0];
    setBaseUrl(next.defaultUrl); setModel(next.model); setApiKey(''); setStatus('');
  }, [provider]);

  const finish = () => { localStorage.setItem('synapse.onboardingComplete', 'true'); onComplete(); };
  const skip = () => finish();
  const saveConfig = async (test: boolean) => {
    if (!window.electron) { setStatus('AI setup is available in the desktop application.'); return false; }
    if (selected.needsKey && !apiKey.trim()) { setStatus('Enter an API key or choose Skip Setup.'); return false; }
    setBusy(true); setStatus(test ? 'Testing secure connection…' : 'Saving secure setup…');
    try {
      const saved = await window.electron.invoke('agent:set-config', { provider, apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim(), enabled: true });
      if (test) {
        const result = await window.electron.invoke('agent:test-connection', { provider, apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() });
        if (!result?.ok) throw new Error(result?.message || 'Provider connection failed.');
        setStatus('CONNECTED · ORION is ready.');
      } else setStatus(saved?.configured || !selected.needsKey ? 'AI setup saved.' : 'Setup saved.');
      localStorage.setItem('synapse.onboardingComplete', 'true');
      return true;
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to save or test this provider.'); return false; } finally { setBusy(false); }
  };

  const stageClass = `onboarding-stage onboarding-stage-${stage} ${reducedMotion ? 'onboarding-reduced-motion' : ''}`;

  if (stage === 'boot') return <main className={stageClass} aria-label="Synapse Browser startup" aria-live="polite">
    <div className="onboarding-ambient onboarding-ambient-boot" aria-hidden="true" />
    <div className="onboarding-boot-mark" aria-hidden="true"><span>S</span><i /><i /><i /></div>
    <div className="onboarding-boot-copy"><p className="onboarding-eyebrow">SYNAPSE</p><p className="onboarding-tagline">THINK. BROWSE. CREATE.</p><div className="onboarding-boot-status" aria-label="Synapse startup progress">{bootSteps.map((item, index) => <span key={item} className={index <= bootIndex ? 'is-complete' : ''}><b>{index <= bootIndex ? '✓' : '·'}</b>{item}</span>)}</div></div>
  </main>;

  return <main className={stageClass} aria-label="Welcome to Synapse Browser">
    <div className="onboarding-ambient" aria-hidden="true"><span /><span /><span /></div>
    <div className="onboarding-orbit onboarding-orbit-one" aria-hidden="true" /><div className="onboarding-orbit onboarding-orbit-two" aria-hidden="true" />
    <section className="onboarding-card" role="region" aria-label={stage === 'setup' ? 'Connect an AI provider' : 'Welcome to Synapse Browser'}>
      <div className="onboarding-card-glow" aria-hidden="true" />
      <div className="onboarding-card-header"><div className="onboarding-logo" aria-hidden="true">S</div><div><p className="onboarding-eyebrow">SYNAPSE BROWSER</p><p className="onboarding-step">{stage === 'welcome' ? 'A new way to work online' : stage === 'setup' ? '01 / CONNECT YOUR INTELLIGENCE' : 'SYNAPSE CORE ONLINE'}</p></div><div className="onboarding-signal" aria-hidden="true"><span /><span /><span /></div></div>
      {stage === 'welcome' && <div className="onboarding-content onboarding-content-welcome"><p className="onboarding-kicker">Your browser, with an AI that can actually work with you.</p><h1>Welcome to Synapse Browser</h1><p className="onboarding-description">A focused browser and workspace for thinking, browsing, and creating—with ORION ready to observe, act, and verify alongside you.</p><div className="onboarding-capabilities" aria-label="Synapse capabilities"><span><b>01</b> Browse</span><span><b>02</b> Create</span><span><b>03</b> Automate safely</span></div><div className="onboarding-actions"><button type="button" onClick={skip} className="onboarding-button onboarding-button-quiet">Skip Setup</button><button type="button" onClick={() => setStage('setup')} className="onboarding-button onboarding-button-primary">Get Started <span aria-hidden="true">→</span></button></div><p className="onboarding-footnote">You can configure AI later from Settings. Your local profile stays yours.</p></div>}
      {stage === 'setup' && <div className="onboarding-content onboarding-content-setup"><p className="onboarding-kicker">Choose how Synapse should think.</p><h1>Let’s connect your AI</h1><p className="onboarding-description">ORION uses your provider directly. Credentials are handled securely in the desktop main process and are never returned to the renderer.</p><div className="onboarding-provider-grid" role="radiogroup" aria-label="AI provider">{providers.map(item => <button key={item.id} type="button" role="radio" aria-checked={provider === item.id} onClick={() => setProvider(item.id)} className={`onboarding-provider ${provider === item.id ? 'is-selected' : ''}`}><span className="onboarding-provider-icon" aria-hidden="true">{item.short}</span><span>{item.name}</span>{provider === item.id && <b aria-hidden="true">✓</b>}</button>)}</div><p className="onboarding-provider-note">{selected.note}</p><div className="onboarding-fields"><label><span>API KEY</span><input aria-label="Onboarding API key" type="password" autoComplete="off" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder={selected.needsKey ? 'Paste your provider key' : 'No key required'} disabled={!selected.needsKey} /></label><label><span>MODEL</span><input aria-label="Onboarding model" value={model} onChange={event => setModel(event.target.value)} placeholder="Model" /></label><label className="onboarding-field-wide"><span>BASE URL</span><input aria-label="Onboarding base URL" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder="https://api.openai.com/v1" /></label></div>{status && <p className={`onboarding-status ${status.includes('CONNECTED') || status.includes('saved') ? 'is-success' : 'is-warning'}`} role="status">{status}</p>}<div className="onboarding-actions onboarding-actions-setup"><button type="button" onClick={() => setStage('welcome')} className="onboarding-button onboarding-button-quiet">Back</button><div className="onboarding-action-group"><button type="button" onClick={() => void saveConfig(true)} disabled={busy} className="onboarding-button onboarding-button-outline">{busy ? 'Working…' : 'Test Connection'}</button><button type="button" onClick={() => void saveConfig(false).then(ok => { if (ok) setStage('complete'); })} disabled={busy} className="onboarding-button onboarding-button-primary">Save and Continue <span aria-hidden="true">→</span></button></div></div></div>}
      {stage === 'complete' && <div className="onboarding-content onboarding-content-complete"><div className="onboarding-connected-mark" aria-hidden="true">✓</div><p className="onboarding-kicker">AI CONNECTED · SYNAPSE CORE ONLINE</p><h1>Ready when you are.</h1><p className="onboarding-description">ORION is ready to browse, inspect, and act with you. You can change providers or credentials any time from Settings.</p><div className="onboarding-ready-line"><span /><b>ORION</b><em>READY</em></div><div className="onboarding-actions onboarding-actions-end"><button type="button" onClick={finish} className="onboarding-button onboarding-button-primary">Open Synapse Browser <span aria-hidden="true">→</span></button></div></div>}
    </section>
  </main>;
}
