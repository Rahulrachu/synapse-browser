import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { app } from 'electron';

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId: string | null;
  profileId: string;
  createdAt: number;
  order: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  folderId: string | null;
  profileId: string;
  createdAt: number;
  updatedAt: number;
  order: number;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  profileId: string;
  visitedAt: number;
  visitCount: number;
}

class Storage {
  private readonly dataDir: string;
  private readonly bookmarksFile: string;
  private readonly historyFile: string;
  private readonly bookmarkFoldersFile: string;

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.bookmarksFile = path.join(this.dataDir, 'bookmarks.json');
    this.historyFile = path.join(this.dataDir, 'history.json');
    this.bookmarkFoldersFile = path.join(this.dataDir, 'bookmark-folders.json');
    fs.mkdirSync(this.dataDir, { recursive: true });
    this.ensureJsonFile(this.bookmarksFile, []);
    this.ensureJsonFile(this.historyFile, []);
    this.ensureJsonFile(this.bookmarkFoldersFile, []);
    this.ensureJsonFile(path.join(this.dataDir, 'notes.json'), []);
    this.ensureJsonFile(path.join(this.dataDir, 'prompts.json'), []);
  }

  private ensureJsonFile(file: string, initialValue: unknown): void {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(initialValue, null, 2));
  }

  private readJson<T>(file: string, fallback: T): T {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
    } catch {
      return fallback;
    }
  }

  private writeJson(file: string, value: unknown): void {
    fs.writeFileSync(file, JSON.stringify(value, null, 2));
  }

  getNotes(): any[] {
    return this.readJson<any[]>(path.join(this.dataDir, 'notes.json'), []);
  }

  saveNote(note: any): void {
    const notes = this.getNotes();
    const index = notes.findIndex((item) => item.id === note.id);
    if (index >= 0) notes[index] = note;
    else notes.push(note);
    this.writeJson(path.join(this.dataDir, 'notes.json'), notes);
  }

  deleteNote(id: string): void {
    this.writeJson(path.join(this.dataDir, 'notes.json'), this.getNotes().filter((item) => item.id !== id));
  }

  getPrompts(): any[] {
    return this.readJson<any[]>(path.join(this.dataDir, 'prompts.json'), []);
  }

  savePrompt(prompt: any): void {
    const prompts = this.getPrompts();
    const index = prompts.findIndex((item) => item.id === prompt.id);
    if (index >= 0) prompts[index] = prompt;
    else prompts.push(prompt);
    this.writeJson(path.join(this.dataDir, 'prompts.json'), prompts);
  }

  deletePrompt(id: string): void {
    this.writeJson(path.join(this.dataDir, 'prompts.json'), this.getPrompts().filter((item) => item.id !== id));
  }

  getBookmarkFolders(profileId = 'default'): BookmarkFolder[] {
    return this.readJson<BookmarkFolder[]>(this.bookmarkFoldersFile, [])
      .filter((folder) => folder.profileId === profileId)
      .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  }

  createBookmarkFolder(name: string, parentId: string | null = null, profileId = 'default'): BookmarkFolder {
    const folders = this.readJson<BookmarkFolder[]>(this.bookmarkFoldersFile, []);
    const siblings = folders.filter((folder) => folder.profileId === profileId && folder.parentId === parentId);
    const folder: BookmarkFolder = {
      id: randomUUID(),
      name: name.trim() || 'New folder',
      parentId,
      profileId,
      createdAt: Date.now(),
      order: siblings.length,
    };
    folders.push(folder);
    this.writeJson(this.bookmarkFoldersFile, folders);
    return folder;
  }

  updateBookmarkFolder(id: string, name: string, parentId?: string | null): BookmarkFolder | null {
    const folders = this.readJson<BookmarkFolder[]>(this.bookmarkFoldersFile, []);
    const folder = folders.find((item) => item.id === id);
    if (!folder) return null;
    folder.name = name.trim() || folder.name;
    if (parentId !== undefined && parentId !== id) folder.parentId = parentId;
    this.writeJson(this.bookmarkFoldersFile, folders);
    return folder;
  }

  deleteBookmarkFolder(id: string): boolean {
    const folders = this.readJson<BookmarkFolder[]>(this.bookmarkFoldersFile, []);
    if (!folders.some((folder) => folder.id === id)) return false;
    const descendants = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const folder of folders) {
        if (folder.parentId && descendants.has(folder.parentId) && !descendants.has(folder.id)) {
          descendants.add(folder.id);
          changed = true;
        }
      }
    }
    this.writeJson(this.bookmarkFoldersFile, folders.filter((folder) => !descendants.has(folder.id)));
    const bookmarks = this.readJson<Bookmark[]>(this.bookmarksFile, []);
    this.writeJson(this.bookmarksFile, bookmarks.map((bookmark) => descendants.has(bookmark.folderId || '') ? { ...bookmark, folderId: null } : bookmark));
    return true;
  }

  getBookmarks(profileId = 'default', query = ''): Bookmark[] {
    const normalized = query.trim().toLowerCase();
    return this.readJson<Bookmark[]>(this.bookmarksFile, [])
      .filter((bookmark) => bookmark.profileId === profileId)
      .filter((bookmark) => !normalized || `${bookmark.title} ${bookmark.url}`.toLowerCase().includes(normalized))
      .sort((a, b) => a.order - b.order || b.updatedAt - a.updatedAt);
  }

  addBookmark(title: string, url: string, folderId: string | null = null, profileId = 'default', favicon?: string): Bookmark {
    const bookmarks = this.readJson<Bookmark[]>(this.bookmarksFile, []);
    const existing = bookmarks.find((bookmark) => bookmark.url === url && bookmark.profileId === profileId);
    if (existing) {
      existing.title = title || existing.title;
      existing.favicon = favicon || existing.favicon;
      existing.folderId = folderId;
      existing.updatedAt = Date.now();
      this.writeJson(this.bookmarksFile, bookmarks);
      return existing;
    }
    const siblings = bookmarks.filter((bookmark) => bookmark.profileId === profileId && bookmark.folderId === folderId);
    const bookmark: Bookmark = {
      id: randomUUID(),
      title: title || url,
      url,
      favicon,
      folderId,
      profileId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: siblings.length,
    };
    bookmarks.push(bookmark);
    this.writeJson(this.bookmarksFile, bookmarks);
    return bookmark;
  }

  updateBookmark(id: string, patch: Partial<Pick<Bookmark, 'title' | 'url' | 'folderId' | 'favicon' | 'order'>>): Bookmark | null {
    const bookmarks = this.readJson<Bookmark[]>(this.bookmarksFile, []);
    const bookmark = bookmarks.find((item) => item.id === id);
    if (!bookmark) return null;
    Object.assign(bookmark, patch, { updatedAt: Date.now() });
    this.writeJson(this.bookmarksFile, bookmarks);
    return bookmark;
  }

  removeBookmark(id: string): boolean {
    const bookmarks = this.readJson<Bookmark[]>(this.bookmarksFile, []);
    const remaining = bookmarks.filter((bookmark) => bookmark.id !== id);
    if (remaining.length === bookmarks.length) return false;
    this.writeJson(this.bookmarksFile, remaining);
    return true;
  }

  getHistory(limit = 100, profileId = 'default', query = ''): HistoryEntry[] {
    const normalized = query.trim().toLowerCase();
    return this.readJson<HistoryEntry[]>(this.historyFile, [])
      .filter((entry) => entry.profileId === profileId)
      .filter((entry) => !normalized || `${entry.title} ${entry.url}`.toLowerCase().includes(normalized))
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, limit);
  }

  addToHistory(url: string, title: string, profileId = 'default', favicon?: string): HistoryEntry {
    const history = this.readJson<HistoryEntry[]>(this.historyFile, []);
    const existing = history.find((entry) => entry.url === url && entry.profileId === profileId);
    if (existing) {
      existing.visitedAt = Date.now();
      existing.visitCount += 1;
      existing.title = title || existing.title;
      existing.favicon = favicon || existing.favicon;
      this.writeJson(this.historyFile, history);
      return existing;
    }
    const entry: HistoryEntry = {
      id: randomUUID(),
      url,
      title: title || url,
      favicon,
      profileId,
      visitedAt: Date.now(),
      visitCount: 1,
    };
    history.push(entry);
    this.writeJson(this.historyFile, history);
    return entry;
  }

  deleteHistoryEntry(id: string, profileId = 'default'): boolean {
    const history = this.readJson<HistoryEntry[]>(this.historyFile, []);
    const remaining = history.filter((entry) => !(entry.id === id && entry.profileId === profileId));
    if (remaining.length === history.length) return false;
    this.writeJson(this.historyFile, remaining);
    return true;
  }

  clearHistory(profileId = 'default', since?: number): void {
    const history = this.readJson<HistoryEntry[]>(this.historyFile, []);
    const remaining = history.filter((entry) => {
      if (entry.profileId !== profileId) return true;
      return since !== undefined && entry.visitedAt < since;
    });
    this.writeJson(this.historyFile, remaining);
  }

  async get(key: string): Promise<any> {
    return this.readJson<Record<string, any>>(path.join(this.dataDir, 'settings.json'), {})[key];
  }

  async set(key: string, value: any): Promise<void> {
    const file = path.join(this.dataDir, 'settings.json');
    const settings = this.readJson<Record<string, any>>(file, {});
    settings[key] = value;
    this.writeJson(file, settings);
  }
}

export default new Storage();
