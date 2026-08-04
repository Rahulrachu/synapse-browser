import { TabData } from '../../common/utils.js';

export interface WorkspaceSnapshot {
  id: string;
  name: string;
  timestamp: number;
  tabs: TabData[];
  activeTabId: string | null;
  panelLayout: any;
  panelState: any;
  notes: any[];
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  panelLayout: any;
  panelState: any;
  createdAt: number;
  lastModified: number;
  isDefault?: boolean;
  isBuiltIn?: boolean;
  description?: string;
}
