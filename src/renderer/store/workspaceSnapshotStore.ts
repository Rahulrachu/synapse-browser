import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkspaceSnapshot } from '../types/workspace.js';
import { useBrowserStore } from './browserStore.js';
import { usePanelStore } from './panelStore.js';
import { useWorkspaceStore } from './workspaceStore.js';

interface WorkspaceSnapshotState {
  snapshots: WorkspaceSnapshot[];
  
  // Actions
  createSnapshot: (name: string) => void;
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  renameSnapshot: (id: string, newName: string) => void;
}

export const useWorkspaceSnapshotStore = create<WorkspaceSnapshotState>()(
  persist(
    (set, get) => ({
      snapshots: [],

      createSnapshot: (name) => {
        const browserState = useBrowserStore.getState();
        const panelState = usePanelStore.getState();
        const workspaceState = useWorkspaceStore.getState();

        // Infer layout from panel state
        let layout: 'single' | 'split-h' | 'split-v' | 'grid' = 'single';
        const { splitPanels } = panelState;
        if (splitPanels.left && splitPanels.right && splitPanels.top && splitPanels.bottom) layout = 'grid';
        else if (splitPanels.left && splitPanels.right) layout = 'split-h';
        else if (splitPanels.left && splitPanels.bottom) layout = 'split-v';

        const newSnapshot: WorkspaceSnapshot = {
          id: `snapshot-${Date.now()}`,
          name,
          timestamp: Date.now(),
          tabs: JSON.parse(JSON.stringify(browserState.tabs)),
          activeTabId: browserState.activeTabId,
          panelLayout: layout,
          panelState: {
            activePanel: panelState.activePanel,
            panelHistory: panelState.panelHistory,
            splitPanels: panelState.splitPanels,
            panelData: JSON.parse(JSON.stringify(panelState.panelData)),
          },
          notes: JSON.parse(JSON.stringify(workspaceState.notes)),
        };

        set((state) => ({
          snapshots: [newSnapshot, ...state.snapshots],
        }));
      },

      restoreSnapshot: (id) => {
        const snapshot = get().snapshots.find((s) => s.id === id);
        if (snapshot) {
          // Restore tabs
          useBrowserStore.setState({
            tabs: JSON.parse(JSON.stringify(snapshot.tabs)),
            activeTabId: snapshot.activeTabId,
          });

          // Restore panels
          const panelStore = usePanelStore.getState();
          panelStore.setPanelLayout(snapshot.panelLayout);
          panelStore.restorePanelState(JSON.parse(JSON.stringify(snapshot.panelState)));

          // Restore notes
          useWorkspaceStore.setState({
            notes: JSON.parse(JSON.stringify(snapshot.notes)),
          });
        }
      },

      deleteSnapshot: (id) => {
        set((state) => ({
          snapshots: state.snapshots.filter((s) => s.id !== id),
        }));
      },

      renameSnapshot: (id, newName) => {
        set((state) => ({
          snapshots: state.snapshots.map((s) =>
            s.id === id ? { ...s, name: newName } : s
          ),
        }));
      },
    }),
    {
      name: 'workspace-snapshots',
      version: 1,
    }
  )
);
