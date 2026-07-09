import { create } from 'zustand';
import { Permission, PermissionHistoryEntry, PermissionRequest } from '../../common/types/permission.js';

interface PermissionStoreState {
  permissions: Permission[];
  history: PermissionHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  fetchPermissions: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  updatePermission: (permission: Permission) => Promise<void>;
  requestPermission: (request: PermissionRequest) => Promise<boolean>;
}

export const usePermissionStore = create<PermissionStoreState>((set, get) => ({
  permissions: [],
  history: [],
  isLoading: false,
  error: null,

  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const permissions = await (window as any).electron.ipcRenderer.invoke('permission:get-all');
      set({ permissions, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchHistory: async () => {
    try {
      const history = await (window as any).electron.ipcRenderer.invoke('permission:get-history');
      set({ history });
    } catch (error: any) {
      console.error('Failed to fetch permission history:', error);
    }
  },

  updatePermission: async (permission: Permission) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('permission:update', permission);
      await get().fetchPermissions();
      await get().fetchHistory();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  requestPermission: async (request: PermissionRequest) => {
    try {
      return await (window as any).electron.ipcRenderer.invoke('permission:request', request);
    } catch (error: any) {
      console.error('Permission request failed:', error);
      return false;
    }
  }
}));
