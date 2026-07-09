import { create } from 'zustand';
import { PluginInfo } from '../../common/types/plugin.js';

interface PluginStoreState {
  plugins: PluginInfo[];
  isLoading: boolean;
  error: string | null;
  fetchPlugins: () => Promise<void>;
  enablePlugin: (id: string) => Promise<void>;
  disablePlugin: (id: string) => Promise<void>;
  reloadPlugin: (id: string) => Promise<void>;
}

export const usePluginStore = create<PluginStoreState>((set, get) => ({
  plugins: [],
  isLoading: false,
  error: null,

  fetchPlugins: async () => {
    set({ isLoading: true });
    try {
      const plugins = await (window as any).electron.ipcRenderer.invoke('plugin:get-all');
      set({ plugins, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  enablePlugin: async (id: string) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('plugin:enable', id);
      await get().fetchPlugins();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  disablePlugin: async (id: string) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('plugin:disable', id);
      await get().fetchPlugins();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  reloadPlugin: async (id: string) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('plugin:reload', id);
      await get().fetchPlugins();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
