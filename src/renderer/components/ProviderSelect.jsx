import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

const providerOptions = [
  {
    value: "openai",
    label: "OpenAI",
  },
  {
    value: "google",
    label: "Google Gemini",
  },
  {
    value: "anthropic",
    label: "Anthropic Claude",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
  },
  {
    value: "groq",
    label: "Groq",
  },
  {
    value: "ollama",
    label: "Ollama / local model",
  },
  {
    value: "custom",
    label: "Custom OpenAI-compatible",
  },
];
export function ProviderSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selectedIndex = Math.max(
    0,
    providerOptions.findIndex((option) => option.value === value),
  );
  const selected = providerOptions[selectedIndex] || providerOptions[0];
  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const choose = (next) => {
    onChange(next);
    setOpen(false);
  };
  return (
    <div ref={rootRef} className="synapse-provider-select relative">
      <button
        type="button"
        role="combobox"
        aria-label="AI provider"
        aria-expanded={open}
        aria-controls="synapse-provider-options"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            choose(
              providerOptions[(selectedIndex + direction + providerOptions.length) % providerOptions.length]
                .value,
            );
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
        className="synapse-provider-trigger flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <span>{selected.label}</span>
        <ChevronRight size={13} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div
          id="synapse-provider-options"
          role="listbox"
          aria-label="AI provider options"
          className="synapse-provider-menu absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl p-1"
        >
          {providerOptions.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => choose(option.value)}
              className="synapse-provider-option flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs"
              key={option.value}
            >
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
