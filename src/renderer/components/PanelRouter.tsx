import React, { Suspense } from 'react';
import { panelRegistry } from '../registry/PanelRegistry';
import { useWorkspaceStore } from '../store/workspaceStore';

interface PanelRouterProps {
  panelId: string | null;
  fallback?: React.ReactNode;
}

const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-synapse-accent mx-auto mb-4"></div>
      <p className="text-gray-400">Loading panel...</p>
    </div>
  </div>
);

export default function PanelRouter({ panelId, fallback }: PanelRouterProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);

  if (!panelId) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-synapse-darker' : 'bg-gray-50'}`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No panel selected</p>
      </div>
    );
  }

  const panelEntry = panelRegistry.get(panelId);

  if (!panelEntry) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-synapse-darker' : 'bg-gray-50'}`}>
        <p className={isDarkMode ? 'text-red-400' : 'text-red-500'}>Panel not found: {panelId}</p>
      </div>
    );
  }

  const Component = panelEntry.component;

  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <Component />
    </Suspense>
  );
}
