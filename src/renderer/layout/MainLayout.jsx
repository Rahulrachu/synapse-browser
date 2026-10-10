import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bookmark,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleQuestionMark,
  Code,
  Download,
  Ellipsis,
  Files,
  Plus,
  RotateCcwClock,
  RotateCw,
  Search,
  Settings,
  Star,
  Terminal,
} from "lucide-react";
import { TabBar } from "../components/TabBar";
import { BrowserView } from "../components/BrowserView";
import { AIWorkspacePanel } from "../components/AIWorkspacePanel";
import { panelLabels } from "./panelLabels";
import { HomePage } from "../components/HomePage";
import { WorkspaceSurface } from "../workspace/WorkspaceSurface";
import { SettingsPanel } from "../components/SettingsPanel";

const AI_PANEL_MIN_WIDTH = 300;
const AI_PANEL_MAX_WIDTH = 720;
const AI_PANEL_DEFAULT_WIDTH = 380;
const AI_PANEL_WIDTH_KEY = "synapse.aiPanelWidth";
// Keep at least this much room for the web page when the AI panel is open.
const MIN_PAGE_WIDTH = 420;

const clampAIPanelWidth = (width) => {
  const viewportLimit = typeof window !== "undefined" ? window.innerWidth - 72 - MIN_PAGE_WIDTH : AI_PANEL_MAX_WIDTH;
  const max = Math.max(AI_PANEL_MIN_WIDTH, Math.min(AI_PANEL_MAX_WIDTH, viewportLimit));
  return Math.round(Math.min(max, Math.max(AI_PANEL_MIN_WIDTH, Number(width) || AI_PANEL_DEFAULT_WIDTH)));
};

