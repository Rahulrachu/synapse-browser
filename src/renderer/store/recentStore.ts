import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RecentItem, RecentItemType } from '../types/recent.js';

interface RecentStore {
  items: RecentItem[];
  
  // Actions
  addRecentItem: (name: string, path: string, type: RecentItemType, metadata?: Record<string, any>) => void;
  removeItem: (id: string) => void;
  clearHistory: () => void;
  togglePin: (id: string) => void;
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set, get) => ({
      items: [],

      addRecentItem: (name, path, type, metadata) => {
        set((state) => {
          // Remove existing item with same path to avoid duplicates
          const filtered = state.items.filter(item => item.path !== path);
          
          const newItem: RecentItem = {
            id: `recent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            name,
            path,
            lastOpened: Date.now(),
            isPinned: false,
            metadata
          };

          const newItems = [newItem, ...filtered].slice(0, 100); // Keep last 100 items
          return { items: newItems };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }));
      },

      clearHistory: () => {
        set((state) => ({
          items: state.items.filter((item) => item.isPinned)
        }));
      },

      togglePin: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
          )
        }));
      }
    }),
    {
      name: 'synapse-recent',
      version: 1,
    }
  )
);
