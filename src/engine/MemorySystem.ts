import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface MemoryEntry {
  id: string;
  type: 'fact' | 'preference' | 'history' | 'project';
  content: string;
  metadata: any;
  timestamp: number;
}

class MemorySystem {
  private memoryPath: string;
  private memories: MemoryEntry[] = [];

  constructor() {
    // Note: app.getPath might fail if not in Electron environment, 
    // but this is main process code
    try {
      this.memoryPath = path.join(app.getPath('userData'), 'memory.json');
      this.loadMemories();
    } catch (e) {
      this.memoryPath = './memory.json';
    }
  }

  private loadMemories() {
    if (fs.existsSync(this.memoryPath)) {
      try {
        this.memories = JSON.parse(fs.readFileSync(this.memoryPath, 'utf-8'));
      } catch (e) {
        this.memories = [];
      }
    }
  }

  private saveMemories() {
    try {
      fs.writeFileSync(this.memoryPath, JSON.stringify(this.memories, null, 2));
    } catch (e) {
      console.error('Failed to save memories', e);
    }
  }

  addMemory(type: MemoryEntry['type'], content: string, metadata: any = {}) {
    const entry: MemoryEntry = {
      id: Date.now().toString(),
      type,
      content,
      metadata,
      timestamp: Date.now(),
    };
    this.memories.push(entry);
    this.saveMemories();
    return entry;
  }

  searchMemories(query: string): MemoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.memories.filter(m => 
      m.content.toLowerCase().includes(lowerQuery) || 
      JSON.stringify(m.metadata).toLowerCase().includes(lowerQuery)
    );
  }

  getRecentMemories(limit: number = 10): MemoryEntry[] {
    return [...this.memories].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
}

export default new MemorySystem();
