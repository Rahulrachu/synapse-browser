import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface ResearchPage {
  id: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  addedAt: number;
}

export interface ResearchCollection {
  id: string;
  name: string;
  description: string;
  pages: ResearchPage[];
  createdAt: number;
  updatedAt: number;
}

class ResearchManager {
  private dataDir: string;
  private collectionsFile: string;
  private collections: Map<string, ResearchCollection> = new Map();

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.collectionsFile = path.join(this.dataDir, 'research_collections.json');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.loadCollections();
  }

  private loadCollections(): void {
    try {
      if (fs.existsSync(this.collectionsFile)) {
        const data = JSON.parse(fs.readFileSync(this.collectionsFile, 'utf-8'));
        data.forEach((collection: ResearchCollection) => {
          this.collections.set(collection.id, collection);
        });
      }
    } catch (error) {
      console.error('Failed to load research collections:', error);
    }
  }

  private saveCollections(): void {
    try {
      fs.writeFileSync(
        this.collectionsFile,
        JSON.stringify(Array.from(this.collections.values()), null, 2)
      );
    } catch (error) {
      console.error('Failed to save research collections:', error);
    }
  }

  getCollections(): ResearchCollection[] {
    return Array.from(this.collections.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  createCollection(collection: ResearchCollection): ResearchCollection {
    this.collections.set(collection.id, collection);
    this.saveCollections();
    return collection;
  }

  deleteCollection(id: string): boolean {
    if (this.collections.delete(id)) {
      this.saveCollections();
      return true;
    }
    return false;
  }

  addPageToCollection(collectionId: string, page: ResearchPage): boolean {
    const collection = this.collections.get(collectionId);
    if (collection) {
      collection.pages.push(page);
      collection.updatedAt = Date.now();
      this.saveCollections();
      return true;
    }
    return false;
  }

  removePageFromCollection(collectionId: string, pageId: string): boolean {
    const collection = this.collections.get(collectionId);
    if (collection) {
      collection.pages = collection.pages.filter((p) => p.id !== pageId);
      collection.updatedAt = Date.now();
      this.saveCollections();
      return true;
    }
    return false;
  }
}

export default new ResearchManager();
