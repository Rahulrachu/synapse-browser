import path from 'path';
import { app } from 'electron';
import fs from 'fs';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
  visitCount: number;
}

class Storage {
  private dataDir: string;
  private bookmarksFile: string;
  private historyFile: string;

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.bookmarksFile = path.join(this.dataDir, 'bookmarks.json');
    this.historyFile = path.join(this.dataDir, 'history.json');

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Initialize files if they don't exist
    if (!fs.existsSync(this.bookmarksFile)) {
      fs.writeFileSync(this.bookmarksFile, JSON.stringify([]));
    }
    if (!fs.existsSync(this.historyFile)) {
      fs.writeFileSync(this.historyFile, JSON.stringify([]));
    }
  }

  // Bookmarks
  getBookmarks(): Bookmark[] {
    try {
      const data = fs.readFileSync(this.bookmarksFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read bookmarks:', error);
      return [];
    }
  }

  addBookmark(title: string, url: string): Bookmark {
    const bookmarks = this.getBookmarks();
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      title,
      url,
      createdAt: Date.now(),
    };
    bookmarks.push(bookmark);
    this.saveBookmarks(bookmarks);
    return bookmark;
  }

  removeBookmark(id: string): boolean {
    const bookmarks = this.getBookmarks();
    const filtered = bookmarks.filter((b) => b.id !== id);
    if (filtered.length < bookmarks.length) {
      this.saveBookmarks(filtered);
      return true;
    }
    return false;
  }

  private saveBookmarks(bookmarks: Bookmark[]): void {
    try {
      fs.writeFileSync(this.bookmarksFile, JSON.stringify(bookmarks, null, 2));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  // History
  getHistory(limit: number = 100): HistoryEntry[] {
    try {
      const data = fs.readFileSync(this.historyFile, 'utf-8');
      const history: HistoryEntry[] = JSON.parse(data);
      return history.sort((a, b) => b.visitedAt - a.visitedAt).slice(0, limit);
    } catch (error) {
      console.error('Failed to read history:', error);
      return [];
    }
  }

  addToHistory(url: string, title: string): HistoryEntry {
    const history = this.getAllHistory();
    const existing = history.find((h) => h.url === url);

    if (existing) {
      existing.visitedAt = Date.now();
      existing.visitCount += 1;
      existing.title = title;
    } else {
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        url,
        title,
        visitedAt: Date.now(),
        visitCount: 1,
      };
      history.push(entry);
    }

    this.saveHistory(history);
    return existing || history[history.length - 1];
  }

  clearHistory(): void {
    this.saveHistory([]);
  }

  private getAllHistory(): HistoryEntry[] {
    try {
      const data = fs.readFileSync(this.historyFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private saveHistory(history: HistoryEntry[]): void {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }
}

export default new Storage();
