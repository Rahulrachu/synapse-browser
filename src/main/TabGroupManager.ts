import { nanoid } from 'nanoid';

export class TabGroupManager {
  private groups: any[] = [];
  private tabProperties: Map<string, any> = new Map();

  async createGroup(name: string, color: string) {
    const group = {
      id: nanoid(),
      name,
      color,
      tabs: []
    };
    this.groups.push(group);
    return group;
  }

  async getGroups() {
    return this.groups;
  }

  async deleteGroup(id: string) {
    this.groups = this.groups.filter(g => g.id !== id);
    return true;
  }

  async addTabToGroup(tabId: string, groupId: string) {
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      if (!group.tabs.includes(tabId)) {
        group.tabs.push(tabId);
      }
    }
    return group;
  }

  async removeTabFromGroup(tabId: string) {
    this.groups.forEach(group => {
      group.tabs = group.tabs.filter((id: string) => id !== tabId);
    });
    return true;
  }

  pinTab(tabId: string) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, pinned: true });
  }

  unpinTab(tabId: string) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, pinned: false });
  }

  sleepTab(tabId: string) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, sleeping: true });
  }

  wakeTab(tabId: string) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, sleeping: false });
  }

  setTabColor(tabId: string, color: string) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, color });
  }

  getTabProperties(tabId: string) {
    return this.tabProperties.get(tabId) || { pinned: false, sleeping: false };
  }
}

export default new TabGroupManager();
