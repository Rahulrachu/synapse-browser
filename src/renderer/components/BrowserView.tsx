import React, { useEffect, useRef, useState } from 'react';

interface BrowserViewProps {
  tabId: string | null;
}

const BrowserView: React.FC<BrowserViewProps> = ({ tabId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateBounds = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const newBounds = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      if (
        newBounds.x !== bounds.x ||
        newBounds.y !== bounds.y ||
        newBounds.width !== bounds.width ||
        newBounds.height !== bounds.height
      ) {
        setBounds(newBounds);
        window.electron.invoke('set-browser-area-bounds', newBounds);
      }
    };

    updateBounds();
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', updateBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBounds);
    };
  }, [bounds]);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative bg-white dark:bg-neutral-900 overflow-hidden"
    >
      {!tabId && (
        <div className="h-full flex items-center justify-center text-gray-400">
          <p>No active tab</p>
        </div>
      )}
    </div>
  );
};

export default BrowserView;
