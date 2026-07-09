import { create } from 'zustand';
import { Workflow, WorkflowExecutionResult } from '../../common/types/workflow.js';

interface WorkflowStoreState {
  workflows: Workflow[];
  isLoading: boolean;
  error: string | null;
  fetchWorkflows: () => Promise<void>;
  saveWorkflow: (workflow: Workflow) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  executeWorkflow: (id: string) => Promise<WorkflowExecutionResult>;
  importWorkflow: (json: string) => Promise<void>;
  exportWorkflow: (id: string) => Promise<string>;
}

export const useWorkflowStore = create<WorkflowStoreState>((set, get) => ({
  workflows: [],
  isLoading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const workflows = await (window as any).electron.ipcRenderer.invoke('workflow:get-all');
      set({ workflows, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  saveWorkflow: async (workflow: Workflow) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.ipcRenderer.invoke('workflow:save', workflow);
      await get().fetchWorkflows();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  deleteWorkflow: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.ipcRenderer.invoke('workflow:delete', id);
      await get().fetchWorkflows();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  executeWorkflow: async (id: string) => {
    try {
      return await (window as any).electron.ipcRenderer.invoke('workflow:execute', id);
    } catch (error: any) {
      return { success: false, error: error.message, completedActions: 0, totalActions: 0 };
    }
  },

  importWorkflow: async (json: string) => {
    set({ isLoading: true, error: null });
    try {
      await (window as any).electron.ipcRenderer.invoke('workflow:import', json);
      await get().fetchWorkflows();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  exportWorkflow: async (id: string) => {
    try {
      return await (window as any).electron.ipcRenderer.invoke('workflow:export', id);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  }
}));
