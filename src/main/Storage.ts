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

/**
 * Manages persistent storage for user data such as bookmarks and browsing history.
 * Data is stored in JSON files within the application's user data directory.
 */
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
  /**
   * Retrieves all saved bookmarks.
   * @returns An array of `Bookmark` objects.
   */
  getBookmarks(): Bookmark[] {
    try {
      const data = fs.readFileSync(this.bookmarksFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read bookmarks:', error);
      return [];
    }
  }

  /**
   * Adds a new bookmark.
   * @param title The title of the bookmark.
   * @param url The URL of the bookmark.
   * @returns The newly created `Bookmark` object.
   */
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

  /**
   * Removes a bookmark by its ID.
   * @param id The unique identifier of the bookmark to remove.
   * @returns `true` if the bookmark was removed successfully, `false` otherwise.
   */
  removeBookmark(id: string): boolean {
    const bookmarks = this.getBookmarks();
    const filtered = bookmarks.filter((b) => b.id !== id);
    if (filtered.length < bookmarks.length) {
      this.saveBookmarks(filtered);
      return true;
    }
    return false;
  }

  /**
   * Persists the current list of bookmarks to the bookmarks JSON file.
   * This method is called internally after any modification to the bookmarks.
   * @param bookmarks The array of `Bookmark` objects to save.
   */
  private saveBookmarks(bookmarks: Bookmark[]): void {
    try {
      fs.writeFileSync(this.bookmarksFile, JSON.stringify(bookmarks, null, 2));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  // History
  /**
   * Retrieves a limited number of recent browsing history entries.
   * @param limit The maximum number of history entries to retrieve. Defaults to 100.
   * @returns An array of `HistoryEntry` objects, sorted by `visitedAt` in descending order.
   */
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

  /**
   * Adds a new entry to the browsing history or updates an existing one.
   * If an entry with the same URL exists, its `visitedAt` timestamp and `visitCount` are updated.
   * @param url The URL of the visited page.
   * @param title The title of the visited page.
   * @returns The `HistoryEntry` object that was added or updated.
   */
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

  /**
   * Clears all browsing history entries.
   */
  clearHistory(): void {
    this.saveHistory([]);
  }

  /**
   * Retrieves all browsing history entries without any limit or sorting.
   * @returns An array of `HistoryEntry` objects.
   */
  private getAllHistory(): HistoryEntry[] {
    try {
      const data = fs.readFileSync(this.historyFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  /**
   * Persists the current list of history entries to the history JSON file.
   * This method is called internally after any modification to the history.
   * @param history The array of `HistoryEntry` objects to save.
   */
  private saveHistory(history: HistoryEntry[]): void {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  // Generic KV Storage for Plugins/Framework
  private getSettingsFile(): string {
    return path.join(this.dataDir, 'settings.json');
  }

  private getAllSettings(): Record<string, any> {
    const file = this.getSettingsFile();
    if (!fs.existsSync(file)) return {};
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      return {};
    }
  }

  async get(key: string): Promise<any> {
    const settings = this.getAllSettings();
    return settings[key];
  }

  async set(key: string, value: any): Promise<void> {
    const settings = this.getAllSettings();
    settings[key] = value;
    try {
      fs.writeFileSync(this.getSettingsFile(), JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
}

export default new Storage();
