export const isDev = process.env.NODE_ENV === 'development';

export interface TabData {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  panelCount: 2 | 3 | 4;
  panels: PanelConfig[];
}

export interface PanelConfig {
  id: string;
  type: 'browser' | 'notes' | 'terminal' | 'ai' | 'file-explorer';
  size: number; // percentage
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
  createdAt: number;
}
