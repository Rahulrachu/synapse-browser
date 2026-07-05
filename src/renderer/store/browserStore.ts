import { create } from 'zustand';
import { TabData, WorkspaceLayout } from '@/common/utils';

interface BrowserStore {
  tabs: TabData[];
  activeTabId: string | null;
  bookmarks: Array<{ id: string; title: string; url: string }>;
  history: Array<{ id: string; title: string; url: string; visitedAt: number }>;
  
  // Tab actions
  addTab: (tab: TabData) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<TabData>) => void;
  
  // Bookmark actions
  addBookmark: (title: string, url: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  
  // History actions
  addToHistory: (title: string, url: string) => void;
  clearHistory: () => void;
}

export const useBrowserStore = create<BrowserStore>((set) => ({
  tabs: [],
  activeTabId: null,
  bookmarks: [],
  history: [],
  
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
  
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  
  updateTab: (tabId, updates) => set((state) => ({
    tabs: state.tabs.map(t => t.id === tabId ? { ...t, ...updates } : t),
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
}));
