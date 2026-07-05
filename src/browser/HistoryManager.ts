export interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
  visitCount: number;
}

export class HistoryManager {
  private history: Map<string, HistoryEntry> = new Map();
  private urlIndex: Map<string, string> = new Map(); // url -> id mapping for quick lookup

  addEntry(title: string, url: string): HistoryEntry {
    const existingId = this.urlIndex.get(url);

    if (existingId) {
      const existing = this.history.get(existingId)!;
      existing.visitedAt = Date.now();
      existing.visitCount++;
      return existing;
    }

    const entry: HistoryEntry = {
      id: Date.now().toString(),
      title,
      url,
      visitedAt: Date.now(),
      visitCount: 1,
    };

    this.history.set(entry.id, entry);
    this.urlIndex.set(url, entry.id);

    return entry;
  }

  getEntry(entryId: string): HistoryEntry | undefined {
    return this.history.get(entryId);
  }

  getAllHistory(): HistoryEntry[] {
    return Array.from(this.history.values()).sort((a, b) => b.visitedAt - a.visitedAt);
  }

  getRecentHistory(limit: number = 50): HistoryEntry[] {
    return this.getAllHistory().slice(0, limit);
  }

  getHistoryByDate(date: Date): HistoryEntry[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.history.values()).filter(
      (entry) => entry.visitedAt >= startOfDay.getTime() && entry.visitedAt <= endOfDay.getTime()
    );
  }

  searchHistory(query: string): HistoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.history.values()).filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.url.toLowerCase().includes(lowerQuery)
    );
  }

  deleteEntry(entryId: string): void {
    const entry = this.history.get(entryId);
    if (entry) {
      this.history.delete(entryId);
      this.urlIndex.delete(entry.url);
    }
  }

  clearHistory(): void {
    this.history.clear();
    this.urlIndex.clear();
  }

  deleteHistoryBefore(date: Date): void {
    const timestamp = date.getTime();
    const toDelete: string[] = [];

    this.history.forEach((entry, id) => {
      if (entry.visitedAt < timestamp) {
        toDelete.push(id);
      }
    });

    toDelete.forEach((id) => {
      const entry = this.history.get(id);
      if (entry) {
        this.urlIndex.delete(entry.url);
      }
      this.history.delete(id);
    });
  }

  getMostVisited(limit: number = 10): HistoryEntry[] {
    return Array.from(this.history.values())
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }

  exportHistory(): string {
    return JSON.stringify(Array.from(this.history.values()), null, 2);
  }

  importHistory(jsonString: string): void {
    try {
      const entries = JSON.parse(jsonString) as HistoryEntry[];
      entries.forEach((entry) => {
        this.history.set(entry.id, entry);
        this.urlIndex.set(entry.url, entry.id);
      });
    } catch (error) {
      console.error('Failed to import history:', error);
    }
  }
}

export default new HistoryManager();
