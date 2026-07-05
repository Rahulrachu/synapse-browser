import { useEffect } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = (shortcut.ctrl || false) === (event.ctrlKey || event.metaKey);
        const shiftMatch = (shortcut.shift || false) === event.shiftKey;
        const altMatch = (shortcut.alt || false) === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common shortcuts
export const SHORTCUTS = {
  NEW_TAB: { key: 't', ctrl: true },
  CLOSE_TAB: { key: 'w', ctrl: true },
  NEW_NOTE: { key: 'n', ctrl: true },
  SAVE: { key: 's', ctrl: true },
  FIND: { key: 'f', ctrl: true },
  SETTINGS: { key: ',', ctrl: true },
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true },
  TOGGLE_THEME: { key: 'd', ctrl: true, shift: true },
};
