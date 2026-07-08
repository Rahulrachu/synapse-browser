import { create } from 'zustand';
import { ExtensionMetadata, MarketplaceSearchOptions, ExtensionUpdateInfo } from '../../common/types/marketplace';

interface MarketplaceStoreState {
  extensions: ExtensionMetadata[];
  isLoading: boolean;
  error: string | null;
  updates: ExtensionUpdateInfo[];
  searchExtensions: (options: MarketplaceSearchOptions) => Promise<void>;
  installExtension: (id: string) => Promise<void>;
  uninstallExtension: (id: string) => Promise<void>;
  checkUpdates: () => Promise<void>;
}

export const useMarketplaceStore = create<MarketplaceStoreState>((set, get) => ({
  extensions: [],
  isLoading: false,
  error: null,
  updates: [],

  searchExtensions: async (options: MarketplaceSearchOptions) => {
    set({ isLoading: true, error: null });
    try {
      const results = await (window as any).electron.ipcRenderer.invoke('marketplace:search', options);
      set({ extensions: results, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  installExtension: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.ipcRenderer.invoke('marketplace:install', id);
      set({ isLoading: false });
      // Trigger plugin store refresh
      await (window as any).electron.ipcRenderer.invoke('plugin:get-all');
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  uninstallExtension: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.ipcRenderer.invoke('marketplace:uninstall', id);
      set({ isLoading: false });
      // Trigger plugin store refresh
      await (window as any).electron.ipcRenderer.invoke('plugin:get-all');
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  checkUpdates: async () => {
    try {
      const updates = await (window as any).electron.ipcRenderer.invoke('marketplace:check-updates');
      set({ updates });
    } catch (error: any) {
      console.error('Failed to check for updates:', error);
    }
  }
}));
