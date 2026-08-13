import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkspaceStore } from './workspaceStore';

// Mock window.electron
global.window = {
  electron: {
    invoke: vi.fn(),
  },
} as any;

describe('workspaceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useWorkspaceStore.getState();
    expect(state.notes).toEqual([]);
    expect(state.isDarkMode).toBe(true);
  });

  it('should toggle dark mode', () => {
    const { toggleDarkMode } = useWorkspaceStore.getState();
    toggleDarkMode();
    expect(useWorkspaceStore.getState().isDarkMode).toBe(false);
  });

  it('should not crash when the Electron bridge is unavailable', async () => {
    const originalElectron = (global.window as any).electron;
    delete (global.window as any).electron;

    await useWorkspaceStore.getState().initialize();

    expect(useWorkspaceStore.getState().isLoading).toBe(false);
    expect(useWorkspaceStore.getState().error).toContain('Desktop bridge unavailable');
    (global.window as any).electron = originalElectron;
  });

  it('should add a note optimistically and invoke IPC', async () => {
    const { addNote } = useWorkspaceStore.getState();
    const title = 'Test Note';
    const content = 'Test Content';
    
    await addNote(title, content);
    
    const notes = useWorkspaceStore.getState().notes;
    expect(notes.length).toBe(1);
    expect(notes[0].title).toBe(title);
    expect(window.electron.invoke).toHaveBeenCalledWith('save-note', expect.any(Object));
  });
});
