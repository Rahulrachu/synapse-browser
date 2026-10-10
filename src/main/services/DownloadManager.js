import * as electron from "electron";
import * as path from "path";
import * as fs from "fs";
import * as nodeCrypto from "crypto";
import { getMainWindow } from "../window";

class DownloadManager {
  file;
  registeredSessions = new WeakSet();
  items = new Map();
  constructor() {
    const dir = path.join(electron.app.getPath("userData"), "data");
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "downloads.json");
    if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, "[]");
  }
  read() {
    try {
      return JSON.parse(fs.readFileSync(this.file, "utf8"));
    } catch {
      return [];
    }
  }
  write(records) {
    fs.writeFileSync(this.file, JSON.stringify(records.slice(-200), null, 2));
  }
  registerSession(ses, tabId) {
    if (this.registeredSessions.has(ses)) return;
    this.registeredSessions.add(ses);
    ses.on("will-download", (_event, item) => this.handleDownload(item, tabId));
  }
  handleDownload(item, tabId) {
    const id = nodeCrypto.randomUUID();
    const record = {
      id,
      url: item.getURL(),
      filename: item.getFilename(),
      path: item.getSavePath(),
      state: "progressing",
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      startedAt: Date.now(),
      tabId,
    };
    this.items.set(id, item);
    item.once("done", (_event, state) => {
      record.state =
        state === "completed" ? "completed" : state === "cancelled" ? "cancelled" : "interrupted";
      record.path = item.getSavePath();
      record.endedAt = Date.now();
      this.items.delete(id);
      this.upsert(record);
      this.broadcast("download-updated", record);
    });
    item.on("updated", () => {
      record.receivedBytes = item.getReceivedBytes();
      record.totalBytes = item.getTotalBytes();
      record.path = item.getSavePath();
      this.upsert(record);
      this.broadcast("download-updated", record);
    });
    this.upsert(record);
    this.broadcast("download-started", record);
  }
  upsert(record) {
    const records = this.read();
    const index = records.findIndex((item) => item.id === record.id);
    if (index >= 0) records[index] = record;
    else records.push(record);
    this.write(records);
  }
  broadcast(channel, payload) {
    const mainWindow2 = getMainWindow();
    if (mainWindow2 && !mainWindow2.isDestroyed()) mainWindow2.webContents.send(channel, payload);
  }
  getDownloads() {
    return this.read().sort((a, b) => b.startedAt - a.startedAt);
  }
  pause(id) {
    const item = this.items.get(id);
    if (!item || !item.canResume()) return false;
    item.pause();
    return true;
  }
  resume(id) {
    const item = this.items.get(id);
    if (!item || !item.canResume()) return false;
    item.resume();
    return true;
  }
  cancel(id) {
    const item = this.items.get(id);
    if (!item) return false;
    item.cancel();
    return true;
  }
  open(id) {
    const record = this.read().find((item) => item.id === id);
    return record ? electron.shell.openPath(record.path).then(() => void 0) : Promise.resolve();
  }
  showInFolder(id) {
    const record = this.read().find((item) => item.id === id);
    if (record) electron.shell.showItemInFolder(record.path);
  }
  remove(id) {
    const records = this.read();
    const remaining = records.filter((record) => record.id !== id);
    if (records.length === remaining.length) return false;
    this.write(remaining);
    return true;
  }
}
export const downloadManager = new DownloadManager();
