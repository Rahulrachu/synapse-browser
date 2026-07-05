import { create } from 'zustand';
import { Note, Prompt, WorkspaceLayout } from '@/common/utils';

interface WorkspaceStore {
  notes: Note[];
  prompts: Prompt[];
  workspaceLayout: WorkspaceLayout | null;
  isDarkMode: boolean;
  
  // Note actions
  addNote: (title: string, content: string) => void;
  updateNote: (noteId: string, title: string, content: string) => void;
  deleteNote: (noteId: string) => void;
  
  // Prompt actions
  addPrompt: (text: string, category: string) => void;
  deletePrompt: (promptId: string) => void;
  
  // Layout actions
  setWorkspaceLayout: (layout: WorkspaceLayout) => void;
  
  // Theme actions
  toggleDarkMode: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  notes: [],
  prompts: [],
  workspaceLayout: null,
  isDarkMode: true,
  
  addNote: (title, content) => set((state) => ({
    notes: [...state.notes, {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }],
  })),
  
  updateNote: (noteId, title, content) => set((state) => ({
    notes: state.notes.map(n => n.id === noteId
      ? { ...n, title, content, updatedAt: Date.now() }
      : n
    ),
  })),
  
  deleteNote: (noteId) => set((state) => ({
    notes: state.notes.filter(n => n.id !== noteId),
  })),
  
  addPrompt: (text, category) => set((state) => ({
    prompts: [...state.prompts, {
      id: Date.now().toString(),
      text,
      category,
      createdAt: Date.now(),
    }],
  })),
  
  deletePrompt: (promptId) => set((state) => ({
    prompts: state.prompts.filter(p => p.id !== promptId),
  })),
  
  setWorkspaceLayout: (layout) => set({ workspaceLayout: layout }),
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
