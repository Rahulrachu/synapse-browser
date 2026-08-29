import React, { useEffect, useRef } from 'react';
import { Link2 } from 'lucide-react';

interface HomeShortcut { title: string; url: string; }
interface HomePreferences { background: string; shortcuts: HomeShortcut[]; }
interface BrowserViewProps { tabId: string | null; isHome?: boolean; homePreferences?: HomePreferences; onOpenShortcut?: (url: string) => void; }
type BrowserBounds = { x: number; y: number; width: number; height: number };

const BrowserView: React.FC<BrowserViewProps> = ({ tabId, isHome = false, homePreferences, onOpenShortcut }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastBounds = useRef<BrowserBounds>({ x: -1, y: -1, width: -1, height: -1 });
  useEffect(() => {
    const container = containerRef.current; if (!container) return;
    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      const next = { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
      if (JSON.stringify(next) === JSON.stringify(lastBounds.current)) return;
      lastBounds.current = next;
      if (next.width > 0 && next.height > 0 && window.electron) void window.electron.invoke('set-browser-area-bounds', next);
    };
    const frame = requestAnimationFrame(updateBounds); const delayedFrame = window.setTimeout(updateBounds, 100);
    const resizeObserver = new ResizeObserver(updateBounds); resizeObserver.observe(container); window.addEventListener('resize', updateBounds);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(delayedFrame); resizeObserver.disconnect(); window.removeEventListener('resize', updateBounds); };
  }, []);

  if (!isHome) return <div ref={containerRef} className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-black">{!tabId && <div className="flex h-full items-center justify-center text-gray-400"><p>No active tab</p></div>}</div>;
  const background = homePreferences?.background || '#08090c';
  const style = background.trim().startsWith('http') ? { backgroundImage: `linear-gradient(rgba(8,9,12,.56), rgba(8,9,12,.88)), url(${JSON.stringify(background)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: background.trim() || '#08090c' };
  return <div ref={containerRef} className="relative min-h-0 min-w-0 flex-1 overflow-auto" style={style}>
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col items-center px-6 py-14 text-center"><img src="icon.png" alt="Synapse Browser" className="mb-5 h-20 w-20 rounded-3xl border border-white/10 object-cover shadow-2xl" /><h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow">Synapse Home</h1><p className="mt-2 max-w-md text-sm text-white/60">Your intelligent workspace is ready. Open a site or ask ORION to help with the current task.</p>
      <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">{(homePreferences?.shortcuts || []).filter(item => item.url.trim()).map((shortcut, index) => <button key={`${shortcut.url}-${index}`} onClick={() => onOpenShortcut?.(shortcut.url)} className="group rounded-2xl border border-white/10 bg-black/25 p-4 text-left backdrop-blur transition hover:-translate-y-0.5 hover:border-synapse-accent/50 hover:bg-black/40"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-synapse-accent"><Link2 size={16} /></div><div className="truncate text-sm font-medium text-white">{shortcut.title || shortcut.url}</div><div className="mt-1 truncate text-[11px] text-white/40">{shortcut.url.replace(/^https?:\/\//, '')}</div></button>)}</div>
    </div>
  </div>;
};
export default BrowserView;
