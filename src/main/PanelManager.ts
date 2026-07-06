import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface PanelLayout {
  id: string;
  type: 'single' | 'vertical' | 'horizontal' | 'grid';
  children?: PanelLayout[];
  tabId?: string;
  size?: number;
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  layout: PanelLayout;
  createdAt: number;
  lastModified: number;
}

class PanelManager {
  private dataDir: string;
  private layoutsFile: string;
  private layouts: Map<string, WorkspaceLayout> = new Map();

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.layoutsFile = path.join(this.dataDir, 'workspace-layouts.json');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.loadLayouts();
  }

  private loadLayouts(): void {
    try {
      if (fs.existsSync(this.layoutsFile)) {
        const data = JSON.parse(fs.readFileSync(this.layoutsFile, 'utf-8'));
        data.forEach((layout: WorkspaceLayout) => {
          this.layouts.set(layout.id, layout);
        });
      }
    } catch (error) {
      console.error('Failed to load workspace layouts:', error);
    }
  }

  createLayout(name: string, layout: PanelLayout): WorkspaceLayout {
    const workspace: WorkspaceLayout = {
      id: Date.now().toString(),
      name,
      layout,
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    this.layouts.set(workspace.id, workspace);
    this.saveLayouts();
    return workspace;
  }

  getLayouts(): WorkspaceLayout[] {
    return Array.from(this.layouts.values());
  }

  getLayout(id: string): WorkspaceLayout | undefined {
    return this.layouts.get(id);
  }

  updateLayout(id: string, layout: PanelLayout): boolean {
    const workspace = this.layouts.get(id);
    if (workspace) {
      workspace.layout = layout;
      workspace.lastModified = Date.now();
      this.saveLayouts();
      return true;
    }
    return false;
  }

  deleteLayout(id: string): boolean {
    if (this.layouts.delete(id)) {
      this.saveLayouts();
      return true;
    }
    return false;
  }

  renameLayout(id: string, newName: string): boolean {
    const workspace = this.layouts.get(id);
    if (workspace) {
      workspace.name = newName;
      workspace.lastModified = Date.now();
      this.saveLayouts();
      return true;
    }
    return false;
  }

  createVerticalSplit(leftTab: string, rightTab: string): PanelLayout {
    return {
      id: Date.now().toString(),
      type: 'vertical',
      children: [
        { id: 'left-' + Date.now(), type: 'single', tabId: leftTab, size: 50 },
        { id: 'right-' + Date.now(), type: 'single', tabId: rightTab, size: 50 },
      ],
    };
  }

  createHorizontalSplit(topTab: string, bottomTab: string): PanelLayout {
    return {
      id: Date.now().toString(),
      type: 'horizontal',
      children: [
        { id: 'top-' + Date.now(), type: 'single', tabId: topTab, size: 50 },
        { id: 'bottom-' + Date.now(), type: 'single', tabId: bottomTab, size: 50 },
      ],
    };
  }

  createGridLayout(tabs: string[]): PanelLayout {
    const size = 100 / Math.ceil(Math.sqrt(tabs.length));
    return {
      id: Date.now().toString(),
      type: 'grid',
      children: tabs.map((tabId, index) => ({
        id: 'grid-' + index + '-' + Date.now(),
        type: 'single',
        tabId,
        size,
      })),
    };
  }

  addPanelToLayout(layoutId: string, tabId: string, position: 'left' | 'right' | 'top' | 'bottom'): boolean {
    const workspace = this.layouts.get(layoutId);
    if (!workspace) return false;

    const newPanel: PanelLayout = {
      id: 'panel-' + Date.now(),
      type: 'single',
      tabId,
      size: 50,
    };

    if (workspace.layout.type === 'single') {
      const oldPanel = workspace.layout;
      if (position === 'left' || position === 'right') {
        workspace.layout = {
          id: 'split-' + Date.now(),
          type: 'vertical',
          children: position === 'left' ? [newPanel, oldPanel] : [oldPanel, newPanel],
        };
      } else {
        workspace.layout = {
          id: 'split-' + Date.now(),
          type: 'horizontal',
          children: position === 'top' ? [newPanel, oldPanel] : [oldPanel, newPanel],
        };
      }
    } else if (workspace.layout.children) {
      workspace.layout.children.push(newPanel);
    }

    workspace.lastModified = Date.now();
    this.saveLayouts();
    return true;
  }

  removePanelFromLayout(layoutId: string, panelId: string): boolean {
    const workspace = this.layouts.get(layoutId);
    if (!workspace || !workspace.layout.children) return false;

    workspace.layout.children = workspace.layout.children.filter((p) => p.id !== panelId);
    workspace.lastModified = Date.now();
    this.saveLayouts();
    return true;
  }

  resizePanel(layoutId: string, panelId: string, newSize: number): boolean {
    const workspace = this.layouts.get(layoutId);
    if (!workspace) return false;

    const findAndResize = (layout: PanelLayout): boolean => {
      if (layout.id === panelId) {
        layout.size = newSize;
        return true;
      }
      if (layout.children) {
        for (const child of layout.children) {
          if (findAndResize(child)) return true;
        }
      }
      return false;
    };

    if (findAndResize(workspace.layout)) {
      workspace.lastModified = Date.now();
      this.saveLayouts();
      return true;
    }
    return false;
  }

  private saveLayouts(): void {
    try {
      fs.writeFileSync(
        this.layoutsFile,
        JSON.stringify(Array.from(this.layouts.values()), null, 2)
      );
    } catch (error) {
      console.error('Failed to save workspace layouts:', error);
    }
  }
}

export default new PanelManager();
