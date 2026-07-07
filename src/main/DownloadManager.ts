import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

interface Download {
  id: string;
  filename: string;
  url: string;
  path: string;
  size: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
  endTime?: number;
}

/**
 * Manages file downloads within the application, tracking their progress and status.
 * It sets up a download directory and handles Electron's `will-download` event.
 */
class DownloadManager {
  private downloads: Map<string, Download> = new Map();
  private downloadDir: string;

  constructor() {
    this.downloadDir = path.join(app.getPath('downloads'), 'Synapse Browser');
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * Sets up the download handler for a given BrowserWindow.
   * This method listens for the `will-download` event and manages the download process.
   * @param window The `BrowserWindow` instance to attach the download handler to.
   */
  setupDownloadHandler(window: BrowserWindow) {
    window.webContents.session.on('will-download', (event, item, webContents) => {
      const filename = item.getFilename();
      const downloadPath = path.join(this.downloadDir, filename);

      const download: Download = {
        id: Date.now().toString(),
        filename,
        url: item.getURL(),
        path: downloadPath,
        size: item.getTotalBytes(),
        receivedBytes: 0,
        state: 'progressing',
        startTime: Date.now(),
      };

      this.downloads.set(download.id, download);

      // Set the save path
      item.setSavePath(downloadPath);

      // Track progress
      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          download.state = 'interrupted';
        } else if (state === 'progressing') {
          download.state = 'progressing';
          download.receivedBytes = item.getReceivedBytes();
        }
      });

      // Handle completion
      item.once('done', (event, state) => {
        if (state === 'completed') {
          download.state = 'completed';
          download.endTime = Date.now();
        } else if (state === 'cancelled') {
          download.state = 'cancelled';
          download.endTime = Date.now();
        } else if (state === 'interrupted') {
          download.state = 'interrupted';
          download.endTime = Date.now();
        }

        // Notify renderer
        webContents.send('download-updated', download);
      });

      // Notify renderer
      webContents.send('download-started', download);
    });
  }

  /**
   * Retrieves a list of all active and completed downloads.
   * @returns An array of `Download` objects.
   */
  getDownloads(): Download[] {
    return Array.from(this.downloads.values());
  }

  /**
   * Retrieves a specific download by its ID.
   * @param id The unique identifier of the download.
   * @returns The `Download` object if found, otherwise `undefined`.
   */
  getDownload(id: string): Download | undefined {
    return this.downloads.get(id);
  }

  /**
   * Clears all tracked downloads from the manager.
   */
  clearDownloads(): void {
    this.downloads.clear();
  }

  /**
   * Opens the designated downloads folder in the system's file manager.
   */
  openDownloadsFolder(): void {
    require('electron').shell.openPath(this.downloadDir);
  }
}

export default new DownloadManager();
