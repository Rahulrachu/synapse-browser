import path from 'node:path';
import fs from 'node:fs';
import { app, DownloadItem, Session, shell } from 'electron';
import { randomUUID } from 'node:crypto';
import { getMainWindow } from './BrowserWindow.js';

export interface DownloadRecord {
  id: string;
  url: string;
  filename: string;
  path: string;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  receivedBytes: number;
  totalBytes: number;
  startedAt: number;
  endedAt?: number;
  tabId?: string;
}

class DownloadManager {
  private readonly file: string;
  private readonly registeredSessions = new WeakSet<Session>();
  private readonly items = new Map<string, DownloadItem>();

  constructor() {
    const dir = path.join(app.getPath('userData'), 'data');
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, 'downloads.json');
    if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, '[]');
  }

  private read(): DownloadRecord[] {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8')) as DownloadRecord[];
    } catch {
      return [];
    }
  }

  private write(records: DownloadRecord[]): void {
    fs.writeFileSync(this.file, JSON.stringify(records.slice(-200), null, 2));
  }

  registerSession(ses: Session, tabId: string): void {
    if (this.registeredSessions.has(ses)) return;
    this.registeredSessions.add(ses);
    ses.on('will-download', (_event, item) => this.handleDownload(item, tabId));
  }

  private handleDownload(item: DownloadItem, tabId: string): void {
    const id = randomUUID();
    const record: DownloadRecord = {
      id,
      url: item.getURL(),
      filename: item.getFilename(),
      path: item.getSavePath(),
      state: 'progressing',
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      startedAt: Date.now(),
      tabId,
    };
    this.items.set(id, item);
    item.once('done', (_event, state) => {
      record.state = state === 'completed' ? 'completed' : state === 'cancelled' ? 'cancelled' : 'interrupted';
      record.path = item.getSavePath();
      record.endedAt = Date.now();
      this.items.delete(id);
      this.upsert(record);
      this.broadcast('download-updated', record);
    });
    item.on('updated', () => {
      record.receivedBytes = item.getReceivedBytes();
      record.totalBytes = item.getTotalBytes();
      record.path = item.getSavePath();
      this.upsert(record);
      this.broadcast('download-updated', record);
    });
    this.upsert(record);
    this.broadcast('download-started', record);
  }

  private upsert(record: DownloadRecord): void {
    const records = this.read();
    const index = records.findIndex((item) => item.id === record.id);
    if (index >= 0) records[index] = record;
    else records.push(record);
    this.write(records);
  }

  private broadcast(channel: string, payload: DownloadRecord): void {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
  }

  getDownloads(): DownloadRecord[] {
    return this.read().sort((a, b) => b.startedAt - a.startedAt);
  }

  pause(id: string): boolean {
    const item = this.items.get(id);
    if (!item || !item.canResume()) return false;
    item.pause();
    return true;
  }

  resume(id: string): boolean {
    const item = this.items.get(id);
    if (!item || !item.canResume()) return false;
    item.resume();
    return true;
  }

  cancel(id: string): boolean {
    const item = this.items.get(id);
    if (!item) return false;
    item.cancel();
    return true;
  }

  open(id: string): Promise<void> {
    const record = this.read().find((item) => item.id === id);
    return record ? shell.openPath(record.path).then(() => undefined) : Promise.resolve();
  }

  showInFolder(id: string): void {
    const record = this.read().find((item) => item.id === id);
    if (record) shell.showItemInFolder(record.path);
  }

  remove(id: string): boolean {
    const records = this.read();
    const remaining = records.filter((record) => record.id !== id);
    if (records.length === remaining.length) return false;
    this.write(remaining);
    return true;
  }
}

export default new DownloadManager();
