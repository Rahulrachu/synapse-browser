import { create } from 'zustand';
type Note = { id: string; title: string; content: string; createdAt: number; updatedAt: number };
type Prompt = { id: string; text: string; category: string; createdAt: number };
type WorkspaceLayout = { id: string; [key: string]: unknown };

// Accessing window.electron from preload
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, fn: (...args: any[]) => void) => () => void;
      send: (channel: string, ...args: any[]) => void;
    };
  }
}

interface WorkspaceStore {
  notes: Note[];
  prompts: Prompt[];
  workspaceLayout: WorkspaceLayout | null;
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Initialization
  initialize: () => Promise<void>;

  // Note actions
  addNote: (title: string, content: string) => Promise<void>;
  updateNote: (noteId: string, title: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  
  // Prompt actions
  addPrompt: (text: string, category: string) => Promise<void>;
  deletePrompt: (promptId: string) => Promise<void>;
  
  // Layout actions
  setWorkspaceLayout: (layout: WorkspaceLayout) => Promise<void>;
  
  // Theme actions
  toggleDarkMode: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  notes: [],
  prompts: [],
  workspaceLayout: null,
  isDarkMode: true,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    const bridge = typeof window !== 'undefined' ? window.electron : undefined;
    if (!bridge?.invoke) {
      set({
        isLoading: false,
        error: 'Desktop bridge unavailable. The workspace is running in preview mode.',
      });
      return;
    }
    try {
      const [notes, prompts, layout] = await Promise.all([
        window.electron.invoke('get-notes'),
        window.electron.invoke('get-prompts'),
        window.electron.invoke('get-layouts'),
      ]);
      set({ notes, prompts, workspaceLayout: layout?.[0] || null, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  
  addNote: async (title, content) => {
    const previousNotes = get().notes;
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic update
    set({ notes: [...previousNotes, newNote] });

    try {
      await window.electron.invoke('save-note', newNote);
    } catch (err: any) {
      // Rollback on failure
      set({ notes: previousNotes, error: `Failed to save note: ${err.message}` });
    }
  },
  
  updateNote: async (noteId, title, content) => {
    const previousNotes = get().notes;
    const updatedNotes = previousNotes.map(n => n.id === noteId
      ? { ...n, title, content, updatedAt: Date.now() }
      : n
    );

    // Optimistic update
    set({ notes: updatedNotes });

    try {
      const note = updatedNotes.find(n => n.id === noteId);
      if (note) {
        await window.electron.invoke('save-note', note);
      }
    } catch (err: any) {
      // Rollback on failure
      set({ notes: previousNotes, error: `Failed to update note: ${err.message}` });
    }
  },
  
  deleteNote: async (noteId) => {
    const previousNotes = get().notes;
    set({ notes: previousNotes.filter(n => n.id !== noteId) });

    try {
      await window.electron.invoke('delete-note', noteId);
    } catch (err: any) {
      set({ notes: previousNotes, error: `Failed to delete note: ${err.message}` });
    }
  },
  
  addPrompt: async (text, category) => {
    const previousPrompts = get().prompts;
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      text,
      category,
      createdAt: Date.now(),
    };

    set({ prompts: [...previousPrompts, newPrompt] });

    try {
      await window.electron.invoke('save-prompt', newPrompt);
    } catch (err: any) {
      set({ prompts: previousPrompts, error: `Failed to save prompt: ${err.message}` });
    }
  },
  
  deletePrompt: async (promptId) => {
    const previousPrompts = get().prompts;
    set({ prompts: previousPrompts.filter(p => p.id !== promptId) });

    try {
      await window.electron.invoke('delete-prompt', promptId);
    } catch (err: any) {
      set({ prompts: previousPrompts, error: `Failed to delete prompt: ${err.message}` });
    }
  },
  
  setWorkspaceLayout: async (layout) => {
    const previousLayout = get().workspaceLayout;
    set({ workspaceLayout: layout });

    try {
      await window.electron.invoke('update-layout', layout.id, layout);
    } catch (err: any) {
      set({ workspaceLayout: previousLayout, error: `Failed to save layout: ${err.message}` });
    }
  },
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
