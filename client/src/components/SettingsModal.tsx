import { useState } from "react";
import { X, Settings, Sparkles, Globe, Code, RotateCcw, ChevronDown, Eye } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [theme, setTheme] = useState("dark");
  const [provider, setProvider] = useState("openai");
  const [temperature, setTemperature] = useState(0.7);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[720px] bg-[#111827] rounded-xl shadow-2xl border border-[#1e293b] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Settings Grid */}
        <div className="p-6 grid grid-cols-2 gap-6">
          {/* General */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} className="text-[#7c3aed]" />
              <span className="text-sm font-semibold text-white">General</span>
            </div>
            <div className="space-y-4">
              {/* Theme */}
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Theme</label>
                <div className="flex rounded-lg overflow-hidden border border-[#1e293b]">
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs transition-all ${
                      theme === "dark"
                        ? "bg-[#7c3aed] text-white"
                        : "text-[#9ca3af] hover:text-white hover:bg-[#1e293b]"
                    }`}
                  >
                    <span className="text-sm">🌙</span> Dark
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs transition-all ${
                      theme === "light"
                        ? "bg-[#7c3aed] text-white"
                        : "text-[#9ca3af] hover:text-white hover:bg-[#1e293b]"
                    }`}
                  >
                    <span className="text-sm">☀️</span> Light
                  </button>
                </div>
              </div>

              {/* On startup */}
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">On startup</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                  <span className="text-sm text-[#d1d5db]">Open New Tab Page</span>
                  <ChevronDown size={14} className="text-[#6b7280]" />
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Language</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                  <span className="text-sm text-[#d1d5db]">English (US)</span>
                  <ChevronDown size={14} className="text-[#6b7280]" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-[#7c3aed]" />
              <span className="text-sm font-semibold text-white">AI Settings</span>
            </div>
            <div className="space-y-4">
              {/* Provider */}
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Model Provider</label>
                <div className="flex rounded-lg overflow-hidden border border-[#1e293b]">
                  {[
                    { id: "openai", label: "OpenAI", icon: "⬡" },
                    { id: "claude", label: "Claude", icon: "⬡" },
                    { id: "ollama", label: "Ollama", icon: "🦙" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs transition-all ${
                        provider === p.id
                          ? "bg-[#7c3aed] text-white"
                          : "text-[#9ca3af] hover:text-white hover:bg-[#1e293b]"
                      }`}
                    >
                      <span className="text-sm">{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">API Key</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                    <span className="text-sm text-[#d1d5db]">••••••••••••••••</span>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-[#1e293b] text-[#6b7280]">
                    <Eye size={14} />
                  </button>
                </div>
                <a href="#" className="text-xs text-[#7c3aed] hover:text-[#a78bfa] mt-1 inline-block">Manage API Keys</a>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-[#9ca3af]">Temperature</label>
                  <span className="text-xs text-[#9ca3af] bg-[#1e293b] px-2 py-0.5 rounded">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none bg-[#1e293b] accent-[#7c3aed]"
                />
                <div className="flex justify-between text-[10px] text-[#4b5563] mt-1">
                  <span>0</span>
                  <span>2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Browser */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-[#7c3aed]" />
              <span className="text-sm font-semibold text-white">Browser</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Homepage</label>
                <input
                  type="text"
                  defaultValue="https://start.synapse.ai"
                  className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b] text-sm text-[#d1d5db] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Default Search Engine</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                  <span className="text-sm text-[#d1d5db]">Google</span>
                  <ChevronDown size={14} className="text-[#6b7280]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">New Tab Page</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                  <span className="text-sm text-[#d1d5db]">Synapse Start Page</span>
                  <ChevronDown size={14} className="text-[#6b7280]" />
                </div>
              </div>
            </div>
          </div>

          {/* Developer */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Code size={16} className="text-[#7c3aed]" />
              <span className="text-sm font-semibold text-white">Developer</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Default Terminal Shell</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                  <span className="text-sm text-[#d1d5db]">zsh</span>
                  <ChevronDown size={14} className="text-[#6b7280]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Editor Font Family</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                  <span className="text-sm text-[#d1d5db]">JetBrains Mono</span>
                  <ChevronDown size={14} className="text-[#6b7280]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Editor Font Size</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                  <span className="text-sm text-[#d1d5db]">14</span>
                  <span className="text-xs text-[#6b7280]">px</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Git Default Branch</label>
                <input
                  type="text"
                  defaultValue="main"
                  className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b] text-sm text-[#d1d5db] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] block mb-2">Git Commit Message Style</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b]">
                  <span className="text-sm text-[#d1d5db]">Conventional Commits</span>
                  <ChevronDown size={14} className="text-[#6b7280]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e293b]">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#1e293b] transition-colors">
            <RotateCcw size={14} /> Restore Defaults
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#1e293b] transition-colors">
              Cancel
            </button>
            <button className="px-5 py-2 rounded-lg text-sm bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors font-medium">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
