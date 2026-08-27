import React, { useEffect, useRef } from 'react';

interface BrowserViewProps { tabId: string | null; layoutKey?: string; }
type BrowserBounds = { x: number; y: number; width: number; height: number };

const BrowserView: React.FC<BrowserViewProps> = ({ tabId, layoutKey = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastBounds = useRef<BrowserBounds>({ x: -1, y: -1, width: -1, height: -1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // ORION is a sibling flex item; opening/closing it changes this width without remounting the view.
    lastBounds.current = { x: -1, y: -1, width: -1, height: -1 };
    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      const next: BrowserBounds = { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
      if (next.width <= 0 || next.height <= 0 || !window.electron) return;
      if (next.x === lastBounds.current.x && next.y === lastBounds.current.y && next.width === lastBounds.current.width && next.height === lastBounds.current.height) return;
      lastBounds.current = next;
      void window.electron.invoke('set-browser-area-bounds', next);
    };
    const frame = requestAnimationFrame(() => requestAnimationFrame(updateBounds));
    const timers = [50, 150, 350].map(delay => window.setTimeout(updateBounds, delay));
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(container);
    window.addEventListener('resize', updateBounds);
    return () => { cancelAnimationFrame(frame); timers.forEach(timer => window.clearTimeout(timer)); resizeObserver.disconnect(); window.removeEventListener('resize', updateBounds); };
  }, [tabId, layoutKey]);

  return <div ref={containerRef} className="relative flex-1 min-h-0 min-w-0 overflow-hidden bg-black">{!tabId && <div className="flex h-full items-center justify-center text-gray-400"><p>No active tab</p></div>}</div>;
};

export default BrowserView;
