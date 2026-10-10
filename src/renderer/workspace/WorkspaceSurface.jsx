import { useState } from "react";
import { Bookmark, Code, Download, Files, FolderOpen, RotateCcwClock, Terminal } from "lucide-react";
import { panelLabels } from "../layout/panelLabels";

function FilesWorkspace() {
  const [projectPath, setProjectPath] = useState(localStorage.getItem("synapse.projectPath") || "");
  const [projectId, setProjectId] = useState(localStorage.getItem("synapse.projectId") || "");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("Choose a project directory to begin.");
  const invoke = async (channel, ...args) =>
    window.electron ? window.electron.invoke(channel, ...args) : void 0;
  const openProject = async () => {
    const path = projectPath.trim();
    if (!path) return;
    try {
      const project = await invoke("add-project", path);
      const id = project?.id || project?.project?.id;
      if (!id) throw new Error("Project could not be opened");
      localStorage.setItem("synapse.projectPath", path);
      localStorage.setItem("synapse.projectId", id);
      setProjectId(id);
      const result = await invoke("get-project-files", id);
      setFiles(Array.isArray(result) ? result : result?.files || []);
      setMessage("Project opened securely.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open project.");
    }
  };
  const refresh = async () => {
    if (!projectId) return;
    const result = await invoke("get-project-files", projectId);
    setFiles(Array.isArray(result) ? result : result?.files || []);
  };
  return (
    <section className="flex h-full flex-col bg-black" aria-label="Files workspace">
      <div className="flex items-center gap-3 border-b border-white/[0.08] p-5">
        <FolderOpen size={18} className="text-white/65" />
        <div>
          <h2 className="text-sm font-semibold">Files</h2>
          <p className="text-[11px] text-white/35">Project-root confined explorer</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="ml-auto rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/65 hover:bg-white/10"
        >
          Refresh
        </button>
      </div>
      <div className="flex gap-2 border-b border-white/[0.08] p-4">
        <input
          aria-label="Project directory"
          value={projectPath}
          onChange={(event) => setProjectPath(event.target.value)}
          placeholder="/path/to/project"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter") void openProject();
          }}
        />
        <button
          type="button"
          onClick={() => void openProject()}
          className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black"
        >
          Open
        </button>
      </div>
      <p className="border-b border-white/[0.06] px-5 py-3 text-[11px] text-white/40">{message}</p>
      <div className="flex-1 overflow-auto p-4">
        {files.length ? (
          files.map((file, index) => {
            const filePath = file.relativePath || file.path || file.name || "";
            return (
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("synapse.selectedFile", filePath);
                  localStorage.setItem("synapse.selectedProjectId", projectId);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/[0.07]"
                key={`${filePath}-${index}`}
              >
                <span className="text-white/35">
                  {file.isDirectory || file.type === "directory" ? (
                    <FolderOpen size={14} />
                  ) : (
                    <Files size={14} />
                  )}
                </span>
                {filePath}
              </button>
            );
          })
        ) : (
          <p className="p-4 text-xs text-white/30">No files loaded.</p>
        )}
      </div>
    </section>
  );
}
function EditorWorkspace() {
  const [path, setPath] = useState(localStorage.getItem("synapse.selectedFile") || "");
  const [projectId, setProjectId] = useState(
    localStorage.getItem("synapse.selectedProjectId") || localStorage.getItem("synapse.projectId") || "",
  );
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("Select a file in Files, or enter a relative path.");
  const invoke = async (channel, ...args) =>
    window.electron ? window.electron.invoke(channel, ...args) : void 0;
  const load = async () => {
    if (!projectId || !path.trim()) return;
    try {
      const result = await invoke("read-file", projectId, path.trim());
      setContent(typeof result === "string" ? result : result?.content || "");
      setMessage("Loaded.");
      localStorage.setItem("synapse.selectedFile", path.trim());
      localStorage.setItem("synapse.selectedProjectId", projectId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to read file.");
    }
  };
  const save = async () => {
    try {
      await invoke("write-file", projectId, path.trim(), content);
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save file.");
    }
  };
  return (
    <section className="flex h-full flex-col bg-black" aria-label="Editor workspace">
      <div className="flex items-center gap-3 border-b border-white/[0.08] p-5">
        <Code size={18} className="text-white/65" />
        <div>
          <h2 className="text-sm font-semibold">Editor</h2>
          <p className="text-[11px] text-white/35">Edit and save files inside the project root</p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          className="ml-auto rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-black"
        >
          Save
        </button>
      </div>
      <div className="flex gap-2 border-b border-white/[0.08] p-4">
        <input
          aria-label="Editor project id"
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          placeholder="Project ID"
          className="w-32 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs outline-none"
        />
        <input
          aria-label="Editor file path"
          value={path}
          onChange={(event) => setPath(event.target.value)}
          placeholder="relative/file.txt"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter") void load();
          }}
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
        >
          Open
        </button>
      </div>
      <p className="px-5 py-2 text-[11px] text-white/40">{message}</p>
      <textarea
        aria-label="Editor content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="min-h-0 flex-1 resize-none bg-[#050505] p-5 font-mono text-xs leading-5 text-white/80 outline-none"
        spellCheck={false}
      />
    </section>
  );
}
function TerminalWorkspace() {
  const [command, setCommand] = useState("pwd");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const run = async () => {
    if (!command.trim() || running || !window.electron) return;
    setRunning(true);
    try {
      const result = await window.electron.invoke("terminal-execute", {
        command,
      });
      setOutput([result?.output, result?.error].filter(Boolean).join("\\n") || "(completed with no output)");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Terminal request failed.");
    } finally {
      setRunning(false);
    }
  };
  return (
    <section className="flex h-full flex-col bg-black" aria-label="Terminal workspace">
      <div className="flex items-center gap-3 border-b border-white/[0.08] p-5">
        <Terminal size={18} className="text-white/65" />
        <div>
          <h2 className="text-sm font-semibold">Terminal</h2>
          <p className="text-[11px] text-white/35">Execute approved developer commands</p>
        </div>
      </div>
      <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap bg-[#050505] p-5 font-mono text-xs leading-5 text-emerald-200/75">
        {output || "Terminal ready. Try pwd or echo Synapse Browser Test."}
      </pre>
      <div className="flex gap-2 border-t border-white/[0.08] p-4">
        <span className="py-2 font-mono text-xs text-emerald-300">$</span>
        <input
          aria-label="Terminal command"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void run();
          }}
          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none"
        />
        <button
          type="button"
          onClick={() => void run()}
          disabled={running}
          className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-black disabled:opacity-40"
        >
          {running ? "Running…" : "Run"}
        </button>
      </div>
    </section>
  );
}
export function WorkspaceSurface({ panel }) {
  if (panel === "files") return <FilesWorkspace />;
  if (panel === "editor") return <EditorWorkspace />;
  if (panel === "terminal") return <TerminalWorkspace />;
  const descriptions = {
    history: "Visited pages will appear here after navigation.",
    bookmarks: "Save pages from the address bar to build your bookmark collection.",
    downloads: "Downloaded files and their progress will appear here.",
  };
  const icons = {
    history: <RotateCcwClock size={20} />,
    bookmarks: <Bookmark size={20} />,
    downloads: <Download size={20} />,
  };
  return (
    <section
      className="flex h-full flex-col items-center justify-center bg-black px-8 text-center"
      aria-label={`${panelLabels[panel]} workspace`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70">
        {icons[panel]}
      </div>
      <h2 className="text-sm font-semibold text-white">{panelLabels[panel]}</h2>
      <p className="mt-2 max-w-md text-xs leading-5 text-white/40">{descriptions[panel]}</p>
    </section>
  );
}
