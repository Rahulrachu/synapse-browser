import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const defaultHomeShortcuts = [
  {
    id: "google",
    label: "Google",
    url: "https://www.google.com",
  },
  {
    id: "youtube",
    label: "YouTube",
    url: "https://www.youtube.com",
  },
  {
    id: "gmail",
    label: "Gmail",
    url: "https://mail.google.com",
  },
  {
    id: "github",
    label: "GitHub",
    url: "https://github.com",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    url: "https://chatgpt.com",
  },
];
const homeWallpapers = [
  {
    id: "oled",
    label: "OLED Black",
    value: "#000000",
  },
  {
    id: "graphite",
    label: "Graphite",
    value: "linear-gradient(135deg,#030303 0%,#17191b 48%,#030303 100%)",
  },
  {
    id: "studio",
    label: "Studio Silver",
    value:
      "radial-gradient(circle at 70% 25%,rgba(190,196,200,.16),transparent 34%),linear-gradient(135deg,#030303 0%,#0b0d0e 55%,#151718 100%)",
  },
];
export function HomePage({ onNavigate }) {
  const [shortcuts, setShortcuts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("synapse.home.shortcuts") || "null");
      return Array.isArray(saved) && saved.length ? saved : defaultHomeShortcuts;
    } catch {
      return defaultHomeShortcuts;
    }
  });
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem("synapse.home.wallpaper") || "oled");
  const [customWallpaper, setCustomWallpaper] = useState(
    () => localStorage.getItem("synapse.home.customWallpaper") || "",
  );
  const [intensity, setIntensity] = useState(() =>
    Number(localStorage.getItem("synapse.home.wallpaperIntensity") || 0.18),
  );
  const [blur, setBlur] = useState(() => localStorage.getItem("synapse.home.wallpaperBlur") === "true");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [shortcutDraft, setShortcutDraft] = useState(null);
  useEffect(() => {
    localStorage.setItem("synapse.home.shortcuts", JSON.stringify(shortcuts));
  }, [shortcuts]);
  useEffect(() => {
    localStorage.setItem("synapse.home.wallpaper", wallpaper);
  }, [wallpaper]);
  useEffect(() => {
    localStorage.setItem("synapse.home.customWallpaper", customWallpaper);
  }, [customWallpaper]);
  useEffect(() => {
    localStorage.setItem("synapse.home.wallpaperIntensity", String(intensity));
  }, [intensity]);
  useEffect(() => {
    localStorage.setItem("synapse.home.wallpaperBlur", String(blur));
  }, [blur]);
  const wallpaperValue =
    customWallpaper && wallpaper === "custom"
      ? `url(${customWallpaper})`
      : homeWallpapers.find((item) => item.id === wallpaper)?.value || "#000";
  const editShortcut = (shortcut) =>
    setShortcutDraft(
      shortcut
        ? {
            ...shortcut,
          }
        : {
            id: "",
            label: "",
            url: "https://",
          },
    );
  const saveShortcut = () => {
    const draft = shortcutDraft;
    if (!draft || !draft.label.trim() || !draft.url.trim()) return;
    const next = {
      ...draft,
      id: draft.id || `${Date.now()}`,
      label: draft.label.trim(),
      url: draft.url.trim(),
    };
    setShortcuts((current) =>
      draft.id ? current.map((item) => (item.id === draft.id ? next : item)) : [...current, next],
    );
    setShortcutDraft(null);
  };
  const removeShortcut = (id) => setShortcuts((current) => current.filter((item) => item.id !== id));
  const moveShortcut = (index, direction) =>
    setShortcuts((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const chooseWallpaper = (id) => {
    setWallpaper(id);
    setCustomWallpaper(id === "custom" ? customWallpaper : "");
  };
  const loadWallpaper = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomWallpaper(String(reader.result));
      setWallpaper("custom");
    };
    reader.readAsDataURL(file);
  };
  return (
    <section
      className="synapse-home relative flex h-full min-h-0 flex-col items-center justify-center overflow-hidden px-6 py-10"
      aria-label="Synapse Home"
      style={{
        backgroundImage: wallpaperValue,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="synapse-home-overlay absolute inset-0"
        style={{
          opacity: intensity,
          backdropFilter: blur ? "blur(12px)" : void 0,
        }}
        aria-hidden="true"
      />
      <div className="synapse-home-content relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div className="synapse-home-mark mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-semibold text-black">
          S
        </div>
        <p className="synapse-kicker">SYNAPSE HOME · ORION READY</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">
          {"Good "}
          {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
        </h1>
        <p className="mt-3 text-sm text-white/45">Search the web or enter a URL</p>
        <div className="synapse-home-search mt-7 flex w-full max-w-2xl items-center gap-3 rounded-2xl px-5 py-4">
          <Search size={17} className="text-white/45" />
          <input
            aria-label="Search the web or enter a URL"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            placeholder="Search the web or enter a URL"
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.currentTarget.value.trim())
                onNavigate(event.currentTarget.value.trim());
            }}
          />
          <kbd className="hidden rounded-lg border border-white/10 px-2 py-1 text-[9px] text-white/25 sm:block">
            ENTER
          </kbd>
        </div>
        <div className="mt-9 flex w-full max-w-2xl items-center justify-between">
          <span className="synapse-kicker">QUICK SHORTCUTS</span>
          <button
            type="button"
            onClick={() => setCustomizeOpen((open) => !open)}
            className="synapse-home-customize rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-wider"
          >
            Customize
          </button>
        </div>
        <div className="synapse-shortcut-grid mt-3 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shortcuts.map((shortcut, index) => (
            <div className="synapse-shortcut-tile group relative" key={shortcut.id}>
              <button
                type="button"
                onClick={() => onNavigate(shortcut.url)}
                className="flex min-h-[88px] w-full flex-col items-center justify-center gap-2 rounded-xl text-xs text-white/70 hover:text-white"
              >
                <span className="synapse-shortcut-glyph">{shortcut.label.slice(0, 1).toUpperCase()}</span>
                <span className="max-w-full truncate px-2">{shortcut.label}</span>
              </button>
              <div className="synapse-shortcut-actions absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
                <button
                  type="button"
                  aria-label={`Move ${shortcut.label} left`}
                  onClick={() => moveShortcut(index, -1)}
                  className="p-1 text-[10px]"
                  disabled={index === 0}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Move ${shortcut.label} right`}
                  onClick={() => moveShortcut(index, 1)}
                  className="p-1 text-[10px]"
                  disabled={index === shortcuts.length - 1}
                >
                  →
                </button>
                <button
                  type="button"
                  aria-label={`Edit ${shortcut.label}`}
                  onClick={() => editShortcut(shortcut)}
                  className="p-1 text-[10px]"
                >
                  ✎
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${shortcut.label}`}
                  onClick={() => removeShortcut(shortcut.id)}
                  className="p-1 text-[10px]"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => editShortcut()}
            className="synapse-shortcut-tile flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl text-xs text-white/45 hover:text-white"
          >
            <span className="synapse-shortcut-glyph">+</span>
            <span>Add shortcut</span>
          </button>
        </div>
      </div>
      {shortcutDraft && (
        <div
          className="synapse-home-customize-panel synapse-shortcut-editor absolute inset-x-5 bottom-5 z-30 mx-auto w-full max-w-sm rounded-2xl p-4 text-left"
          role="dialog"
          aria-label="Edit Home shortcut"
        >
          <div className="flex items-center justify-between">
            <span className="synapse-kicker">{shortcutDraft.id ? "EDIT SHORTCUT" : "ADD SHORTCUT"}</span>
            <button
              type="button"
              aria-label="Close shortcut editor"
              onClick={() => setShortcutDraft(null)}
              className="text-white/45 hover:text-white"
            >
              ×
            </button>
          </div>
          <label className="mt-4 block text-[10px] uppercase tracking-wider text-white/45">
            Name
            <input
              autoFocus
              aria-label="Shortcut name"
              value={shortcutDraft.label}
              onChange={(event) =>
                setShortcutDraft((current) =>
                  current
                    ? {
                        ...current,
                        label: event.target.value,
                      }
                    : current,
                )
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-white/40"
            />
          </label>
          <label className="mt-3 block text-[10px] uppercase tracking-wider text-white/45">
            URL
            <input
              aria-label="Shortcut URL"
              value={shortcutDraft.url}
              onChange={(event) =>
                setShortcutDraft((current) =>
                  current
                    ? {
                        ...current,
                        url: event.target.value,
                      }
                    : current,
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") saveShortcut();
              }}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-white/40"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShortcutDraft(null)}
              className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-white/60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveShortcut}
              className="rounded-lg bg-white px-3 py-2 text-[11px] font-medium text-black"
            >
              Save shortcut
            </button>
          </div>
        </div>
      )}
      {customizeOpen && (
        <div
          className="synapse-home-customize-panel absolute bottom-5 right-5 z-20 w-72 rounded-2xl p-4 text-left"
          role="dialog"
          aria-label="Customize Synapse Home"
        >
          <div className="flex items-center justify-between">
            <span className="synapse-kicker">HOME MATERIAL</span>
            <button
              type="button"
              aria-label="Close Customize"
              onClick={() => setCustomizeOpen(false)}
              className="text-white/45 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {homeWallpapers.map((item) => (
              <button
                type="button"
                onClick={() => chooseWallpaper(item.id)}
                className={`h-10 rounded-lg border text-[9px] ${wallpaper === item.id ? "border-white/60" : "border-white/10"}`}
                style={{
                  background: item.value,
                }}
                aria-label={item.label}
                key={item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-[10px] text-white/60">
            Use local image
            <input type="file" accept="image/*" onChange={loadWallpaper} className="sr-only" />
          </label>
          <label className="mt-3 block text-[10px] text-white/55">
            Intensity
            <input
              aria-label="Wallpaper intensity"
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <label className="mt-3 flex items-center justify-between text-[10px] text-white/55">
            Blur overlay
            <input
              aria-label="Wallpaper blur"
              type="checkbox"
              checked={blur}
              onChange={(event) => setBlur(event.target.checked)}
            />
          </label>
        </div>
      )}
    </section>
  );
}
