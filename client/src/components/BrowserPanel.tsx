import { useState } from "react";
import {
  ArrowLeft, ArrowRight, RotateCcw, Search, Star, ShieldCheck, MoreVertical,
  X, Plus, Sparkles
} from "lucide-react";

const tabs = [
  { id: "1", title: "New Tab", icon: "globe", active: true },
  { id: "2", title: "GitHub", icon: "github", active: false },
  { id: "3", title: "Documentation", icon: "book", active: false },
];

const quickLinks = [
  { name: "GitHub", icon: "github" },
  { name: "Docs", icon: "book" },
  { name: "YouTube", icon: "youtube" },
  { name: "Reddit", icon: "reddit" },
  { name: "Hacker News", icon: "newspaper" },
  { name: "MDN Web Docs", icon: "code" },
];

export default function BrowserPanel() {
  const [activeTab, setActiveTab] = useState("1");
  const [urlInput, setUrlInput] = useState("");

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0e27]">
      {/* Tab Bar */}
      <div className="flex items-center h-10 px-2 bg-[#0a0e27] shrink-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 h-8 rounded-lg text-sm cursor-pointer transition-all min-w-0 ${
              tab.id === activeTab
                ? "bg-[#1e293b] text-white"
                : "text-[#9ca3af] hover:bg-[#1e293b]/50 hover:text-white"
            }`}
          >
            {tab.id === "1" && <GlobeIcon />}
            {tab.id === "2" && <GitHubIcon />}
            {tab.id === "3" && <BookIcon />}
            <span className="truncate">{tab.title}</span>
            <button
              className="ml-auto p-0.5 rounded hover:bg-[#374151] text-[#6b7280] hover:text-white shrink-0"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button className="ml-1 p-1.5 rounded-lg hover:bg-[#1e293b]/50 text-[#6b7280] hover:text-white transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center gap-2 px-3 h-11 bg-[#111827] border-b border-[#1e293b] shrink-0">
        <button className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#9ca3af] hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#9ca3af] hover:text-white transition-colors">
          <ArrowRight size={16} />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#9ca3af] hover:text-white transition-colors">
          <RotateCcw size={16} />
        </button>
        <button className="p-1.5 rounded-lg text-[#22c55e]">
          <LockIcon />
        </button>
        <div className="flex-1 flex items-center">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search or enter website address"
            className="flex-1 h-8 px-4 rounded-lg bg-[#1e293b]/50 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50"
          />
        </div>
        <button className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#9ca3af] hover:text-white transition-colors">
          <Star size={16} />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#9ca3af] hover:text-white transition-colors">
          <ShieldCheck size={16} />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-[#1e293b] text-[#9ca3af] hover:text-white transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Content Area - New Tab Page */}
      <div className="flex-1 overflow-auto">
        <div className="h-full flex flex-col items-center justify-center px-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-2">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="8" fill="#7c3aed" />
                <circle cx="50" cy="20" r="6" fill="#7c3aed" opacity="0.8" />
                <circle cx="24" cy="64" r="6" fill="#7c3aed" opacity="0.8" />
                <circle cx="76" cy="64" r="6" fill="#7c3aed" opacity="0.8" />
                <circle cx="24" cy="36" r="5" fill="#7c3aed" opacity="0.6" />
                <circle cx="76" cy="36" r="5" fill="#7c3aed" opacity="0.6" />
                <circle cx="50" cy="80" r="6" fill="#7c3aed" opacity="0.7" />
                <line x1="50" y1="20" x2="24" y2="36" stroke="#7c3aed" strokeWidth="2" opacity="0.6" />
                <line x1="50" y1="20" x2="76" y2="36" stroke="#7c3aed" strokeWidth="2" opacity="0.6" />
                <line x1="50" y1="20" x2="50" y2="50" stroke="#7c3aed" strokeWidth="2" opacity="0.7" />
                <line x1="24" y1="36" x2="24" y2="64" stroke="#7c3aed" strokeWidth="2" opacity="0.6" />
                <line x1="76" y1="36" x2="76" y2="64" stroke="#7c3aed" strokeWidth="2" opacity="0.6" />
                <line x1="24" y1="64" x2="50" y2="80" stroke="#7c3aed" strokeWidth="2" opacity="0.6" />
                <line x1="76" y1="64" x2="50" y2="80" stroke="#7c3aed" strokeWidth="2" opacity="0.6" />
                <line x1="24" y1="64" x2="50" y2="50" stroke="#7c3aed" strokeWidth="2" opacity="0.5" />
                <line x1="76" y1="64" x2="50" y2="50" stroke="#7c3aed" strokeWidth="2" opacity="0.5" />
              </svg>
              <span className="text-3xl font-bold text-white">Synapse <span className="text-[#a78bfa]">Browser</span></span>
            </div>
            <p className="text-[#9ca3af] text-sm">AI-first browser for developers and creators</p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-xl relative mb-8">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search the web with AI..."
              className="w-full h-12 pl-12 pr-12 rounded-full bg-[#1e293b]/70 border border-[#374151] text-white placeholder-[#6b7280] focus:outline-none focus:border-[#7c3aed]/50 text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center cursor-pointer hover:bg-[#6d28d9] transition-colors">
                <Sparkles size={14} className="text-white" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-[#9ca3af] font-medium">Quick Links</span>
            <div className="flex items-center gap-4">
              {quickLinks.map((link) => (
                <div key={link.name} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e293b]/50 hover:bg-[#1e293b] transition-colors cursor-pointer group">
                  <div className="w-6 h-6 rounded flex items-center justify-center">
                    <QuickLinkIcon type={link.icon} />
                  </div>
                  <span className="text-sm text-[#d1d5db] group-hover:text-white">{link.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLinkIcon({ type }: { type: string }) {
  switch (type) {
    case "github":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
    case "book":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case "youtube":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg>;
    case "reddit":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/><path d="M12 17a3 3 0 0 0 3-3v-.5l2.5-1.5a1.5 1.5 0 0 0-2-2c-1.1 0-2 .45-2 1" fill="#0a0e27" stroke="#0a0e27"/><circle cx="9" cy="14" r="1.5" fill="#0a0e27"/><circle cx="15" cy="14" r="1.5" fill="#0a0e27"/><path d="M9 12a1.5 1.5 0 0 0 3 0" fill="none" stroke="#0a0e27"/></svg>;
    case "newspaper":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>;
    case "code":
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
    default:
      return null;
  }
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
