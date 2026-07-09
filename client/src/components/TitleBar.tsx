import { Bell, LayoutGrid, LayoutTemplate, Columns2, Columns3, Moon, Settings, Command } from "lucide-react";

interface TitleBarProps {
  panelLayout: 2 | 3 | 4;
  setPanelLayout: (layout: 2 | 3 | 4) => void;
  onCommandPalette: () => void;
  onSettings: () => void;
}

export default function TitleBar({ panelLayout, setPanelLayout, onCommandPalette, onSettings }: TitleBarProps) {
  return (
    <div className="flex items-center justify-between px-4 h-12 bg-[#0a0e27] border-b border-[#1e293b] shrink-0">
      {/* Left: Traffic lights + Brand */}
      <div className="flex items-center gap-3">
        {/* macOS traffic lights */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
          <div className="w-3 h-3 rounded-full bg-[#eab308]" />
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
        </div>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          <div className="flex flex-col">
            <span className="text-base font-semibold text-white leading-tight">Synapse Browser</span>
            <span className="text-[11px] text-[#6b7280] leading-tight truncate max-w-[160px]">AI-first desktop workspace ...</span>
          </div>
        </div>
      </div>

      {/* Right: Notifications + Panel buttons */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative p-1.5 rounded-lg hover:bg-[#1e293b] transition-colors text-[#9ca3af] hover:text-white">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#3b82f6] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Panel layout buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPanelLayout(2)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
              panelLayout === 2
                ? "bg-[#7c3aed] text-white"
                : "text-[#9ca3af] hover:text-white hover:bg-[#1e293b]"
            }`}
          >
            <Columns2 size={14} />
            2-Panel
          </button>
          <button
            onClick={() => setPanelLayout(3)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
              panelLayout === 3
                ? "bg-[#7c3aed] text-white"
                : "text-[#9ca3af] hover:text-white hover:bg-[#1e293b]"
            }`}
          >
            <Columns3 size={14} />
            3-Panel
          </button>
          <button
            onClick={() => setPanelLayout(4)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
              panelLayout === 4
                ? "bg-[#7c3aed] text-white"
                : "text-[#9ca3af] hover:text-white hover:bg-[#1e293b]"
            }`}
          >
            <LayoutGrid size={14} />
            4-Panel
          </button>
        </div>
      </div>
    </div>
  );
}
