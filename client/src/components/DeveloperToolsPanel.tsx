import { useState } from "react";
import { Terminal, GitBranch, Code2, ChevronRight, ChevronDown, Check, Circle, Clock } from "lucide-react";

const commits = [
  { hash: "a1b2c3d", message: "feat(user): add profile avatar upload", author: "You", time: "2 hours ago", color: "#3b82f6" },
  { hash: "d4e5f6a", message: "fix(user): handle null state in profile", author: "You", time: "5 hours ago", color: "#8b5cf6" },
  { hash: "7f8g9h0", message: "refactor(user): extract user header component", author: "You", time: "Yesterday", color: "#10b981" },
  { hash: "9i0j1k2", message: "test(user): add UserProfile component tests", author: "You", time: "Yesterday", color: "#8b5cf6" },
  { hash: "l3m4n5o", message: "chore: update dependencies", author: "Bot", time: "2 days ago", color: "#6b7280" },
  { hash: "p6q7r8s", message: "docs: update README with setup instructions", author: "You", time: "2 days ago", color: "#8b5cf6" },
];

const changes = [
  { file: "src/components/user/UserProfile.tsx", status: "M", statusColor: "#eab308" },
  { file: "src/components/user/AvatarUpload.tsx", status: "A", statusColor: "#22c55e" },
  { file: "src/styles/user-profile.css", status: "M", statusColor: "#eab308" },
];

export default function DeveloperToolsPanel() {
  const [activeTab, setActiveTab] = useState<"history" | "branches">("history");

  return (
    <div className="h-full flex flex-col bg-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-4 bg-[#0f172a] border-b border-[#1e293b] shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-[#7c3aed]" />
          <span className="text-sm font-semibold text-white">Git</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 rounded hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
            <Code2 size={14} />
          </button>
          <button className="p-1 rounded hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
            <GitBranch size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Current Branch */}
        <div className="px-4 py-3 border-b border-[#1e293b]">
          <div className="text-[11px] text-[#6b7280] mb-1">Current Branch</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-[#7c3aed]" />
              <span className="text-sm text-white">main</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6b7280]">↑ 1 ↓ 0 ↑ 0</span>
              <button className="px-3 py-1 rounded-lg bg-[#7c3aed] text-white text-xs font-medium hover:bg-[#6d28d9]">
                Push
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e293b]">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "history" ? "text-[#7c3aed] border-b-2 border-[#7c3aed]" : "text-[#6b7280] hover:text-white"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "branches" ? "text-[#7c3aed] border-b-2 border-[#7c3aed]" : "text-[#6b7280] hover:text-white"
            }`}
          >
            Branches
          </button>
        </div>

        {/* History */}
        <div className="px-4 py-3">
          <div className="space-y-3">
            {commits.map((commit, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: commit.color }} />
                  {i < commits.length - 1 && <div className="w-px h-6 bg-[#1e293b] mt-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{commit.message}</div>
                  <div className="flex items-center gap-2 text-[11px] text-[#6b7280] mt-0.5">
                    <span className="font-mono">{commit.hash}</span>
                    <span className="text-[#4b5563]">•</span>
                    <span>{commit.author}</span>
                    <span className="text-[#4b5563]">•</span>
                    <span>{commit.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Changes */}
        <div className="border-t border-[#1e293b] px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-white">Changes</span>
            <span className="text-xs bg-[#1e293b] text-[#9ca3af] px-1.5 py-0.5 rounded">{changes.length}</span>
          </div>
          <div className="space-y-1">
            {changes.map((change, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <span
                  className="text-[10px] font-bold w-4 text-center"
                  style={{ color: change.statusColor }}
                >
                  {change.status}
                </span>
                <span className="text-xs text-[#d1d5db] flex-1 truncate">{change.file}</span>
                <div className="flex items-center gap-1 text-[#4b5563]">
                  <Clock size={12} />
                </div>
                <button className="text-[#22c55e] text-xs font-medium">+</button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <input
              type="text"
              placeholder="Message (Ctrl+Enter to commit on 'main')"
              className="w-full px-3 py-2 rounded-lg bg-[#1e293b] border border-[#1e293b] text-xs text-white placeholder-[#4b5563] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/50"
            />
            <div className="flex items-center gap-2 mt-2">
              <button className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#7c3aed] text-white text-xs font-medium hover:bg-[#6d28d9]">
                <Check size={12} /> Commit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
