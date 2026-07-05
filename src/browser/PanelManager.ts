import { WorkspaceLayout, PanelConfig } from '@/common/utils';

export class PanelManager {
  private layouts: Map<string, WorkspaceLayout> = new Map();
  private activeLayoutId: string | null = null;

  createLayout(name: string, panelCount: 2 | 3 | 4): WorkspaceLayout {
    const panels: PanelConfig[] = [];
    const baseSize = 100 / panelCount;

    for (let i = 0; i < panelCount; i++) {
      panels.push({
        id: `panel-${i}`,
        type: i === 0 ? 'browser' : i === 1 ? 'notes' : i === 2 ? 'terminal' : 'ai',
        size: baseSize,
      });
    }

    const layout: WorkspaceLayout = {
      id: Date.now().toString(),
      name,
      panelCount,
      panels,
    };

    this.layouts.set(layout.id, layout);
    this.activeLayoutId = layout.id;

    return layout;
  }

  getLayout(layoutId: string): WorkspaceLayout | undefined {
    return this.layouts.get(layoutId);
  }

  getAllLayouts(): WorkspaceLayout[] {
    return Array.from(this.layouts.values());
  }

  setActiveLayout(layoutId: string): void {
    if (this.layouts.has(layoutId)) {
      this.activeLayoutId = layoutId;
    }
  }

  getActiveLayout(): WorkspaceLayout | null {
    return this.activeLayoutId ? this.layouts.get(this.activeLayoutId) || null : null;
  }

  updatePanelSize(layoutId: string, panelId: string, newSize: number): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      const panel = layout.panels.find(p => p.id === panelId);
      if (panel) {
        panel.size = newSize;
      }
    }
  }

  deleteLayout(layoutId: string): void {
    this.layouts.delete(layoutId);
    if (this.activeLayoutId === layoutId) {
      this.activeLayoutId = this.layouts.keys().next().value || null;
    }
  }

  // Preset layouts
  static createTwoPanelLayout(): WorkspaceLayout {
    return {
      id: 'preset-2-panel',
      name: '2-Panel Layout',
      panelCount: 2,
      panels: [
        { id: 'panel-0', type: 'browser', size: 50 },
        { id: 'panel-1', type: 'notes', size: 50 },
      ],
    };
  }

  static createThreePanelLayout(): WorkspaceLayout {
    return {
      id: 'preset-3-panel',
      name: '3-Panel Layout',
      panelCount: 3,
      panels: [
        { id: 'panel-0', type: 'browser', size: 33.33 },
        { id: 'panel-1', type: 'notes', size: 33.33 },
        { id: 'panel-2', type: 'terminal', size: 33.34 },
      ],
    };
  }

  static createFourPanelLayout(): WorkspaceLayout {
    return {
      id: 'preset-4-panel',
      name: '4-Panel Layout',
      panelCount: 4,
      panels: [
        { id: 'panel-0', type: 'browser', size: 25 },
        { id: 'panel-1', type: 'notes', size: 25 },
        { id: 'panel-2', type: 'terminal', size: 25 },
        { id: 'panel-3', type: 'ai', size: 25 },
      ],
    };
  }
}

export default new PanelManager();
