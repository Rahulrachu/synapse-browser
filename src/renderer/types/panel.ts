import { ReactNode } from 'react';

export interface PanelRegistryEntry {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  component: React.ComponentType<any>;
  permissions?: string[];
  defaultLayout?: 'full' | 'split' | 'float';
  shortcuts?: {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  };
  lazy?: boolean;
}

export interface PanelState {
  activePanel: string | null;
  panelHistory: string[];
  splitPanels: {
    left: string | null;
    right: string | null;
    top?: string | null;
    bottom?: string | null;
  };
  panelData: Record<string, any>;
}

export interface PanelContextType {
  registry: Map<string, PanelRegistryEntry>;
  state: PanelState;
  setActivePanel: (panelId: string, slot?: 'left' | 'right' | 'top' | 'bottom') => void;
  closePanel: (slot?: 'left' | 'right' | 'top' | 'bottom') => void;
  updatePanelData: (panelId: string, data: any) => void;
  registerPanel: (entry: PanelRegistryEntry) => void;
  unregisterPanel: (panelId: string) => void;
}
