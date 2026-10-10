import { nanoid } from "nanoid";

class PanelManager {
  layouts = [];
  async createLayout(name, layout) {
    const newLayout = {
      id: nanoid(),
      name,
      layout,
      createdAt: new Date().toISOString(),
    };
    this.layouts.push(newLayout);
    return newLayout;
  }
  async getLayouts() {
    return this.layouts;
  }
  async getLayout(id) {
    return this.layouts.find((l) => l.id === id);
  }
  async updateLayout(id, layout) {
    const existing = this.layouts.find((l) => l.id === id);
    if (existing) {
      existing.layout = layout;
    }
    return existing;
  }
  async deleteLayout(id) {
    this.layouts = this.layouts.filter((l) => l.id !== id);
    return true;
  }
  async renameLayout(id, newName) {
    const layout = this.layouts.find((l) => l.id === id);
    if (layout) {
      layout.name = newName;
    }
    return layout;
  }
}
export const panelManager = new PanelManager();
