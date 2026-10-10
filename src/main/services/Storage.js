import * as electron from "electron";
import * as path from "path";
import * as fs from "fs";
import * as nodeCrypto from "crypto";

class Storage {
  dataDir;
  bookmarksFile;
  historyFile;
  bookmarkFoldersFile;
  constructor() {
    this.dataDir = path.join(electron.app.getPath("userData"), "data");
    this.bookmarksFile = path.join(this.dataDir, "bookmarks.json");
    this.historyFile = path.join(this.dataDir, "history.json");
    this.bookmarkFoldersFile = path.join(this.dataDir, "bookmark-folders.json");
    fs.mkdirSync(this.dataDir, { recursive: true });
    this.ensureJsonFile(this.bookmarksFile, []);
    this.ensureJsonFile(this.historyFile, []);
    this.ensureJsonFile(this.bookmarkFoldersFile, []);
    this.ensureJsonFile(path.join(this.dataDir, "notes.json"), []);
    this.ensureJsonFile(path.join(this.dataDir, "prompts.json"), []);
  }
  ensureJsonFile(file, initialValue) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(initialValue, null, 2));
  }
  readJson(file, fallback) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return fallback;
    }
  }
  writeJson(file, value) {
    fs.writeFileSync(file, JSON.stringify(value, null, 2));
  }
  getNotes() {
    return this.readJson(path.join(this.dataDir, "notes.json"), []);
  }
  saveNote(note) {
    const notes = this.getNotes();
    const index = notes.findIndex((item) => item.id === note.id);
    if (index >= 0) notes[index] = note;
    else notes.push(note);
    this.writeJson(path.join(this.dataDir, "notes.json"), notes);
  }
  deleteNote(id) {
    this.writeJson(
      path.join(this.dataDir, "notes.json"),
      this.getNotes().filter((item) => item.id !== id),
    );
  }
  getPrompts() {
    return this.readJson(path.join(this.dataDir, "prompts.json"), []);
  }
  savePrompt(prompt) {
    const prompts = this.getPrompts();
    const index = prompts.findIndex((item) => item.id === prompt.id);
    if (index >= 0) prompts[index] = prompt;
    else prompts.push(prompt);
    this.writeJson(path.join(this.dataDir, "prompts.json"), prompts);
  }
  deletePrompt(id) {
    this.writeJson(
      path.join(this.dataDir, "prompts.json"),
      this.getPrompts().filter((item) => item.id !== id),
    );
  }
  getBookmarkFolders(profileId = "default") {
    return this.readJson(this.bookmarkFoldersFile, [])
      .filter((folder) => folder.profileId === profileId)
      .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  }
  createBookmarkFolder(name, parentId = null, profileId = "default") {
    const folders = this.readJson(this.bookmarkFoldersFile, []);
    const siblings = folders.filter(
      (folder2) => folder2.profileId === profileId && folder2.parentId === parentId,
    );
    const folder = {
      id: nodeCrypto.randomUUID(),
      name: name.trim() || "New folder",
      parentId,
      profileId,
      createdAt: Date.now(),
      order: siblings.length,
    };
    folders.push(folder);
    this.writeJson(this.bookmarkFoldersFile, folders);
    return folder;
  }
  updateBookmarkFolder(id, name, parentId) {
    const folders = this.readJson(this.bookmarkFoldersFile, []);
    const folder = folders.find((item) => item.id === id);
    if (!folder) return null;
    folder.name = name.trim() || folder.name;
    if (parentId !== void 0 && parentId !== id) folder.parentId = parentId;
    this.writeJson(this.bookmarkFoldersFile, folders);
    return folder;
  }
  deleteBookmarkFolder(id) {
    const folders = this.readJson(this.bookmarkFoldersFile, []);
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
    this.writeJson(
      this.bookmarkFoldersFile,
      folders.filter((folder) => !descendants.has(folder.id)),
    );
    const bookmarks = this.readJson(this.bookmarksFile, []);
    this.writeJson(
      this.bookmarksFile,
      bookmarks.map((bookmark) =>
        descendants.has(bookmark.folderId || "") ? { ...bookmark, folderId: null } : bookmark,
      ),
    );
    return true;
  }
  getBookmarks(profileId = "default", query = "") {
    const normalized = query.trim().toLowerCase();
    return this.readJson(this.bookmarksFile, [])
      .filter((bookmark) => bookmark.profileId === profileId)
      .filter(
        (bookmark) => !normalized || `${bookmark.title} ${bookmark.url}`.toLowerCase().includes(normalized),
      )
      .sort((a, b) => a.order - b.order || b.updatedAt - a.updatedAt);
  }
  addBookmark(title, url, folderId = null, profileId = "default", favicon) {
    const bookmarks = this.readJson(this.bookmarksFile, []);
    const existing = bookmarks.find(
      (bookmark2) => bookmark2.url === url && bookmark2.profileId === profileId,
    );
    if (existing) {
      existing.title = title || existing.title;
      existing.favicon = favicon || existing.favicon;
      existing.folderId = folderId;
      existing.updatedAt = Date.now();
      this.writeJson(this.bookmarksFile, bookmarks);
      return existing;
    }
    const siblings = bookmarks.filter(
      (bookmark2) => bookmark2.profileId === profileId && bookmark2.folderId === folderId,
    );
    const bookmark = {
      id: nodeCrypto.randomUUID(),
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
  updateBookmark(id, patch) {
    const bookmarks = this.readJson(this.bookmarksFile, []);
    const bookmark = bookmarks.find((item) => item.id === id);
    if (!bookmark) return null;
    Object.assign(bookmark, patch, { updatedAt: Date.now() });
    this.writeJson(this.bookmarksFile, bookmarks);
    return bookmark;
  }
  removeBookmark(id) {
    const bookmarks = this.readJson(this.bookmarksFile, []);
    const remaining = bookmarks.filter((bookmark) => bookmark.id !== id);
    if (remaining.length === bookmarks.length) return false;
    this.writeJson(this.bookmarksFile, remaining);
    return true;
  }
  getHistory(limit = 100, profileId = "default", query = "") {
    const normalized = query.trim().toLowerCase();
    return this.readJson(this.historyFile, [])
      .filter((entry) => entry.profileId === profileId)
      .filter((entry) => !normalized || `${entry.title} ${entry.url}`.toLowerCase().includes(normalized))
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, limit);
  }
  addToHistory(url, title, profileId = "default", favicon) {
    const history = this.readJson(this.historyFile, []);
    const existing = history.find((entry2) => entry2.url === url && entry2.profileId === profileId);
    if (existing) {
      existing.visitedAt = Date.now();
      existing.visitCount += 1;
      existing.title = title || existing.title;
      existing.favicon = favicon || existing.favicon;
      this.writeJson(this.historyFile, history);
      return existing;
    }
    const entry = {
      id: nodeCrypto.randomUUID(),
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
  deleteHistoryEntry(id, profileId = "default") {
    const history = this.readJson(this.historyFile, []);
    const remaining = history.filter((entry) => !(entry.id === id && entry.profileId === profileId));
    if (remaining.length === history.length) return false;
    this.writeJson(this.historyFile, remaining);
    return true;
  }
  clearHistory(profileId = "default", since) {
    const history = this.readJson(this.historyFile, []);
    const remaining = history.filter((entry) => {
      if (entry.profileId !== profileId) return true;
      return since !== void 0 && entry.visitedAt < since;
    });
    this.writeJson(this.historyFile, remaining);
  }
  async get(key) {
    return this.readJson(path.join(this.dataDir, "settings.json"), {})[key];
  }
  async set(key, value) {
    const file = path.join(this.dataDir, "settings.json");
    const settings = this.readJson(file, {});
    settings[key] = value;
    this.writeJson(file, settings);
  }
}
export const storage = new Storage();
