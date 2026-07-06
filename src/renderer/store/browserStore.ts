import { create } from 'zustand';
import { TabData, TabGroup, Session } from '@/common/utils';

interface BrowserStore {
  tabs: TabData[];
  activeTabId: string | null;
  tabGroups: TabGroup[];
  bookmarks: Array<{ id: string; title: string; url: string }>;
  history: Array<{ id: string; title: string; url: string; visitedAt: number }>;
  sessions: Session[];
  
  // Tab actions
  addTab: (tab: TabData) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<TabData>) => void;
  reorderTabs: (tabs: TabData[]) => void;
  
  // Tab Group actions
  createGroup: (name: string, color: string) => void;
  deleteGroup: (groupId: string) => void;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  
  // Tab Properties
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  sleepTab: (tabId: string) => void;
  wakeTab: (tabId: string) => void;
  setTabColor: (tabId: string, color: string) => void;
  
  // Bookmark actions
  addBookmark: (title: string, url: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  
  // History actions
  addToHistory: (title: string, url: string) => void;
  clearHistory: () => void;
  
  // Session actions
  saveSession: (name: string, tabs: TabData[]) => void;
  restoreSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

export const useBrowserStore = create<BrowserStore>((set) => ({
  tabs: [],
  activeTabId: null,
  tabGroups: [],
  bookmarks: [],
  history: [],
  sessions: [],
  
  addTab: (tab) => set((state) => ({
    tabs: [...state.tabs, tab],
    activeTabId: tab.id,
  })),
  
  closeTab: (tabId) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== tabId);
    const newActiveTabId = state.activeTabId === tabId
      ? newTabs[0]?.id || null
      : state.activeTabId;
    return {
      tabs: newTabs,
      activeTabId: newActiveTabId,
    };
  }),
  
  setActiveTab: (tabId) => set((state) => ({
    tabs: state.tabs.map(t => ({
      ...t,
      isActive: t.id === tabId,
      lastActiveTime: t.id === tabId ? Date.now() : t.lastActiveTime,
    })),
    activeTabId: tabId,
  })),
  
  updateTab: (tabId, updates) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, ...updates } : t),
  })),
  
  reorderTabs: (tabs) => set({ tabs }),
  
  createGroup: (name, color) => set((state) => ({
    tabGroups: [...state.tabGroups, {
      id: Date.now().toString(),
      name,
      color,
      tabIds: [],
      createdAt: Date.now(),
    }],
  })),
  
  deleteGroup: (groupId) => set((state) => ({
    tabGroups: state.tabGroups.filter(g => g.id !== groupId),
    tabs: state.tabs.map(t => t.groupId === groupId ? { ...t, groupId: undefined } : t),
  })),
  
  addTabToGroup: (tabId, groupId) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, groupId } : t),
    tabGroups: state.tabGroups.map(g => 
      g.id === groupId && !g.tabIds.includes(tabId)
        ? { ...g, tabIds: [...g.tabIds, tabId] }
        : g
    ),
  })),
  
  removeTabFromGroup: (tabId) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, groupId: undefined } : t),
    tabGroups: state.tabGroups.map(g => ({
      ...g,
      tabIds: g.tabIds.filter(id => id !== tabId),
    })),
  })),
  
  pinTab: (tabId) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, isPinned: true } : t),
  })),
  
  unpinTab: (tabId) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, isPinned: false } : t),
  })),
  
  sleepTab: (tabId) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, isSleeping: true } : t),
  })),
  
  wakeTab: (tabId) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, isSleeping: false } : t),
  })),
  
  setTabColor: (tabId, color) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, color } : t),
  })),
  
  addBookmark: (title, url) => set((state) => ({
    bookmarks: [...state.bookmarks, { id: Date.now().toString(), title, url }],
  })),
  
  removeBookmark: (bookmarkId) => set((state) => ({
    bookmarks: state.bookmarks.filter(b => b.id !== bookmarkId),
  })),
  
  addToHistory: (title, url) => set((state) => ({
    history: [{ id: Date.now().toString(), title, url, visitedAt: Date.now() }, ...state.history],
  })),
  
  clearHistory: () => set({ history: [] }),
  
  saveSession: (name, tabs) => set((state) => ({
    sessions: [...state.sessions, {
      id: Date.now().toString(),
      name,
      tabs,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }],
  })),
  
  restoreSession: (sessionId) => set((state) => {
    const session = state.sessions.find(s => s.id === sessionId);
    if (session) {
      return {
        tabs: session.tabs,
        activeTabId: session.tabs[0]?.id || null,
      };
    }
    return state;
  }),
  
  deleteSession: (sessionId) => set((state) => ({
    sessions: state.sessions.filter(s => s.id !== sessionId),
  })),
}));
