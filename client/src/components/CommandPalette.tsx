import { useState } from "react";
import {
  Plus, BookOpen, Clock, Terminal, Code2, GitBranch,
  Sparkles, Activity, Moon, LayoutGrid, Save, FolderOpen,
  Search, ArrowUpDown, ArrowRight, XCircle
} from "lucide-react";

interface Command {
  label: string;
  icon: React.ReactNode;
  shortcut: string;
}

const commandGroups = [
  {
    title: "BROWSER",
    commands: [
      { label: "New Tab", icon: <Plus size={14} />, shortcut: "⌘T" },
      { label: "Open Bookmarks", icon: <BookOpen size={14} />, shortcut: "⌘⇧B" },
      { label: "Go to History", icon: <Clock size={14} />, shortcut: "⌘Y" },
    ],
  },
  {
    title: "DEVELOPER TOOLS",
    commands: [
      { label: "Open Terminal", icon: <Terminal size={14} />, shortcut: "⌃`" },
      { label: "Open Monaco Editor", icon: <Code2 size={14} />, shortcut: "⌘⇧E" },
      { label: "Open Git Panel", icon: <GitBranch size={14} />, shortcut: "⌘⇧G" },
    ],
  },
  {
    title: "AI",
    commands: [
      { label: "Open AI Assistant", icon: <Sparkles size={14} />, shortcut: "⌘⇧A" },
      { label: "Open Agent Monitor", icon: <Activity size={14} />, shortcut: "⌘⇧M" },
      { label: "Toggle Theme", icon: <Moon size={14} />, shortcut: "⌘⇧T" },
    ],
  },
  {
    title: "WORKSPACE",
    commands: [
      { label: "Change Layout", icon: <LayoutGrid size={14} />, shortcut: "⌘⇧L" },
      { label: "Save Workspace", icon: <Save size={14} />, shortcut: "⌘S" },
      { label: "Load Workspace", icon: <FolderOpen size={14} />, shortcut: "⌘O" },
    ],
  },
];

interface CommandPaletteProps {
  onClose: () => void;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const totalCommands = commandGroups.reduce((acc, g) => acc + g.commands.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[560px] bg-[#111827] rounded-xl shadow-2xl border border-[#1e293b] overflow-hidden">
        {/* Search Input */}
        <div className="relative px-4 pt-4 pb-2">
          <Search size={16} className="absolute left-7 top-6 text-[#6b7280]" />
          <input
            type="text"
            placeholder="Type a command..."
            className="w-full h-10 pl-10 pr-24 rounded-lg bg-[#1e293b] text-white placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % totalCommands);
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + totalCommands) % totalCommands);
              }
            }}
          />
          <div className="absolute right-7 top-5 text-[11px] text-[#6b7280] bg-[#1e293b] px-1.5 py-0.5 rounded">
            ⌘K
          </div>
        </div>

        {/* Command List */}
        <div className="max-h-[420px] overflow-auto py-2 px-2">
          {commandGroups.map((group, gi) => (
            <div key={gi}>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                {group.title}
              </div>
              {group.commands.map((cmd, ci) => {
                const globalIndex = commandGroups.slice(0, gi).reduce((a, g) => a + g.commands.length, 0) + ci;
                const isSelected = globalIndex === selectedIndex;
                return (
                  <div
                    key={ci}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-[#7c3aed] text-white" : "text-[#d1d5db] hover:bg-[#1e293b]"
                    }`}
                  >
                    <span className={isSelected ? "text-white" : "text-[#7c3aed]"}>{cmd.icon}</span>
                    <span className="text-sm flex-1">{cmd.label}</span>
                    <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-[#6d28d9] text-[#c4b5fd]" : "bg-[#1e293b] text-[#6b7280]"
                    }`}>
                      {cmd.shortcut}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-[#1e293b] text-[11px] text-[#4b5563]">
          <span className="flex items-center gap-1">
            <ArrowUpDown size={11} /> to navigate
          </span>
          <span className="flex items-center gap-1">
            <ArrowRight size={11} /> to select
          </span>
          <span className="flex items-center gap-1">
            <XCircle size={11} /> to close
          </span>
        </div>
      </div>
    </div>
  );
}
