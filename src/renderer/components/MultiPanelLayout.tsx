import React, { useState } from 'react';
import ResizablePanel from './ResizablePanel';
import PanelRouter from './PanelRouter';
import { usePanelStore } from '../store/panelStore';

interface MultiPanelLayoutProps {
  panelCount: 2 | 3 | 4;
}

export default function MultiPanelLayout({ panelCount }: MultiPanelLayoutProps) {
  const [panelSizes, setPanelSizes] = useState<number[]>(
    Array(panelCount).fill(100 / panelCount)
  );
  const splitPanels = usePanelStore((state) => state.splitPanels);

  const handleResize = (panelIndex: number, newSize: number) => {
    const newSizes = [...panelSizes];
    newSizes[panelIndex] = newSize;
    setPanelSizes(newSizes);
  };

  const getPanelForSlot = (index: number): string | null => {
    if (panelCount === 2) {
      return index === 0 ? splitPanels.left : splitPanels.right;
    } else if (panelCount === 3) {
      if (index === 0) return splitPanels.left;
      if (index === 1) return splitPanels.right;
      return splitPanels.top;
    } else {
      if (index === 0) return splitPanels.left;
      if (index === 1) return splitPanels.right;
      if (index === 2) return splitPanels.top;
      return splitPanels.bottom;
    }
  };

  const renderPanel = (index: number) => {
    const panelId = getPanelForSlot(index);
    return <PanelRouter key={index} panelId={panelId} />;
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
