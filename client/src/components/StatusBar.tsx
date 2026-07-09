import { GitBranch, GitPullRequest, CheckCircle } from "lucide-react";

export default function StatusBar() {
  return (
    <div className="flex items-center justify-between h-7 px-4 bg-[#0a0e27] border-t border-[#1e293b] shrink-0">
      {/* Left: Ready status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span className="text-[11px] text-[#d1d5db]">Ready</span>
        </div>
      </div>

      {/* Right: Version, branch, sync */}
      <div className="flex items-center gap-4 text-[11px] text-[#6b7280]">
        <span>v1.2.0</span>
        <div className="flex items-center gap-1">
          <GitBranch size={11} />
          <span>main</span>
        </div>
        <div className="flex items-center gap-1">
          <GitPullRequest size={11} />
          <span>0</span>
        </div>
      </div>
    </div>
  );
}
