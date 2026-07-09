import { useState } from "react";
import {
  FilePlus, FolderPlus, RefreshCw, MoreHorizontal, ChevronRight, ChevronDown,
  FileCode, FileJson, FileText, FolderOpen
} from "lucide-react";

interface FileNode {
  name: string;
  type: "file" | "folder";
  icon?: string;
  status?: string;
  modified?: string;
  children?: FileNode[];
  expanded?: boolean;
}

const projectTree: FileNode[] = [
  {
    name: "synapse-browser",
    type: "folder",
    expanded: true,
    children: [
      {
        name: "src",
        type: "folder",
        expanded: true,
        children: [
          { name: "components", type: "folder", modified: "—" },
          { name: "hooks", type: "folder", modified: "—" },
          { name: "pages", type: "folder", modified: "—" },
          { name: "services", type: "folder", modified: "—" },
          { name: "utils", type: "folder", modified: "—" },
          { name: "App.tsx", type: "file", icon: "tsx", status: "M", modified: "2 hours ago" },
          { name: "main.tsx", type: "file", icon: "tsx", status: "M", modified: "2 hours ago" },
          { name: "styles.css", type: "file", icon: "css", status: "M", modified: "3 days ago" },
        ],
      },
      { name: "public", type: "folder", modified: "3 days ago" },
      { name: ".gitignore", type: "file", icon: "gitignore", status: "M", modified: "3 days ago" },
      { name: "README.md", type: "file", icon: "markdown", status: "M", modified: "1 day ago" },
      { name: "package.json", type: "file", icon: "json", modified: "1 day ago" },
      { name: "tsconfig.json", type: "file", icon: "json", modified: "1 day ago" },
      { name: "vite.config.ts", type: "file", icon: "config", modified: "1 day ago" },
    ],
  },
];

function FileIcon({ type, icon }: { type: string; icon?: string }) {
  if (type === "folder") return <FolderOpen size={14} className="text-[#7c3aed]" />;

  const iconMap: Record<string, React.ReactNode> = {
    tsx: <FileCode size={14} className="text-[#38bdf8]" />,
    css: <FileCode size={14} className="text-[#f59e0b]" />,
    json: <FileJson size={14} className="text-[#22c55e]" />,
    markdown: (
      <span className="flex items-center gap-0.5">
        <FileText size={14} className="text-[#7c3aed]" />
        <span className="text-[9px] text-[#7c3aed] font-bold">M↓</span>
      </span>
    ),
    gitignore: (
      <span className="flex items-center gap-0.5">
        <FileText size={14} className="text-[#ef4444]" />
      </span>
    ),
    config: <FileCode size={14} className="text-[#6b7280]" />,
  };

  const ext = icon || type;
  return iconMap[ext] || <FileText size={14} className="text-[#9ca3af]" />;
}

function TreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const paddingLeft = depth * 16 + 8;

  return (
    <div>
      <div
        className="flex items-center gap-2 h-7 hover:bg-[#1e293b]/30 transition-colors group"
        style={{ paddingLeft }}
      >
        {node.type === "folder" && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-[#6b7280] hover:text-white"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        {node.type === "file" && <div className="w-4" />}
        <FileIcon type={node.type} icon={node.icon} />
        <span className="text-xs text-[#d1d5db] truncate">{node.name}</span>
        <span className="text-[10px] text-[#4b5563] ml-auto tabular-nums">
          {node.modified || "—"}
        </span>
        {node.status && (
          <span className={`text-[10px] font-bold ml-1 ${
            node.status === "M" ? "text-[#eab308]" :
            node.status === "A" ? "text-[#22c55e]" :
            "text-[#9ca3af]"
          }`}>
            {node.status}
          </span>
        )}
      </div>
      {expanded && node.children && (
        <div>
          {node.children.map((child, i) => (
            <TreeItem key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExplorerPanel() {
  return (
    <div className="h-full flex flex-col bg-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between h-9 px-3 bg-[#0f172a] border-b border-[#1e293b] shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-[#7c3aed]" />
          <span className="text-xs font-semibold text-white">Explorer</span>
          <span className="text-[10px] text-[#4b5563] ml-2">~/Projects/synapse-browser</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="p-1 rounded hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
            <FilePlus size={13} />
          </button>
          <button className="p-1 rounded hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
            <FolderPlus size={13} />
          </button>
          <button className="p-1 rounded hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
            <RefreshCw size={13} />
          </button>
          <button className="p-1 rounded hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto py-1">
        {projectTree.map((node, i) => (
          <TreeItem key={i} node={node} />
        ))}
      </div>
    </div>
  );
}