export const MainLayout = () => {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [addressBarValue, setAddressBarValue] = useState("");
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [panel, setPanel] = useState("browser");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiPanelWidth, setAIPanelWidth] = useState(() =>
    clampAIPanelWidth(localStorage.getItem(AI_PANEL_WIDTH_KEY) || AI_PANEL_DEFAULT_WIDTH),
  );
  const [resizingAIPanel, setResizingAIPanel] = useState(false);
  const addressBarRef = useRef(null);
  const desktop = typeof window !== "undefined" && Boolean(window.electron);
  useEffect(() => {
    if (!desktop) {
      const previewTab = {
        id: "preview-tab",
        url: "https://www.google.com",
        title: "Preview",
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
      };
      setTabs([previewTab]);
      setActiveTabId(previewTab.id);
      return;
    }
    let disposed = false;
    const init = async () => {
      try {
        const result = await window.electron.invoke("get-all-tabs");
        if (disposed) return;
        if (result.tabs?.length > 0) {
          setTabs(result.tabs);
          setActiveTabId(result.activeTabId || result.tabs[0].id);
        } else {
          const newTab = await window.electron.invoke("create-tab", "about:blank");
          setTabs(newTab.tabs);
          setActiveTabId(newTab.activeTabId);
        }
      } catch (error) {
        console.error("[Renderer] Failed to initialize tabs", error);
      }
    };
    void init();
    const unsubscribe = window.electron.on("tabs-updated", (data) => {
      setTabs(data.tabs);
      setActiveTabId(data.activeTabId);
    });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [desktop]);
  useEffect(() => {
    const active = tabs.find((tab) => tab.id === activeTabId);
    if (active) setAddressBarValue(active.url);
  }, [activeTabId, tabs]);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const isHome = panel === "browser" && activeTab?.url === "about:blank";
  useEffect(() => {
    if (desktop)
      void window.electron.invoke(
        "set-browser-view-visibility",
        panel === "browser" && !isHome && !settingsOpen && !commandOpen && !resizingAIPanel,
      );
  }, [desktop, panel, isHome, settingsOpen, commandOpen, resizingAIPanel]);
  useEffect(() => {
    const onResize = () => setAIPanelWidth((width) => clampAIPanelWidth(width));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const startAIPanelResize = useCallback(
    (event) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = aiPanelWidth;
      let latest = startWidth;
      setResizingAIPanel(true);
      const onMove = (moveEvent) => {
        latest = clampAIPanelWidth(startWidth + (startX - moveEvent.clientX));
        setAIPanelWidth(latest);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setResizingAIPanel(false);
        localStorage.setItem(AI_PANEL_WIDTH_KEY, String(latest));
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [aiPanelWidth],
  );
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setPanel("browser");
        setIsAIPanelOpen((open) => !open);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    // Shortcuts pressed while a web page has focus are forwarded by the main process.
    const unsubscribeShortcut = window.electron?.on?.("shortcut", (name) => {
      if (name === "toggle-ai-panel") {
        setPanel("browser");
        setIsAIPanelOpen((open) => !open);
      } else if (name === "command-palette") {
        setCommandOpen((value) => !value);
      }
    });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unsubscribeShortcut?.();
    };
  }, []);
  const title = useMemo(
    () => (panel === "browser" ? activeTab?.title || "Browser" : panelLabels[panel]),
    [activeTab?.title, panel],
  );
  const invoke = async (channel, ...args) => {
    if (!desktop) return void 0;
    try {
      return await window.electron.invoke(channel, ...args);
    } catch (error) {
      console.error(`[Renderer] ${channel} failed`, error);
      return void 0;
    }
  };
  const selectPanel = (next) => {
    setSettingsOpen(false);
    setPanel(next);
  };
  const sidebarButton = (next, icon, label) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => selectPanel(next)}
      className={`sidebar-icon synapse-icon-button ${panel === next ? "active synapse-active-rail" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50`}
    >
      {icon}
    </button>
  );
  const navigate = () => {
    if (addressBarValue.trim()) void invoke("navigate-to", addressBarValue, activeTabId);
  };
  const runCommand = (command) => {
    setCommandOpen(false);
    if (command === "settings") setSettingsOpen(true);
    else if (command === "new-tab") void invoke("create-tab", "about:blank");
    else if (command === "terminal") selectPanel("terminal");
    else if (command === "history") selectPanel("history");
    else if (command === "orion") {
      selectPanel("browser");
      setIsAIPanelOpen(true);
    }
  };
  return (
    <div className="synapse-app-shell relative flex h-screen w-screen overflow-hidden text-white select-none">
      <aside
        className="glass-sidebar synapse-surface z-30 flex w-[72px] shrink-0 flex-col items-center border-y-0 border-l-0 py-5"
        aria-label="Main navigation"
      >
        <button
          type="button"
          aria-label="Open browser"
          title="Open browser"
          onClick={() => selectPanel("browser")}
          className="synapse-brand-anchor mb-7 rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <span className="synapse-brand-mark flex h-8 w-8 items-center justify-center text-lg font-bold text-black">
            S
          </span>
        </button>
        <div className="flex flex-1 flex-col gap-2">
          {sidebarButton("browser", <Bot size={20} />, "Browser and AI")}
          {sidebarButton("files", <Files size={20} />, "Files")}
          {sidebarButton("editor", <Code size={20} />, "Editor")}
          {sidebarButton("terminal", <Terminal size={20} />, "Terminal")}
          {sidebarButton("history", <RotateCcwClock size={20} />, "History")}
          {sidebarButton("bookmarks", <Bookmark size={20} />, "Bookmarks")}
          {sidebarButton("downloads", <Download size={20} />, "Downloads")}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-label="Open Settings"
            title="Settings"
            onClick={() => setSettingsOpen(true)}
            className="sidebar-icon synapse-icon-button text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <Settings size={19} />
          </button>
          <button
            type="button"
            aria-label="Open Help"
            title="Help"
            onClick={() => window.open("https://github.com/Rahulrachu/synapse-browser", "_blank")}
            className="sidebar-icon synapse-icon-button text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <CircleQuestionMark size={19} />
          </button>
        </div>
      </aside>
      <main className="flex min-w-0 min-h-0 flex-1 flex-col synapse-browser-stage">
        <header className="glass-toolbar synapse-toolbar relative z-20 shrink-0 border-b">
          <div className="relative flex h-12 items-center gap-3 px-4">
            <div
              className={`synapse-progress-line ${activeTab?.isLoading ? "is-loading" : ""}`}
              aria-hidden="true"
            />
            <div className="flex items-center gap-2 text-xs text-white/45">
              <Activity size={13} className="text-emerald-300" />
              <span>{title}</span>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={(id) => {
                  setPanel("browser");
                  void invoke("set-active-tab", id);
                }}
                onCloseTab={(id) => void invoke("close-tab", id)}
                onNewTab={() => void invoke("create-tab", "about:blank")}
              />
            </div>
            <button
              type="button"
              aria-label="Toggle AI panel"
              onClick={() => {
                selectPanel("browser");
                setIsAIPanelOpen((open) => !open);
              }}
              className={`synapse-ai-button rounded-lg border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${isAIPanelOpen && panel === "browser" ? "border-white/25 bg-white text-black" : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10"}`}
            >
              <Bot size={14} className="inline mr-1.5" />
              AI
            </button>
          </div>
          <div className="flex items-center gap-3 px-4 pb-3">
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Back"
                title="Back"
                disabled={!activeTab?.canGoBack}
                onClick={() => void invoke("go-back", activeTabId)}
                className="toolbar-button"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                aria-label="Forward"
                title="Forward"
                disabled={!activeTab?.canGoForward}
                onClick={() => void invoke("go-forward", activeTabId)}
                className="toolbar-button"
              >
                <ChevronRight size={17} />
              </button>
              <button
                type="button"
                aria-label="Reload"
                title="Reload"
                onClick={() => void invoke("reload", activeTabId)}
                className="toolbar-button"
              >
                <RotateCw size={15} />
              </button>
            </div>
            <div className="address-bar synapse-address flex min-w-0 flex-1 items-center gap-2">
              <Search size={14} className="shrink-0 text-white/35" />
              <input
                ref={addressBarRef}
                aria-label="Address bar"
                className="w-full bg-transparent text-xs text-white/80 outline-none"
                value={addressBarValue}
                onChange={(event) => setAddressBarValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    navigate();
                  }
                }}
              />
              <button
                type="button"
                aria-label="Bookmark current page"
                title="Bookmark current page"
                onClick={() => void invoke("add-bookmark", activeTabId)}
                className="text-white/35 hover:text-white"
              >
                <Star size={14} />
              </button>
              <button
                type="button"
                aria-label="More browser actions"
                title="More browser actions"
                className="text-white/35 hover:text-white"
              >
                <Ellipsis size={14} />
              </button>
            </div>
          </div>
        </header>
        <div className="synapse-browser-stage relative min-h-0 flex-1 overflow-hidden">
          {panel === "browser" ? (
            isHome ? (
              <HomePage onNavigate={(url) => void invoke("navigate-to", url, activeTabId)} />
            ) : (
              <BrowserView
                tabId={activeTabId}
                visible={!isHome && !settingsOpen && !commandOpen && !resizingAIPanel}
                layoutKey={`${panel}:${isAIPanelOpen}:${activeTabId}`}
              />
            )
          ) : (
            <div className="synapse-workspace h-full">
              <WorkspaceSurface panel={panel} />
            </div>
          )}
        </div>
        <footer className="synapse-footer flex h-7 shrink-0 items-center justify-between border-t px-4 text-[10px] uppercase tracking-wider text-white/30">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ready
          </span>
          <span>
            {"Tabs: "}
            {tabs.length}
          </span>
        </footer>
      </main>
      {isAIPanelOpen && panel === "browser" && (
        <aside
          className="synapse-surface synapse-orion-shell relative z-20 flex shrink-0 flex-col rounded-none border-y-0 border-r-0"
          style={{ width: aiPanelWidth }}
          aria-label="AI workspace"
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize AI panel"
            title="Drag to resize · double-click to reset"
            onPointerDown={startAIPanelResize}
            onDoubleClick={() => {
              setAIPanelWidth(AI_PANEL_DEFAULT_WIDTH);
              localStorage.setItem(AI_PANEL_WIDTH_KEY, String(AI_PANEL_DEFAULT_WIDTH));
            }}
            className={`synapse-resize-handle ${resizingAIPanel ? "is-active" : ""}`}
          />
          <AIWorkspacePanel />
        </aside>
      )}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      {commandOpen && (
        <div
          className="synapse-modal-backdrop absolute inset-0 z-40 flex items-start justify-center p-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="synapse-command synapse-modal w-full max-w-xl overflow-hidden rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
              <Search size={16} className="text-white/40" />
              <input
                autoFocus
                aria-label="Search Synapse commands"
                placeholder="Search Synapse…"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
              <kbd className="rounded-md border border-white/10 px-2 py-1 text-[9px] text-white/30">ESC</kbd>
            </div>
            <div className="space-y-1 p-2">
              <button
                type="button"
                onClick={() => runCommand("settings")}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <Settings size={15} />
                  Open Settings
                </span>
                <kbd className="text-[9px] text-white/25">⌘ ,</kbd>
              </button>
              <button
                type="button"
                onClick={() => runCommand("new-tab")}
                className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <Plus size={15} />
                  New Tab
                </span>
                <kbd className="text-[9px] text-white/25">⌘ T</kbd>
              </button>
              <button
                type="button"
                onClick={() => runCommand("terminal")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"
              >
                <Terminal size={15} />
                Open Terminal
              </button>
              <button
                type="button"
                onClick={() => runCommand("orion")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"
              >
                <Bot size={15} />
                Ask ORION
              </button>
              <button
                type="button"
                onClick={() => runCommand("history")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs text-white/70 hover:bg-white/[0.07] hover:text-white"
              >
                <RotateCcwClock size={15} />
                Search History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
