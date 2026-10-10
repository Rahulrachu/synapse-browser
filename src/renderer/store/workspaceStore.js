import { create } from "zustand";

export const useWorkspaceStore = create((set, get) => ({
  notes: [],
  prompts: [],
  workspaceLayout: null,
  isDarkMode: true,
  isLoading: false,
  error: null,
  initialize: async () => {
    set({
      isLoading: true,
      error: null,
    });
    const bridge = typeof window !== "undefined" ? window.electron : void 0;
    if (!bridge?.invoke) {
      set({
        isLoading: false,
        error: "Desktop bridge unavailable. The workspace is running in preview mode.",
      });
      return;
    }
    try {
      const [notes, prompts, layout] = await Promise.all([
        window.electron.invoke("get-notes"),
        window.electron.invoke("get-prompts"),
        window.electron.invoke("get-layouts"),
      ]);
      set({
        notes,
        prompts,
        workspaceLayout: layout?.[0] || null,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        isLoading: false,
      });
    }
  },
  addNote: async (title, content) => {
    const previousNotes = get().notes;
    const newNote = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({
      notes: [...previousNotes, newNote],
    });
    try {
      await window.electron.invoke("save-note", newNote);
    } catch (err) {
      set({
        notes: previousNotes,
        error: `Failed to save note: ${err.message}`,
      });
    }
  },
  updateNote: async (noteId, title, content) => {
    const previousNotes = get().notes;
    const updatedNotes = previousNotes.map((n) =>
      n.id === noteId
        ? {
            ...n,
            title,
            content,
            updatedAt: Date.now(),
          }
        : n,
    );
    set({
      notes: updatedNotes,
    });
    try {
      const note = updatedNotes.find((n) => n.id === noteId);
      if (note) {
        await window.electron.invoke("save-note", note);
      }
    } catch (err) {
      set({
        notes: previousNotes,
        error: `Failed to update note: ${err.message}`,
      });
    }
  },
  deleteNote: async (noteId) => {
    const previousNotes = get().notes;
    set({
      notes: previousNotes.filter((n) => n.id !== noteId),
    });
    try {
      await window.electron.invoke("delete-note", noteId);
    } catch (err) {
      set({
        notes: previousNotes,
        error: `Failed to delete note: ${err.message}`,
      });
    }
  },
  addPrompt: async (text, category) => {
    const previousPrompts = get().prompts;
    const newPrompt = {
      id: Date.now().toString(),
      text,
      category,
      createdAt: Date.now(),
    };
    set({
      prompts: [...previousPrompts, newPrompt],
    });
    try {
      await window.electron.invoke("save-prompt", newPrompt);
    } catch (err) {
      set({
        prompts: previousPrompts,
        error: `Failed to save prompt: ${err.message}`,
      });
    }
  },
  deletePrompt: async (promptId) => {
    const previousPrompts = get().prompts;
    set({
      prompts: previousPrompts.filter((p) => p.id !== promptId),
    });
    try {
      await window.electron.invoke("delete-prompt", promptId);
    } catch (err) {
      set({
        prompts: previousPrompts,
        error: `Failed to delete prompt: ${err.message}`,
      });
    }
  },
  setWorkspaceLayout: async (layout) => {
    const previousLayout = get().workspaceLayout;
    set({
      workspaceLayout: layout,
    });
    try {
      await window.electron.invoke("update-layout", layout.id, layout);
    } catch (err) {
      set({
        workspaceLayout: previousLayout,
        error: `Failed to save layout: ${err.message}`,
      });
    }
  },
  toggleDarkMode: () =>
    set((state) => ({
      isDarkMode: !state.isDarkMode,
    })),
}));
