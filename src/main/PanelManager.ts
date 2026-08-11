import { nanoid } from 'nanoid';

export class PanelManager {
  private layouts: any[] = [];

  async createLayout(name: string, layout: any) {
    const newLayout = {
      id: nanoid(),
      name,
      layout,
      createdAt: new Date().toISOString()
    };
    this.layouts.push(newLayout);
    return newLayout;
  }

  async getLayouts() {
    return this.layouts;
  }

  async getLayout(id: string) {
    return this.layouts.find(l => l.id === id);
  }

  async updateLayout(id: string, layout: any) {
    const existing = this.layouts.find(l => l.id === id);
    if (existing) {
      existing.layout = layout;
    }
    return existing;
  }

  async deleteLayout(id: string) {
    this.layouts = this.layouts.filter(l => l.id !== id);
    return true;
  }

  async renameLayout(id: string, newName: string) {
    const layout = this.layouts.find(l => l.id === id);
    if (layout) {
      layout.name = newName;
    }
    return layout;
  }
}

export default new PanelManager();
