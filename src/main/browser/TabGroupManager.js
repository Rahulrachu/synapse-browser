import { nanoid } from "nanoid";

class TabGroupManager {
  groups = [];
  tabProperties = new Map();
  async createGroup(name, color) {
    const group = {
      id: nanoid(),
      name,
      color,
      tabs: [],
    };
    this.groups.push(group);
    return group;
  }
  async getGroups() {
    return this.groups;
  }
  async deleteGroup(id) {
    this.groups = this.groups.filter((g) => g.id !== id);
    return true;
  }
  async addTabToGroup(tabId, groupId) {
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      if (!group.tabs.includes(tabId)) {
        group.tabs.push(tabId);
      }
    }
    return group;
  }
  async removeTabFromGroup(tabId) {
    this.groups.forEach((group) => {
      group.tabs = group.tabs.filter((id) => id !== tabId);
    });
    return true;
  }
  pinTab(tabId) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, pinned: true });
  }
  unpinTab(tabId) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, pinned: false });
  }
  sleepTab(tabId) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, sleeping: true });
  }
  wakeTab(tabId) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, sleeping: false });
  }
  setTabColor(tabId, color) {
    const props = this.tabProperties.get(tabId) || {};
    this.tabProperties.set(tabId, { ...props, color });
  }
  getTabProperties(tabId) {
    return this.tabProperties.get(tabId) || { pinned: false, sleeping: false };
  }
}
export const tabGroupManager = new TabGroupManager();
