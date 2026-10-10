import { useEffect, useRef } from "react";

export const BrowserView = ({ tabId, layoutKey = "", visible = true }) => {
  const containerRef = useRef(null);
  const lastBounds = useRef({
    x: -1,
    y: -1,
    width: -1,
    height: -1,
  });
  useEffect(() => {
    if (window.electron) void window.electron.invoke("set-browser-view-visibility", visible);
  }, [visible, tabId, layoutKey]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      const next = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
      if (
        next.x === lastBounds.current.x &&
        next.y === lastBounds.current.y &&
        next.width === lastBounds.current.width &&
        next.height === lastBounds.current.height
      )
        return;
      lastBounds.current = next;
      if (next.width > 0 && next.height > 0 && window.electron)
        void window.electron.invoke("set-browser-area-bounds", next);
    };
    lastBounds.current = {
      x: -1,
      y: -1,
      width: -1,
      height: -1,
    };
    const frame = requestAnimationFrame(updateBounds);
    const delayedFrame = window.setTimeout(updateBounds, 100);
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(container);
    window.addEventListener("resize", updateBounds);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(delayedFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, [tabId, layoutKey]);
  return (
    <div ref={containerRef} className="absolute inset-0 min-h-0 min-w-0 overflow-hidden bg-black">
      {!tabId && (
        <div className="flex h-full items-center justify-center text-gray-400">
          <p>No active tab</p>
        </div>
      )}
    </div>
  );
};
