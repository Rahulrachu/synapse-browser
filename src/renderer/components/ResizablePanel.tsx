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
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !panelRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let newSize: number;

      if (direction === 'horizontal') {
        const newWidth = e.clientX - rect.left;
        newSize = (newWidth / rect.width) * 100;
      } else {
        const newHeight = e.clientY - rect.top;
        newSize = (newHeight / rect.height) * 100;
      }

      // Clamp size between min and max
      newSize = Math.max(minSize, Math.min(maxSize, newSize));

      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minSize, maxSize, onResize]);

  const panelStyle = direction === 'horizontal'
    ? { width: `${size}%` }
    : { height: `${size}%` };

  const resizerClass = direction === 'horizontal'
    ? 'w-1 h-full cursor-col-resize hover:bg-synapse-accent'
    : 'w-full h-1 cursor-row-resize hover:bg-synapse-accent';

  return (
    <div
      ref={containerRef}
      className="flex-1 flex overflow-hidden"
      style={direction === 'horizontal' ? { flexDirection: 'row' } : { flexDirection: 'column' }}
    >
      <div
        ref={panelRef}
        className="flex-1 overflow-hidden"
        style={panelStyle}
      >
        {children}
      </div>

      {/* Resizer Handle */}
      <div
        className={`${resizerClass} bg-gray-300 dark:bg-gray-700 transition-colors ${
          isDragging ? 'bg-synapse-accent' : ''
        }`}
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      />
    </div>
  );
}
