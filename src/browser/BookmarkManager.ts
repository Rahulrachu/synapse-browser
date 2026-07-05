export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
  folder?: string;
}

export class BookmarkManager {
  private bookmarks: Map<string, Bookmark> = new Map();
  private folders: Set<string> = new Set();

  addBookmark(title: string, url: string, folder?: string): Bookmark {
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      title,
      url,
      createdAt: Date.now(),
      folder,
    };

    this.bookmarks.set(bookmark.id, bookmark);

    if (folder) {
      this.folders.add(folder);
    }

    return bookmark;
  }

  getBookmark(bookmarkId: string): Bookmark | undefined {
    return this.bookmarks.get(bookmarkId);
  }

  getAllBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values());
  }

  getBookmarksByFolder(folder: string): Bookmark[] {
    return Array.from(this.bookmarks.values()).filter(b => b.folder === folder);
  }

  updateBookmark(bookmarkId: string, updates: Partial<Bookmark>): void {
    const bookmark = this.bookmarks.get(bookmarkId);
    if (bookmark) {
      this.bookmarks.set(bookmarkId, { ...bookmark, ...updates });
    }
  }

  deleteBookmark(bookmarkId: string): void {
    this.bookmarks.delete(bookmarkId);
  }

  createFolder(folderName: string): void {
    this.folders.add(folderName);
  }

  getFolders(): string[] {
    return Array.from(this.folders);
  }

  deleteFolder(folderName: string): void {
    this.folders.delete(folderName);
    // Optionally move bookmarks to root or delete them
    this.bookmarks.forEach((bookmark) => {
      if (bookmark.folder === folderName) {
        bookmark.folder = undefined;
      }
    });
  }

  searchBookmarks(query: string): Bookmark[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.bookmarks.values()).filter(
      (b) =>
        b.title.toLowerCase().includes(lowerQuery) ||
        b.url.toLowerCase().includes(lowerQuery)
    );
  }

  exportBookmarks(): string {
    return JSON.stringify(Array.from(this.bookmarks.values()), null, 2);
  }

  importBookmarks(jsonString: string): void {
    try {
      const bookmarks = JSON.parse(jsonString) as Bookmark[];
      bookmarks.forEach((bookmark) => {
        this.bookmarks.set(bookmark.id, bookmark);
        if (bookmark.folder) {
          this.folders.add(bookmark.folder);
        }
      });
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
    }
  }
}

export default new BookmarkManager();
