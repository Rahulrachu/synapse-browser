import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PanelState } from '../types/panel.js';

interface PanelStoreState extends PanelState {
  setActivePanel: (panelId: string, slot?: 'left' | 'right' | 'top' | 'bottom') => void;
  closePanel: (slot?: 'left' | 'right' | 'top' | 'bottom') => void;
  updatePanelData: (panelId: string, data: any) => void;
  setPanelLayout: (layout: 'single' | 'split-h' | 'split-v' | 'grid') => void;
  restorePanelState: (state: PanelState) => void;
}

export const usePanelStore = create<PanelStoreState>()(
  persist(
    (set, get) => ({
      activePanel: 'browser',
      panelHistory: ['browser'],
      splitPanels: {
        left: 'browser',
        right: null,
        top: null,
        bottom: null,
      },
      panelData: {},

      setActivePanel: (panelId: string, slot: 'left' | 'right' | 'top' | 'bottom' = 'left') => {
        set((state) => {
          const newHistory = [...state.panelHistory];
          if (!newHistory.includes(panelId)) {
            newHistory.push(panelId);
          }

          const newSplitPanels = { ...state.splitPanels };
          newSplitPanels[slot] = panelId;

          return {
            activePanel: panelId,
            panelHistory: newHistory,
            splitPanels: newSplitPanels,
          };
        });
      },

      closePanel: (slot: 'left' | 'right' | 'top' | 'bottom' = 'right') => {
        set((state) => {
          const newSplitPanels = { ...state.splitPanels };
          newSplitPanels[slot] = null;

          return {
            splitPanels: newSplitPanels,
          };
        });
      },

      updatePanelData: (panelId: string, data: any) => {
        set((state) => ({
          panelData: {
            ...state.panelData,
            [panelId]: {
              ...state.panelData[panelId],
              ...data,
            },
          },
        }));
      },

      setPanelLayout: (layout: 'single' | 'split-h' | 'split-v' | 'grid') => {
        set((state) => {
          switch (layout) {
            case 'single':
              return {
                splitPanels: {
                  left: state.activePanel,
                  right: null,
                  top: null,
                  bottom: null,
                },
              };
            case 'split-h':
              return {
                splitPanels: {
                  left: state.activePanel,
                  right: state.splitPanels.right || 'notes',
                  top: null,
                  bottom: null,
                },
              };
            case 'split-v':
              return {
                splitPanels: {
                  left: state.activePanel,
                  right: null,
                  top: null,
                  bottom: state.splitPanels.bottom || 'notes',
                },
              };
            case 'grid':
              return {
                splitPanels: {
                  left: state.activePanel,
                  right: state.splitPanels.right || 'notes',
                  top: state.splitPanels.top || 'terminal',
                  bottom: state.splitPanels.bottom || 'prompts',
                },
              };
            default:
              return state;
          }
        });
      },

      restorePanelState: (newState: PanelState) => {
        set(newState);
      },
    }),
    {
      name: 'panel-store',
      version: 1,
    }
  )
);
