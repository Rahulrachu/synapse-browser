import path from 'path';
import { app } from 'electron';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export type MemoryType = 'short_term' | 'long_term' | 'workspace' | 'project' | 'conversation' | 'fact' | 'preference' | 'history';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  metadata: any;
  embedding?: number[];
  timestamp: number;
  tags: string[];
  isPinned: boolean;
  source: string;
  lastAccessed: number;
}

export interface MemorySearchOptions {
  query?: string;
  k?: number;
  type?: MemoryType;
  tags?: string[];
  isPinned?: boolean;
  dateRange?: { start: number; end: number };
}

export interface MemoryFilterOptions {
  type?: MemoryType;
  tags?: string[];
  isPinned?: boolean;
  dateRange?: { start: number; end: number };
}

export interface IMemoryManager {
  initialize(): Promise<void>;
  addMemory(entry: Partial<MemoryEntry>): Promise<MemoryEntry>;
  getMemory(id: string): Promise<MemoryEntry | null>;
  updateMemory(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null>;
  deleteMemory(id: string): Promise<boolean>;
  searchMemories(query: string, options?: MemorySearchOptions): Promise<MemoryEntry[]>;
  getMemoriesByType(type: MemoryType, options?: MemoryFilterOptions): Promise<MemoryEntry[]>;
  importMemories(json: string): Promise<void>;
  exportMemories(type?: MemoryType): Promise<string>;
}

class MemoryManager implements IMemoryManager {
  private db!: Database;
  private dbPath: string;

  constructor() {
    try {
      this.dbPath = path.join(app.getPath('userData'), 'memory.sqlite');
    } catch (e) {
      this.dbPath = './memory.sqlite';
    }
  }

