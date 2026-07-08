import { create } from 'zustand';
import { Skill, SkillSearchOptions } from '../../common/types/skill';

interface SkillStoreState {
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  fetchSkills: () => Promise<void>;
  searchSkills: (options: SkillSearchOptions) => Promise<void>;
  toggleSkill: (id: string, enabled: boolean) => Promise<void>;
}

export const useSkillStore = create<SkillStoreState>((set, get) => ({
  skills: [],
  isLoading: false,
  error: null,

  fetchSkills: async () => {
    set({ isLoading: true, error: null });
    try {
      const skills = await (window as any).electron.ipcRenderer.invoke('skill:get-all');
      set({ skills, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  searchSkills: async (options: SkillSearchOptions) => {
    set({ isLoading: true, error: null });
    try {
      const results = await (window as any).electron.ipcRenderer.invoke('skill:search', options);
      set({ skills: results, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  toggleSkill: async (id: string, enabled: boolean) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('skill:toggle', id, enabled);
      await get().fetchSkills();
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));
