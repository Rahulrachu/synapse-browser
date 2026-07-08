export type DownloadStatus = 
  | 'queued' 
  | 'downloading' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'paused';

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  path: string;
  size: number;
  receivedBytes: number;
  status: DownloadStatus;
  startTime: number;
  endTime?: number;
  speed: number; // bytes per second
  remainingTime?: number; // seconds
}

export interface DownloadState {
  downloads: DownloadItem[];
  activeCount: number;
}
