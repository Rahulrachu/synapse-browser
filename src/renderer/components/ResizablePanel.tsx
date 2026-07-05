import React, { useState, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  initialSize: number;
  onResize?: (newSize: number) => void;
  minSize?: number;
  maxSize?: number;
  direction?: 'horizontal' | 'vertical';
}

export default function ResizablePanel({
  children,
  initialSize,
  onResize,
  minSize = 20,
  maxSize = 80,
  direction = 'horizontal',
}: ResizablePanelProps) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      let newSize: number;

      if (direction === 'horizontal') {
        const newWidth = e.clientX - containerRect.left;
        newSize = (newWidth / containerRect.width) * 100;
      } else {
        const newHeight = e.clientY - containerRect.top;
        newSize = (newHeight / containerRect.height) * 100;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, minSize, maxSize, direction, onResize]);

  return (
    <div
      ref={containerRef}
      style={
        direction === 'horizontal'
          ? { width: `${size}%` }
          : { height: `${size}%` }
      }
      className="flex flex-col overflow-hidden"
    >
      {children}
      <div
        onMouseDown={() => setIsResizing(true)}
        className={`${
          direction === 'horizontal'
            ? 'w-1 cursor-col-resize hover:bg-synapse-accent'
            : 'h-1 cursor-row-resize hover:bg-synapse-accent'
        } bg-gray-700 transition`}
      />
    </div>
  );
}
