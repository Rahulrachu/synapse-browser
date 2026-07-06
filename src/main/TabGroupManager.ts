import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  tabIds: string[];
  createdAt: number;
}

export interface TabProperties {
  id: string;
  groupId?: string;
  color?: string;
  isPinned: boolean;
  isSleeping: boolean;
  lastActiveTime: number;
}

class TabGroupManager {
  private dataDir: string;
  private groupsFile: string;
  private tabPropsFile: string;
  private groups: Map<string, TabGroup> = new Map();
  private tabProperties: Map<string, TabProperties> = new Map();

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.groupsFile = path.join(this.dataDir, 'tab-groups.json');
    this.tabPropsFile = path.join(this.dataDir, 'tab-properties.json');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.loadData();
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.groupsFile)) {
        const data = JSON.parse(fs.readFileSync(this.groupsFile, 'utf-8'));
        data.forEach((g: TabGroup) => this.groups.set(g.id, g));
      }
      if (fs.existsSync(this.tabPropsFile)) {
        const data = JSON.parse(fs.readFileSync(this.tabPropsFile, 'utf-8'));
        data.forEach((p: TabProperties) => this.tabProperties.set(p.id, p));
      }
    } catch (error) {
      console.error('Failed to load tab data:', error);
    }
  }

  createGroup(name: string, color: string = '#3b82f6'): TabGroup {
    const group: TabGroup = {
      id: Date.now().toString(),
      name,
      color,
      tabIds: [],
      createdAt: Date.now(),
    };
    this.groups.set(group.id, group);
    this.saveGroups();
    return group;
  }

  getGroups(): TabGroup[] {
    return Array.from(this.groups.values());
  }

  getGroup(id: string): TabGroup | undefined {
    return this.groups.get(id);
  }

  deleteGroup(id: string): boolean {
    const group = this.groups.get(id);
    if (group) {
      group.tabIds.forEach((tabId) => {
        const props = this.tabProperties.get(tabId);
        if (props) {
          props.groupId = undefined;
          this.tabProperties.set(tabId, props);
        }
      });
      this.groups.delete(id);
      this.saveGroups();
      this.saveTabProperties();
      return true;
    }
    return false;
  }

  addTabToGroup(tabId: string, groupId: string): boolean {
    const group = this.groups.get(groupId);
    if (group && !group.tabIds.includes(tabId)) {
      group.tabIds.push(tabId);
      const props = this.getTabProperties(tabId) || this.createTabProperties(tabId);
      props.groupId = groupId;
      this.tabProperties.set(tabId, props);
      this.saveGroups();
      this.saveTabProperties();
      return true;
    }
    return false;
  }

  removeTabFromGroup(tabId: string): boolean {
    const props = this.tabProperties.get(tabId);
    if (props && props.groupId) {
      const group = this.groups.get(props.groupId);
      if (group) {
        group.tabIds = group.tabIds.filter((id) => id !== tabId);
        props.groupId = undefined;
        this.tabProperties.set(tabId, props);
        this.saveGroups();
        this.saveTabProperties();
        return true;
      }
    }
    return false;
  }

  pinTab(tabId: string): void {
    const props = this.getTabProperties(tabId) || this.createTabProperties(tabId);
    props.isPinned = true;
    this.tabProperties.set(tabId, props);
    this.saveTabProperties();
  }

  unpinTab(tabId: string): void {
    const props = this.tabProperties.get(tabId);
    if (props) {
      props.isPinned = false;
      this.tabProperties.set(tabId, props);
      this.saveTabProperties();
    }
  }

  sleepTab(tabId: string): void {
    const props = this.getTabProperties(tabId) || this.createTabProperties(tabId);
    props.isSleeping = true;
    this.tabProperties.set(tabId, props);
    this.saveTabProperties();
  }

  wakeTab(tabId: string): void {
    const props = this.tabProperties.get(tabId);
    if (props) {
      props.isSleeping = false;
      props.lastActiveTime = Date.now();
      this.tabProperties.set(tabId, props);
      this.saveTabProperties();
    }
  }

  setTabColor(tabId: string, color: string): void {
    const props = this.getTabProperties(tabId) || this.createTabProperties(tabId);
    props.color = color;
    this.tabProperties.set(tabId, props);
    this.saveTabProperties();
  }

  getTabProperties(tabId: string): TabProperties | undefined {
    return this.tabProperties.get(tabId);
  }

  private createTabProperties(tabId: string): TabProperties {
    const props: TabProperties = {
      id: tabId,
      isPinned: false,
      isSleeping: false,
      lastActiveTime: Date.now(),
    };
    this.tabProperties.set(tabId, props);
    return props;
  }

  getAllTabProperties(): TabProperties[] {
    return Array.from(this.tabProperties.values());
  }

  deleteTabProperties(tabId: string): void {
    this.tabProperties.delete(tabId);
    this.saveTabProperties();
  }

  private saveGroups(): void {
    try {
      fs.writeFileSync(this.groupsFile, JSON.stringify(Array.from(this.groups.values()), null, 2));
    } catch (error) {
      console.error('Failed to save tab groups:', error);
    }
  }

  private saveTabProperties(): void {
    try {
      fs.writeFileSync(
        this.tabPropsFile,
        JSON.stringify(Array.from(this.tabProperties.values()), null, 2)
      );
    } catch (error) {
      console.error('Failed to save tab properties:', error);
    }
  }
}

export default new TabGroupManager();
