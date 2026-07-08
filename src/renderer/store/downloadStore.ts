import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DownloadItem, DownloadStatus } from '../types/download';

interface DownloadStore {
  downloads: DownloadItem[];
  activeCount: number;
  
  // Actions
  addDownload: (download: Partial<DownloadItem>) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
  clearCompleted: () => void;
  
  // Controls (delegated to IPC)
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  retryDownload: (id: string) => void;
  openFile: (path: string) => void;
  openFolder: (path: string) => void;
}

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      downloads: [],
      activeCount: 0,

      addDownload: (download) => {
        const newItem: DownloadItem = {
          id: download.id || `dl-${Date.now()}`,
          filename: download.filename || 'Unknown',
          url: download.url || '',
          path: download.path || '',
          size: download.size || 0,
          receivedBytes: download.receivedBytes || 0,
          status: download.status || 'downloading',
          startTime: download.startTime || Date.now(),
          speed: 0,
          ...download
        };

        set((state) => {
          const newDownloads = [newItem, ...state.downloads];
          return {
            downloads: newDownloads,
            activeCount: newDownloads.filter(d => d.status === 'downloading' || d.status === 'paused').length
          };
        });
      },

      updateDownload: (id, updates) => {
        set((state) => {
          const newDownloads = state.downloads.map((d) => {
            if (d.id === id) {
              const updated = { ...d, ...updates };
              // Calculate speed if receivedBytes updated
              if (updates.receivedBytes !== undefined && updates.receivedBytes > d.receivedBytes) {
                const timeDiff = (Date.now() - d.startTime) / 1000;
                updated.speed = updated.receivedBytes / timeDiff;
                if (updated.size > 0) {
                  updated.remainingTime = (updated.size - updated.receivedBytes) / updated.speed;
                }
              }
              return updated;
            }
            return d;
          });
          return {
            downloads: newDownloads,
            activeCount: newDownloads.filter(d => d.status === 'downloading' || d.status === 'paused').length
          };
        });
      },

      removeDownload: (id) => {
        set((state) => {
          const newDownloads = state.downloads.filter((d) => d.id !== id);
          return {
            downloads: newDownloads,
            activeCount: newDownloads.filter(d => d.status === 'downloading' || d.status === 'paused').length
          };
        });
      },

      clearCompleted: () => {
        set((state) => {
          const newDownloads = state.downloads.filter((d) => d.status !== 'completed');
          return {
            downloads: newDownloads,
            activeCount: newDownloads.filter(d => d.status === 'downloading' || d.status === 'paused').length
          };
        });
      },

      pauseDownload: (id) => {
        (window as any).electron.ipcRenderer.send('pause-download', id);
        get().updateDownload(id, { status: 'paused' });
      },

      resumeDownload: (id) => {
        (window as any).electron.ipcRenderer.send('resume-download', id);
        get().updateDownload(id, { status: 'downloading' });
      },

      cancelDownload: (id) => {
        (window as any).electron.ipcRenderer.send('cancel-download', id);
        get().updateDownload(id, { status: 'cancelled', endTime: Date.now() });
      },

      retryDownload: (id) => {
        const download = get().downloads.find(d => d.id === id);
        if (download) {
          (window as any).electron.ipcRenderer.send('retry-download', download.url);
          get().removeDownload(id);
        }
      },

      openFile: (path) => {
        (window as any).electron.ipcRenderer.send('open-file', path);
      },

      openFolder: (path) => {
        (window as any).electron.ipcRenderer.send('open-folder', path);
      }
    }),
    {
      name: 'synapse-downloads',
      version: 1,
    }
  )
);
