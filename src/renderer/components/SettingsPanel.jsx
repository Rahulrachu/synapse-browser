import { useEffect, useState } from "react";
import { Settings, X } from "lucide-react";
import { ProviderSelect } from "./ProviderSelect";

export function SettingsPanel({ onClose }) {
  const [reduceMotion, setReduceMotion] = useState(
    () => localStorage.getItem("synapse.reduceMotion") === "true",
  );
  const [showDevtools, setShowDevtools] = useState(
    () => localStorage.getItem("synapse.showDevtools") === "true",
  );
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const update = (key, value) => {
    localStorage.setItem(key, String(value));
  };
  useEffect(() => {
    if (!window.electron) return;
    void window.electron
      .invoke("agent:get-config")
      .then((config) => {
        setAiConfigured(Boolean(config?.configured));
        setProvider(config?.provider || "openai");
        setBaseUrl(config?.baseUrl || "https://api.openai.com/v1");
        setModel(config?.model || "gpt-4.1-mini");
      })
      .catch(() => setAiMessage("Unable to read AI configuration."));
  }, []);
  const resetAIConfig = async () => {
    if (!window.electron) return;
    try {
      await window.electron.invoke("agent:reset-config");
      setAiConfigured(false);
      setApiKey("");
      setProvider("openai");
      setBaseUrl("https://api.openai.com/v1");
      setModel("gpt-4.1-mini");
      setAiMessage("AI configuration and saved credential removed.");
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "Unable to reset AI configuration.");
    }
  };
  const saveAIConfig = async () => {
    if (!window.electron) return;
    try {
      const request = {
        provider,
        baseUrl,
        model,
      };
      if (apiKey.trim()) request.apiKey = apiKey.trim();
      const saved = await window.electron.invoke("agent:set-config", request);
      setAiConfigured(Boolean(saved?.configured));
      setApiKey("");
      setAiMessage(
        saved?.configured ? "AI provider saved securely for this profile." : "AI provider key cleared.",
      );
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "Unable to save AI configuration.");
    }
  };
  return (
    <div
      className="synapse-modal-backdrop absolute inset-0 z-20 flex items-center justify-center p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <section
        className="synapse-surface-raised synapse-modal max-h-full w-full max-w-xl overflow-auto rounded-2xl p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Settings</h2>
            <p className="mt-1 text-xs text-white/40">Preferences are saved locally for this profile.</p>
          </div>
          <button
            type="button"
            aria-label="Close Settings"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 pt-5">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <span>
              <span className="block text-sm text-white">Reduce motion</span>
              <span className="mt-1 block text-xs text-white/40">
                Use shorter transitions throughout the workspace.
              </span>
            </span>
            <input
              aria-label="Reduce motion"
              type="checkbox"
              checked={reduceMotion}
              onChange={(event) => {
                setReduceMotion(event.target.checked);
                update("synapse.reduceMotion", event.target.checked);
              }}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <span>
              <span className="block text-sm text-white">Developer tools on startup</span>
              <span className="mt-1 block text-xs text-white/40">
                Remember the developer-tools preference for the next launch.
              </span>
            </span>
            <input
              aria-label="Developer tools on startup"
              type="checkbox"
              checked={showDevtools}
              onChange={(event) => {
                setShowDevtools(event.target.checked);
                update("synapse.showDevtools", event.target.checked);
              }}
            />
          </label>
        </div>
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-white">AI provider</h3>
              <p className="mt-1 text-xs text-white/40">
                {aiConfigured
                  ? "Configured. Enter a new key only when replacing it."
                  : "Add an OpenAI-compatible API key to run ORION."}
              </p>
            </div>
            <span
              className={`text-[10px] uppercase tracking-wider ${aiConfigured ? "text-emerald-300" : "text-amber-200"}`}
            >
              {aiConfigured ? "Configured" : "Needs setup"}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <ProviderSelect value={provider} onChange={setProvider} />
            <input
              aria-label="OpenAI API key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={aiConfigured ? "••••••••  (saved key)" : "sk-…"}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-white/30"
            />
            <input
              aria-label="AI base URL"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-white/30"
            />
            <input
              aria-label="AI model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="gpt-4.1-mini"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-white/30"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-white/35">The key is never returned to the renderer.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void resetAIConfig()}
                className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/60 hover:bg-white/10"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => void saveAIConfig()}
                className="rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-black hover:bg-white/90"
              >
                Save AI settings
              </button>
            </div>
          </div>
          {aiMessage && <p className="mt-3 text-[11px] text-white/55">{aiMessage}</p>}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-black hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
