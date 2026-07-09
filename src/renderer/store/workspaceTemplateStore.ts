import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkspaceTemplate } from '../types/workspace.js';
import { PanelState } from '../types/panel.js';

interface WorkspaceTemplateState {
  templates: WorkspaceTemplate[];
  activeTemplateId: string | null;
  defaultTemplateId: string | null;
  
  // Actions
  saveCurrentAsTemplate: (name: string, panelLayout: any, panelState: PanelState) => void;
  createTemplate: (template: Omit<WorkspaceTemplate, 'id' | 'createdAt' | 'lastModified'>) => void;
  updateTemplate: (id: string, updates: Partial<WorkspaceTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  setDefaultTemplate: (id: string | null) => void;
  importTemplates: (json: string) => void;
  exportTemplates: () => string;
}

const BUILT_IN_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: 'built-in-developer',
    name: 'Developer',
    description: 'Optimized for coding with editor, terminal, and browser.',
    panelLayout: 'grid',
    isBuiltIn: true,
    panelState: {
      activePanel: 'browser',
      panelHistory: ['browser', 'terminal-panel', 'notes-panel', 'project-explorer'],
      splitPanels: {
        left: 'project-explorer',
        right: 'browser',
        top: 'terminal-panel',
        bottom: 'notes-panel',
      },
      panelData: {},
    },
    createdAt: Date.now(),
    lastModified: Date.now(),
  },
  {
    id: 'built-in-research',
    name: 'Research',
    description: 'Focus on gathering information and taking notes.',
    panelLayout: 'split-h',
    isBuiltIn: true,
    panelState: {
      activePanel: 'browser',
      panelHistory: ['browser', 'notes-panel'],
      splitPanels: {
        left: 'browser',
        right: 'notes-panel',
        top: null,
        bottom: null,
      },
      panelData: {},
    },
    createdAt: Date.now(),
    lastModified: Date.now(),
  },
  {
    id: 'built-in-writing',
    name: 'Writing',
    description: 'Clean interface for focused writing.',
    panelLayout: 'single',
    isBuiltIn: true,
    panelState: {
      activePanel: 'notes-panel',
      panelHistory: ['notes-panel'],
      splitPanels: {
        left: 'notes-panel',
        right: null,
        top: null,
        bottom: null,
      },
      panelData: {},
    },
    createdAt: Date.now(),
    lastModified: Date.now(),
  },
  {
    id: 'built-in-ai-assistant',
    name: 'AI Assistant',
    description: 'Interactive workspace with AI chat and browser.',
    panelLayout: 'split-h',
    isBuiltIn: true,
    panelState: {
      activePanel: 'ai-chat',
      panelHistory: ['ai-chat', 'browser'],
      splitPanels: {
        left: 'ai-chat',
        right: 'browser',
        top: null,
        bottom: null,
      },
      panelData: {},
    },
    createdAt: Date.now(),
    lastModified: Date.now(),
  },
  {
    id: 'built-in-minimal',
    name: 'Minimal',
    description: 'Just the browser, nothing else.',
    panelLayout: 'single',
    isBuiltIn: true,
    panelState: {
      activePanel: 'browser',
      panelHistory: ['browser'],
      splitPanels: {
        left: 'browser',
        right: null,
        top: null,
        bottom: null,
      },
      panelData: {},
    },
    createdAt: Date.now(),
    lastModified: Date.now(),
  },
];

export const useWorkspaceTemplateStore = create<WorkspaceTemplateState>()(
  persist(
    (set, get) => ({
      templates: BUILT_IN_TEMPLATES,
      activeTemplateId: null,
      defaultTemplateId: 'built-in-minimal',

      saveCurrentAsTemplate: (name, panelLayout, panelState) => {
        const newTemplate: WorkspaceTemplate = {
          id: `user-${Date.now()}`,
          name,
          panelLayout,
          panelState,
          createdAt: Date.now(),
          lastModified: Date.now(),
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      createTemplate: (templateData) => {
        const newTemplate: WorkspaceTemplate = {
          ...templateData,
          id: `user-${Date.now()}`,
          createdAt: Date.now(),
          lastModified: Date.now(),
        };
        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id && !t.isBuiltIn ? { ...t, ...updates, lastModified: Date.now() } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id || t.isBuiltIn),
          defaultTemplateId: state.defaultTemplateId === id ? null : state.defaultTemplateId,
          activeTemplateId: state.activeTemplateId === id ? null : state.activeTemplateId,
        }));
      },

      duplicateTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        if (template) {
          const duplicated: WorkspaceTemplate = {
            ...template,
            id: `user-${Date.now()}`,
            name: `${template.name} (Copy)`,
            isBuiltIn: false,
            createdAt: Date.now(),
            lastModified: Date.now(),
          };
          set((state) => ({
            templates: [...state.templates, duplicated],
          }));
        }
      },

      setDefaultTemplate: (id) => {
        set({ defaultTemplateId: id });
      },

      importTemplates: (json) => {
        try {
          const imported = JSON.parse(json);
          if (Array.isArray(imported)) {
            const validTemplates = imported.filter(t => t.name && t.panelLayout && t.panelState);
            set((state) => {
              const userTemplates = state.templates.filter(t => t.isBuiltIn);
              const newTemplates = validTemplates.map(t => ({
                ...t,
                id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                isBuiltIn: false,
                createdAt: Date.now(),
                lastModified: Date.now()
              }));
              return { templates: [...userTemplates, ...newTemplates] };
            });
          }
        } catch (e) {
          console.error('Failed to import templates', e);
        }
      },

      exportTemplates: () => {
        const userTemplates = get().templates.filter(t => !t.isBuiltIn);
        return JSON.stringify(userTemplates, null, 2);
      },
    }),
    {
      name: 'workspace-templates',
      version: 1,
      // Only persist user templates, not built-in ones which might change in code
      partialize: (state) => ({
        templates: state.templates.filter(t => !t.isBuiltIn),
        defaultTemplateId: state.defaultTemplateId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Merge persisted user templates with current built-in templates
          state.templates = [...BUILT_IN_TEMPLATES, ...state.templates];
        }
      }
    }
  )
);
