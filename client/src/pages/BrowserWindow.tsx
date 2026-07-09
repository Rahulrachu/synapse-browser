/**
 * Synapse Browser — Main Window
 * Replicates the main-window screenshot: macOS title bar, left sidebar,
 * browser panel (top) with tabs + navigation + new tab page, and split
 * bottom panel (Notes editor + File Explorer).
 * Also supports 3-Panel and 4-Panel layouts from other README screenshots.
 */
import { useState } from "react";
import TitleBar from "@/components/TitleBar";
import Sidebar from "@/components/Sidebar";
import BrowserPanel from "@/components/BrowserPanel";
import NotesPanel from "@/components/NotesPanel";
import ExplorerPanel from "@/components/ExplorerPanel";
import StatusBar from "@/components/StatusBar";
import CommandPalette from "@/components/CommandPalette";
import SettingsModal from "@/components/SettingsModal";
import AIWorkspacePanel from "@/components/AIWorkspacePanel";
import DeveloperToolsPanel from "@/components/DeveloperToolsPanel";
import AgentMonitorPanel from "@/components/AgentMonitorPanel";

export default function BrowserWindow() {
  const [panelLayout, setPanelLayout] = useState<2 | 3 | 4>(2);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState("browser");

  return (
    <div className="h-screen flex flex-col bg-[#0a0e27] text-white overflow-hidden font-sans">
      {/* Title Bar */}
      <TitleBar
        panelLayout={panelLayout}
        setPanelLayout={setPanelLayout}
        onCommandPalette={() => setShowCommandPalette(true)}
        onSettings={() => setShowSettings(true)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeSidebar={activeSidebar}
          setActiveSidebar={setActiveSidebar}
        />

        {/* Panels Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {panelLayout === 2 && (
            <>
              {/* Top: Browser Panel */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <BrowserPanel />
              </div>
              {/* Bottom Split: Notes + Explorer */}
              <div className="h-[42%] flex min-h-0">
                <div className="flex-1 min-w-0 border-r border-[#1e293b]">
                  <NotesPanel />
                </div>
                <div className="flex-1 min-w-0">
                  <ExplorerPanel />
                </div>
              </div>
            </>
          )}

          {panelLayout === 3 && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Browser */}
              <div className="flex-1 min-w-0 border-r border-[#1e293b]">
                <BrowserPanel />
              </div>
              {/* Right: Split top/bottom */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 min-h-0 border-b border-[#1e293b]">
                  <AIWorkspacePanel />
                </div>
                <div className="flex-1 min-h-0">
                  <NotesPanel />
                </div>
              </div>
            </div>
          )}

          {panelLayout === 4 && (
            <div className="flex-1 grid grid-cols-2 grid-rows-2 overflow-hidden">
              {/* Top-Left: Web Browser */}
              <div className="border-r border-b border-[#1e293b] overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a] border-b border-[#1e293b]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <span className="text-xs text-[#9ca3af]">Web Browser</span>
                  </div>
                  <div className="flex-1 p-4 overflow-auto bg-[#111827]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="8" fill="#7c3aed"/>
                          <circle cx="50" cy="20" r="6" fill="#7c3aed" opacity="0.8"/>
                          <circle cx="24" cy="64" r="6" fill="#7c3aed" opacity="0.8"/>
                          <circle cx="76" cy="64" r="6" fill="#7c3aed" opacity="0.8"/>
                          <line x1="50" y1="20" x2="24" y2="36" stroke="#7c3aed" strokeWidth="2" opacity="0.6"/>
                          <line x1="50" y1="20" x2="76" y2="36" stroke="#7c3aed" strokeWidth="2" opacity="0.6"/>
                          <line x1="50" y1="20" x2="50" y2="50" stroke="#7c3aed" strokeWidth="2" opacity="0.7"/>
                          <line x1="24" y1="36" x2="24" y2="64" stroke="#7c3aed" strokeWidth="2" opacity="0.6"/>
                          <line x1="76" y1="36" x2="76" y2="64" stroke="#7c3aed" strokeWidth="2" opacity="0.6"/>
                          <line x1="24" y1="64" x2="50" y2="80" stroke="#7c3aed" strokeWidth="2" opacity="0.6"/>
                          <line x1="76" y1="64" x2="50" y2="80" stroke="#7c3aed" strokeWidth="2" opacity="0.6"/>
                        </svg>
                        <span className="text-lg font-bold text-white">Synapse</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search the web..."
                        className="w-full max-w-md h-9 px-4 rounded-lg bg-[#1e293b] border border-[#374151] text-white placeholder-[#6b7280] text-sm focus:outline-none focus:border-[#7c3aed]/50"
                      />
                      <div className="flex gap-2 mt-2">
                        {["GitHub", "Reddit", "YouTube"].map((link) => (
                          <div key={link} className="px-4 py-2 rounded-lg bg-[#1e293b] hover:bg-[#374151] text-sm text-[#d1d5db] cursor-pointer transition-colors">
                            {link}
                          </div>
                        ))}
                        <div className="px-4 py-2 rounded-lg bg-[#1e293b] hover:bg-[#374151] text-sm text-[#d1d5db] cursor-pointer transition-colors">
                          + Add Shortcut
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Top-Right: AI Chat */}
              <div className="border-b border-[#1e293b] overflow-hidden">
                <AIWorkspacePanel />
              </div>
              {/* Bottom-Left: Notes */}
              <div className="border-r border-[#1e293b] overflow-hidden">
                <NotesPanel />
              </div>
              {/* Bottom-Right: Files */}
              <div className="overflow-hidden">
                <ExplorerPanel />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Command Palette Overlay */}
      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
