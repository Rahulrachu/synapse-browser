import { useState } from "react";
import { Sparkles, Plus, RotateCcw, MoreHorizontal, Settings, Send, ThumbsUp, ThumbsDown, Clock } from "lucide-react";

const messages = [
  {
    role: "user",
    text: "Can you explain how the Synapse Browser workspace works?",
    time: "10:24 AM",
  },
  {
    role: "assistant",
    text: `Absolutely! The Synapse Browser workspace is a flexible, multi-panel environment that lets you organize your workflow across different tools and content.

You can split the workspace into 1, 2, 3, or 4 panels. Each panel can host a different function like browsing, AI chat, notes, or file explorer. You can resize panels, switch their positions, and save custom layouts.

Would you like a quick tour of the features?`,
    time: "10:24 AM",
  },
];

interface AIWorkspacePanelProps {
  compact?: boolean;
}

export default function AIWorkspacePanel({ compact = false }: AIWorkspacePanelProps) {
  const [input, setInput] = useState("");
  const [provider] = useState("openai");

  return (
    <div className="h-full flex flex-col bg-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-4 bg-[#0f172a] border-b border-[#1e293b] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#7c3aed]" />
          <span className="text-sm font-semibold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg overflow-hidden border border-[#1e293b]">
            {["OpenAI", "Claude", "Ollama"].map((p) => (
              <button
                key={p}
                className={`px-2.5 py-1 text-xs transition-all ${
                  p === "OpenAI"
                    ? "bg-[#7c3aed] text-white"
                    : "text-[#9ca3af] hover:text-white hover:bg-[#1e293b]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {!compact && (
            <button className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
              <Settings size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%]`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-[#7c3aed]/20 flex items-center justify-center">
                    <Sparkles size={12} className="text-[#7c3aed]" />
                  </div>
                  <span className="text-[11px] text-[#9ca3af]">AI Assistant</span>
                  <span className="text-[11px] text-[#4b5563]">{msg.time}</span>
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#7c3aed] text-white"
                    : "bg-[#1e293b] text-[#d1d5db]"
                }`}
              >
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <span className="text-[11px] text-[#6b7280]">You</span>
                  <span className="text-[11px] text-[#4b5563]">{msg.time}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1e293b]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 h-9 px-4 rounded-lg bg-[#1e293b] text-sm text-white placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50"
          />
          <button className="p-2 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors">
            <Send size={14} />
          </button>
        </div>
        <p className="text-[10px] text-[#4b5563] mt-2 text-center">
          AI responses may be inaccurate. Please verify important information.
        </p>
      </div>
    </div>
  );
}
