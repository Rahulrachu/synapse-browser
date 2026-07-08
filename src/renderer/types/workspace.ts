import { PanelState } from './panel';

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description?: string;
  panelLayout: 'single' | 'split-h' | 'split-v' | 'grid';
  panelState: PanelState;
  isBuiltIn?: boolean;
  createdAt: number;
  lastModified: number;
}

export interface WorkspaceTemplateManager {
  templates: WorkspaceTemplate[];
  activeTemplateId: string | null;
  defaultTemplateId: string | null;
}

export interface WorkspaceSnapshot {
  id: string;
  name: string;
  timestamp: number;
  tabs: any[]; // TabData[]
  activeTabId: string | null;
  panelLayout: 'single' | 'split-h' | 'split-v' | 'grid';
  panelState: PanelState;
  notes: any[]; // Note[]
}

