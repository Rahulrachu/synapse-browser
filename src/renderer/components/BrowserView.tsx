import React, { useEffect, useRef } from 'react';

interface BrowserViewProps {
  tabId: string | null;
  isHome?: boolean;
}

type BrowserBounds = { x: number; y: number; width: number; height: number };

const BrowserView: React.FC<BrowserViewProps> = ({ tabId, isHome = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastBounds = useRef<BrowserBounds>({ x: -1, y: -1, width: -1, height: -1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      const next: BrowserBounds = { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
      if (next.x === lastBounds.current.x && next.y === lastBounds.current.y && next.width === lastBounds.current.width && next.height === lastBounds.current.height) return;
      lastBounds.current = next;
      if (next.width > 0 && next.height > 0 && window.electron) void window.electron.invoke('set-browser-area-bounds', next);
    };
    const frame = requestAnimationFrame(updateBounds);
    const delayedFrame = window.setTimeout(updateBounds, 100);
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(container);
    window.addEventListener('resize', updateBounds);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(delayedFrame); resizeObserver.disconnect(); window.removeEventListener('resize', updateBounds); };
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 min-h-0 min-w-0 overflow-hidden bg-black">
      {isHome ? (
        <div className="flex h-full flex-col items-center justify-center bg-[#08090c] px-8 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-synapse-accent shadow-lg shadow-synapse-accent/20"><span className="text-3xl font-bold text-white">S</span></div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Synapse Home</h1>
          <p className="mt-2 max-w-md text-sm text-white/45">Your intelligent workspace is ready. Open a site or ask ORION to help with the current task.</p>
        </div>
      ) : !tabId ? (
        <div className="flex h-full items-center justify-center text-gray-400"><p>No active tab</p></div>
      ) : null}
    </div>
  );
};

export default BrowserView;
