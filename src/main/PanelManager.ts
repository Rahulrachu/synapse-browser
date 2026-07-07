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

/**
 * Manages workspace layouts and panel configurations, including persistence to the file system.
 * It allows creating, retrieving, updating, deleting, and renaming workspace layouts.
 * It also provides methods for manipulating panels within a layout, such as splitting and resizing.
 */
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

  /**
   * Loads workspace layouts from the file system.
   * If the layouts file does not exist or is invalid, it logs an error and initializes an empty set of layouts.
   */
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

  /**
   * Creates a new workspace layout.
   * @param name The name of the new workspace layout.
   * @param layout The `PanelLayout` object defining the structure of the panels.
   * @returns The newly created and saved `WorkspaceLayout` object.
   */
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

  /**
   * Retrieves all saved workspace layouts.
   * @returns An array of `WorkspaceLayout` objects.
   */
  getLayouts(): WorkspaceLayout[] {
    return Array.from(this.layouts.values());
  }

  /**
   * Retrieves a specific workspace layout by its ID.
   * @param id The unique identifier of the workspace layout.
   * @returns The `WorkspaceLayout` object if found, otherwise `undefined`.
   */
  getLayout(id: string): WorkspaceLayout | undefined {
    return this.layouts.get(id);
  }

  /**
   * Updates the panel layout of an existing workspace layout.
   * @param id The unique identifier of the workspace layout to update.
   * @param layout The new `PanelLayout` object to apply.
   * @returns `true` if the layout was updated successfully, `false` otherwise.
   */
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

  /**
   * Deletes a workspace layout by its ID.
   * @param id The unique identifier of the workspace layout to delete.
   * @returns `true` if the layout was deleted successfully, `false` otherwise.
   */
  deleteLayout(id: string): boolean {
    if (this.layouts.delete(id)) {
      this.saveLayouts();
      return true;
    }
    return false;
  }

  /**
   * Renames an existing workspace layout.
   * @param id The unique identifier of the workspace layout to rename.
   * @param newName The new name for the workspace layout.
   * @returns `true` if the layout was renamed successfully, `false` otherwise.
   */
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

  /**
   * Creates a new vertical split panel layout with two tabs.
   * @param leftTab The ID of the tab to place in the left panel.
   * @param rightTab The ID of the tab to place in the right panel.
   * @returns A `PanelLayout` object representing the vertical split.
   */
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

  /**
   * Creates a new horizontal split panel layout with two tabs.
   * @param topTab The ID of the tab to place in the top panel.
   * @param bottomTab The ID of the tab to place in the bottom panel.
   * @returns A `PanelLayout` object representing the horizontal split.
   */
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

  /**
   * Creates a new grid panel layout with multiple tabs.
   * The tabs are arranged in a grid, with each panel having an equal size.
   * @param tabs An array of tab IDs to place in the grid layout.
   * @returns A `PanelLayout` object representing the grid layout.
   */
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

  /**
   * Adds a new panel with a specified tab to an existing workspace layout.
   * If the current layout is a single panel, it will be converted into a split layout.
   * @param layoutId The ID of the workspace layout to modify.
   * @param tabId The ID of the tab to add to the new panel.
   * @param position The position where the new panel should be added relative to existing panels.
   * @returns `true` if the panel was added successfully, `false` otherwise.
   */
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

  /**
   * Removes a panel from an existing workspace layout.
   * @param layoutId The ID of the workspace layout to modify.
   * @param panelId The ID of the panel to remove.
   * @returns `true` if the panel was removed successfully, `false` otherwise.
   */
  removePanelFromLayout(layoutId: string, panelId: string): boolean {
    const workspace = this.layouts.get(layoutId);
    if (!workspace || !workspace.layout.children) return false;

    workspace.layout.children = workspace.layout.children.filter((p) => p.id !== panelId);
    workspace.lastModified = Date.now();
    this.saveLayouts();
    return true;
  }

  /**
   * Resizes a panel within an existing workspace layout.
   * @param layoutId The ID of the workspace layout containing the panel.
   * @param panelId The ID of the panel to resize.
   * @param newSize The new size for the panel (e.g., percentage).
   * @returns `true` if the panel was resized successfully, `false` otherwise.
   */
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

  /**
   * Saves the current state of workspace layouts to the file system.
   * This method is called internally after any modification to the layouts.
   */
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
