import {
  Globe, Sparkles, Code, FileText, GitBranch, FolderOpen, Terminal, Settings, HelpCircle,
  MessageCircle, Search, Bookmark, Clock, Download, Puzzle, Star
} from "lucide-react";

const menuItems = [
  { id: "browser", label: "Browser", icon: Globe },
  { id: "ai", label: "AI Workspace", icon: Sparkles },
  { id: "developer", label: "Developer Tools", icon: Code },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "git", label: "Git", icon: GitBranch },
  { id: "explorer", label: "File Explorer", icon: FolderOpen },
  { id: "terminal", label: "Terminal", icon: Terminal },
];

const bottomItems = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help", icon: HelpCircle },
];

interface SidebarProps {
  activeSidebar: string;
  setActiveSidebar: (id: string) => void;
}

export default function Sidebar({ activeSidebar, setActiveSidebar }: SidebarProps) {
  return (
    <aside className="w-[68px] bg-[#0a0e27] border-r border-[#1e293b] flex flex-col items-center py-3 shrink-0 overflow-hidden">
      {/* Navigation Items */}
      <div className="flex flex-col gap-1 flex-1">
        {menuItems.map((item) => {
          const isActive = activeSidebar === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSidebar(item.id)}
              className={`w-[56px] h-[56px] rounded-lg flex flex-col items-center justify-center gap-1 transition-all group relative ${
                isActive
                  ? "bg-[#7c3aed]/15 text-[#7c3aed]"
                  : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e293b]/50"
              }`}
              title={item.label}
            >
              {isActive && (
                <>
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#7c3aed] rounded-r" />
                  {item.id === "browser" && (
                    <div className="absolute top-1 right-1">
                      <div className="w-5 h-5 rounded bg-[#7c3aed] flex items-center justify-center">
                        <Globe size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <Icon size={22} strokeWidth={1.8} />
              <span className="text-[9px] font-medium leading-none text-center">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Items */}
      <div className="flex flex-col gap-1 mb-2">
        {bottomItems.map((item) => {
          const isActive = activeSidebar === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSidebar(item.id)}
              className={`w-[56px] h-[56px] rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                isActive
                  ? "bg-[#7c3aed]/15 text-[#7c3aed]"
                  : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e293b]/50"
              }`}
              title={item.label}
            >
              <Icon size={22} strokeWidth={1.8} />
              <span className="text-[9px] font-medium leading-none text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