  async initialize(): Promise<void> {
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
    });
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        embedding TEXT,
        timestamp INTEGER NOT NULL,
        tags TEXT,
        isPinned INTEGER NOT NULL DEFAULT 0,
        source TEXT,
        lastAccessed INTEGER NOT NULL
      );
    `);
  }

  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const { stdout } = await execPromise(`python3 ${process.cwd()}/generate_embedding.py "${text}"`);
      return JSON.parse(stdout.trim());
    } catch (error) {
      console.error("Embedding generation failed:", error);
      return null;
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async addMemory(entry: Partial<MemoryEntry>): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      id: entry.id || Date.now().toString(),
      type: entry.type || 'short_term',
      content: entry.content || '',
      metadata: entry.metadata || {},
      timestamp: entry.timestamp || Date.now(),
      tags: entry.tags || [],
      isPinned: entry.isPinned || false,
      source: entry.source || 'user_input',
      lastAccessed: entry.lastAccessed || Date.now(),
    };

    if (newEntry.content) {
      const embedding = await this.generateEmbedding(newEntry.content);
      if (embedding) newEntry.embedding = embedding;
    }

    await this.db.run(
      `INSERT INTO memories (id, type, content, metadata, embedding, timestamp, tags, isPinned, source, lastAccessed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      newEntry.id,
      newEntry.type,
      newEntry.content,
      JSON.stringify(newEntry.metadata),
      newEntry.embedding ? JSON.stringify(newEntry.embedding) : null,
      newEntry.timestamp,
      JSON.stringify(newEntry.tags),
      newEntry.isPinned ? 1 : 0,
      newEntry.source,
      newEntry.lastAccessed
    );
    return newEntry;
  }

  async getMemory(id: string): Promise<MemoryEntry | null> {
    const row = await this.db.get('SELECT * FROM memories WHERE id = ?', id);
    if (!row) return null;
    return {
      ...row,
      metadata: JSON.parse(row.metadata),
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      tags: JSON.parse(row.tags),
      isPinned: row.isPinned === 1,
    };
  }

  async updateMemory(id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
    const existingMemory = await this.getMemory(id);
    if (!existingMemory) return null;

    const updatedMemory = { ...existingMemory, ...updates };

    if (updates.content && updates.content !== existingMemory.content) {
      const embedding = await this.generateEmbedding(updates.content);
      if (embedding) updatedMemory.embedding = embedding;
    }

    await this.db.run(
      `UPDATE memories SET type = ?, content = ?, metadata = ?, embedding = ?, timestamp = ?, tags = ?, isPinned = ?, source = ?, lastAccessed = ? WHERE id = ?`,
      updatedMemory.type,
      updatedMemory.content,
      JSON.stringify(updatedMemory.metadata),
      updatedMemory.embedding ? JSON.stringify(updatedMemory.embedding) : null,
      updatedMemory.timestamp,
      JSON.stringify(updatedMemory.tags),
      updatedMemory.isPinned ? 1 : 0,
      updatedMemory.source,
      updatedMemory.lastAccessed,
      id
    );
    return updatedMemory;
  }

  async deleteMemory(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM memories WHERE id = ?', id);
    return result.changes === 1;
  }

  async searchMemories(query: string, options?: MemorySearchOptions): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    let memories: MemoryEntry[] = [];

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (options?.type) {
      whereClauses.push('type = ?');
      params.push(options.type);
    }
    if (options?.isPinned !== undefined) {
      whereClauses.push('isPinned = ?');
      params.push(options.isPinned ? 1 : 0);
    }
    if (options?.dateRange) {
      whereClauses.push('timestamp BETWEEN ? AND ?');
      params.push(options.dateRange.start, options.dateRange.end);
    }

    let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const rows = await this.db.all(`SELECT * FROM memories ${whereSql}`, params);
    memories = rows.map((row: any) => ({
      ...row,
      metadata: JSON.parse(row.metadata),
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      tags: JSON.parse(row.tags),
      isPinned: row.isPinned === 1,
    }));

    if (queryEmbedding) {
      const scoredMemories = memories.map(memory => {
        if (memory.embedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
          return { memory, similarity };
        } else {
          return { memory, similarity: 0 };
        }
      });

      scoredMemories.sort((a, b) => b.similarity - a.similarity);
      return scoredMemories.slice(0, options?.k || 5).map(item => item.memory);
    } else {
      const lowerQuery = query.toLowerCase();
      return memories.filter(m => 
        m.content.toLowerCase().includes(lowerQuery) || 
        JSON.stringify(m.metadata).toLowerCase().includes(lowerQuery) ||
        m.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ).slice(0, options?.k || 5);
    }
  }

  async getMemoriesByType(type: MemoryType, options?: MemoryFilterOptions): Promise<MemoryEntry[]> {
    let whereClauses: string[] = ['type = ?'];
    let params: any[] = [type];

    if (options?.isPinned !== undefined) {
      whereClauses.push('isPinned = ?');
      params.push(options.isPinned ? 1 : 0);
    }
    if (options?.dateRange) {
      whereClauses.push('timestamp BETWEEN ? AND ?');
      params.push(options.dateRange.start, options.dateRange.end);
    }

    let whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const rows = await this.db.all(`SELECT * FROM memories ${whereSql} ORDER BY timestamp DESC`, params);
    return rows.map((row: any) => ({
      ...row,
      metadata: JSON.parse(row.metadata),
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      tags: JSON.parse(row.tags),
      isPinned: row.isPinned === 1,
    }));
  }

  async importMemories(json: string): Promise<void> {
    const importedMemories: MemoryEntry[] = JSON.parse(json);
    for (const memory of importedMemories) {
      await this.addMemory(memory);
    }
  }

  async exportMemories(type?: MemoryType): Promise<string> {
    let memories: MemoryEntry[];
    if (type) {
      memories = await this.getMemoriesByType(type);
    } else {
      const rows = await this.db.all('SELECT * FROM memories');
      memories = rows.map((row: any) => ({
        ...row,
        metadata: JSON.parse(row.metadata),
        embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
        tags: JSON.parse(row.tags),
        isPinned: row.isPinned === 1,
      }));
    }
    return JSON.stringify(memories, null, 2);
  }
}

export default new MemoryManager();
