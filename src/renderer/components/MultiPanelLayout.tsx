import React, { useState } from 'react';
import ResizablePanel from './ResizablePanel';
import BrowserPanel from './BrowserPanel';
import WorkspacePanel from './WorkspacePanel';

interface MultiPanelLayoutProps {
  panelCount: 2 | 3 | 4;
}

export default function MultiPanelLayout({ panelCount }: MultiPanelLayoutProps) {
  const [panelSizes, setPanelSizes] = useState<number[]>(
    Array(panelCount).fill(100 / panelCount)
  );

  const handleResize = (panelIndex: number, newSize: number) => {
    const newSizes = [...panelSizes];
    newSizes[panelIndex] = newSize;
    setPanelSizes(newSizes);
  };

  const renderPanel = (index: number) => {
    switch (index % 2) {
      case 0:
        return <BrowserPanel key={index} />;
      case 1:
        return <WorkspacePanel key={index} />;
      default:
        return <BrowserPanel key={index} />;
    }
  };

  return (
    <div className="flex-1 flex gap-2 p-2 overflow-hidden">
      {Array.from({ length: panelCount }).map((_, index) => (
        <ResizablePanel
          key={index}
          initialSize={panelSizes[index]}
          onResize={(newSize) => handleResize(index, newSize)}
          minSize={20}
          maxSize={80}
          direction="horizontal"
        >
          {renderPanel(index)}
        </ResizablePanel>
      ))}
    </div>
  );
}
