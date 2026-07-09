import { useState } from "react";
import {
  X, Plus, Heading, Heading2, Heading3, Bold, Italic, Strikethrough,
  List, ListOrdered, Code, Link2, Image, Quote, Table2, MoreHorizontal, CheckCircle
} from "lucide-react";

const markdownContent = `# Synapse Browser

AI-first desktop workspace for modern developers.

## Features
- 🔵 AI-powered search and tools
- 🔵 Multi-tab browsing with intelligent assistance
- 🔵 Integrated developer tools
- 🔵 Markdown notes and documentation
- 🔵 Git integration
- 🔵 File explorer and terminal

## Getting Started
1. Open a new tab or navigate to a URL
2. Use AI Workspace for intelligent assistance
3. Access developer tools and project files seamlessly

> Built for productivity. Designed for developers.`;

const renderedLines = markdownContent.split("\n").map((line, i) => {
  let className = "text-[#d1d5db]";
  if (line.startsWith("# ")) className = "text-white font-bold text-base";
  else if (line.startsWith("## ")) className = "text-white font-semibold text-sm";
  else if (line.startsWith("- ")) className = "text-[#d1d5db]";
  else if (line.startsWith("1. ")) className = "text-[#d1d5db]";
  else if (line.startsWith("> ")) className = "text-[#9ca3af] italic";
  else if (line.trim() === "") className = "";

  return (
    <div key={i} className="flex items-start">
      <span className="w-8 text-right pr-3 text-[#4b5563] text-xs font-mono shrink-0 leading-6 select-none">
        {i + 1}
      </span>
      <pre className="font-mono text-[13px] leading-6 whitespace-pre-wrap flex-1">
        <span className={className}>{line}</span>
      </pre>
    </div>
  );
});

const toolbarIcons = [
  { icon: Heading, label: "H1", size: 14 },
  { icon: Heading2, label: "H2", size: 14 },
  { icon: Heading3, label: "H3", size: 14 },
  { icon: Bold, label: "Bold", size: 14 },
  { icon: Italic, label: "Italic", size: 14 },
  { icon: Strikethrough, label: "Strike", size: 14 },
  { icon: List, label: "Bullet", size: 14 },
  { icon: ListOrdered, label: "Numbered", size: 14 },
  { icon: Code, label: "Code", size: 14 },
  { icon: Link2, label: "Link", size: 14 },
  { icon: Image, label: "Image", size: 14 },
  { icon: Quote, label: "Quote", size: 14 },
  { icon: Table2, label: "Table", size: 14 },
];

export default function NotesPanel() {
  const [activeTab] = useState("README.md");

  return (
    <div className="h-full flex flex-col bg-[#111827]">
      {/* Tab Bar */}
      <div className="flex items-center h-9 px-2 bg-[#0f172a] border-b border-[#1e293b] shrink-0">
        <div className="flex items-center gap-2 px-3 h-7 rounded-md bg-[#1e293b] text-white text-xs">
          <span className="text-[#7c3aed] text-[10px] font-bold">M↓</span>
          <span>{activeTab}</span>
          <button className="p-0.5 rounded hover:bg-[#374151] text-[#6b7280] hover:text-white">
            <X size={11} />
          </button>
        </div>
        <button className="ml-1 p-1 rounded hover:bg-[#1e293b]/50 text-[#6b7280] hover:text-white">
          <Plus size={14} />
        </button>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-0.5 px-3 h-9 bg-[#111827] border-b border-[#1e293b] shrink-0">
        {toolbarIcons.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <button
              key={i}
              className="px-2 py-1 text-[#9ca3af] hover:text-white hover:bg-[#1e293b] rounded transition-colors"
              title={tool.label}
            >
              <Icon size={tool.size} />
            </button>
          );
        })}
        <button className="ml-auto p-1.5 rounded hover:bg-[#1e293b] text-[#6b7280] hover:text-white">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto px-4 py-2">
        {renderedLines}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between h-7 px-4 bg-[#0f172a] border-t border-[#1e293b] shrink-0">
        <div className="flex items-center gap-3 text-[11px] text-[#6b7280]">
          <span>Ln 1, Col 1</span>
          <span>Markdown</span>
          <span className="flex items-center gap-1 text-[#22c55e]">
            <CheckCircle size={10} /> Saved
          </span>
        </div>
        <span className="text-[11px] text-[#6b7280]">120 words</span>
      </div>
    </div>
  );
}
