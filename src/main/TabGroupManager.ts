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

/**
 * Manages tab groups and individual tab properties, including persistence to the file system.
 * It allows creating, retrieving, deleting, and modifying tab groups, as well as managing
 * properties like pinning, sleeping, and coloring for individual tabs.
 */
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

  /**
   * Loads tab group and tab properties data from their respective JSON files.
   * Initializes empty data structures if files do not exist or are invalid.
   */
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

  /**
   * Creates a new tab group.
   * @param name The name of the new tab group.
   * @param color The color associated with the tab group. Defaults to '#3b82f6'.
   * @returns The newly created `TabGroup` object.
   */
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

  /**
   * Retrieves all saved tab groups.
   * @returns An array of `TabGroup` objects.
   */
  getGroups(): TabGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Retrieves a specific tab group by its ID.
   * @param id The unique identifier of the tab group.
   * @returns The `TabGroup` object if found, otherwise `undefined`.
   */
  getGroup(id: string): TabGroup | undefined {
    return this.groups.get(id);
  }

  /**
   * Deletes a tab group by its ID and unassigns its tabs from the group.
   * @param id The unique identifier of the tab group to delete.
   * @returns `true` if the tab group was deleted successfully, `false` otherwise.
   */
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

  /**
   * Adds a tab to an existing tab group.
   * @param tabId The ID of the tab to add.
   * @param groupId The ID of the target tab group.
   * @returns `true` if the tab was added to the group successfully, `false` otherwise.
   */
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

  /**
   * Removes a tab from its assigned tab group.
   * @param tabId The ID of the tab to remove from a group.
   * @returns `true` if the tab was removed from its group successfully, `false` otherwise.
   */
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

  /**
   * Pins a tab, setting its `isPinned` property to `true`.
   * @param tabId The ID of the tab to pin.
   */
  pinTab(tabId: string): void {
    const props = this.getTabProperties(tabId) || this.createTabProperties(tabId);
    props.isPinned = true;
    this.tabProperties.set(tabId, props);
    this.saveTabProperties();
  }

  /**
   * Unpins a tab, setting its `isPinned` property to `false`.
   * @param tabId The ID of the tab to unpin.
   */
  unpinTab(tabId: string): void {
    const props = this.tabProperties.get(tabId);
    if (props) {
      props.isPinned = false;
      this.tabProperties.set(tabId, props);
      this.saveTabProperties();
    }
  }

  /**
   * Marks a tab as sleeping, setting its `isSleeping` property to `true`.
   * @param tabId The ID of the tab to put to sleep.
   */
  sleepTab(tabId: string): void {
    const props = this.getTabProperties(tabId) || this.createTabProperties(tabId);
    props.isSleeping = true;
    this.tabProperties.set(tabId, props);
    this.saveTabProperties();
  }

  /**
   * Wakes up a sleeping tab, setting its `isSleeping` property to `false` and updating `lastActiveTime`.
   * @param tabId The ID of the tab to wake up.
   */
  wakeTab(tabId: string): void {
    const props = this.tabProperties.get(tabId);
    if (props) {
      props.isSleeping = false;
      props.lastActiveTime = Date.now();
      this.tabProperties.set(tabId, props);
      this.saveTabProperties();
    }
  }

  /**
   * Sets a custom color for a tab.
   * @param tabId The ID of the tab to color.
   * @param color The color string (e.g., hex code, CSS color name).
   */
  setTabColor(tabId: string, color: string): void {
    const props = this.getTabProperties(tabId) || this.createTabProperties(tabId);
    props.color = color;
    this.tabProperties.set(tabId, props);
    this.saveTabProperties();
  }

  /**
   * Retrieves the properties of a specific tab.
   * @param tabId The ID of the tab.
   * @returns The `TabProperties` object if found, otherwise `undefined`.
   */
  getTabProperties(tabId: string): TabProperties | undefined {
    return this.tabProperties.get(tabId);
  }

  /**
   * Creates default tab properties for a new tab.
   * @param tabId The ID of the tab for which to create properties.
   * @returns The newly created `TabProperties` object.
   */
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

  /**
   * Retrieves all stored tab properties.
   * @returns An array of `TabProperties` objects.
   */
  getAllTabProperties(): TabProperties[] {
    return Array.from(this.tabProperties.values());
  }

  /**
   * Deletes the properties associated with a specific tab.
   * @param tabId The ID of the tab whose properties are to be deleted.
   */
  deleteTabProperties(tabId: string): void {
    this.tabProperties.delete(tabId);
    this.saveTabProperties();
  }

  /**
   * Persists the current state of tab groups to the tab groups JSON file.
   * This method is called internally after any modification to the groups.
   */
  private saveGroups(): void {
    try {
      fs.writeFileSync(this.groupsFile, JSON.stringify(Array.from(this.groups.values()), null, 2));
    } catch (error) {
      console.error('Failed to save tab groups:', error);
    }
  }

  /**
   * Persists the current state of tab properties to the tab properties JSON file.
   * This method is called internally after any modification to the tab properties.
   */
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
