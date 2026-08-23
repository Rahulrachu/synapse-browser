import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface MemoryEntry {
  id: string;
  type: 'fact' | 'preference' | 'history' | 'project';
  content: string;
  metadata: any;
  embedding?: number[]; // Optional: vector embedding for semantic search
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

  async addMemory(type: MemoryEntry['type'], content: string, metadata: any = {}) {
    const entry: MemoryEntry = {
      id: Date.now().toString(),
      type,
      content,
      metadata,
      timestamp: Date.now(),
    };

    try {
      const { stdout } = await execPromise(`python3 ${process.cwd()}/generate_embedding.py "${content}"`);
      entry.embedding = JSON.parse(stdout.trim());
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      // Continue without embedding if generation fails
    }

    this.memories.push(entry);
    this.saveMemories();
    return entry;
  }

  async searchMemories(query: string, k: number = 5): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query); // Asynchronously generate embedding for the query

    if (queryEmbedding) {
      const scoredMemories = this.memories.map(memory => {
        if (memory.embedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
          return { memory, similarity };
        } else {
          return { memory, similarity: 0 }; // Memories without embeddings get 0 similarity
        }
      });

      scoredMemories.sort((a, b) => b.similarity - a.similarity);
      return scoredMemories.slice(0, k).map(item => item.memory);
    } else {
      // Fallback to keyword search if embedding generation fails or is not used
      const lowerQuery = query.toLowerCase();
      return this.memories.filter(m => 
        m.content.toLowerCase().includes(lowerQuery) || 
        JSON.stringify(m.metadata).toLowerCase().includes(lowerQuery)
      );
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const { stdout } = await execPromise(`python3 ${process.cwd()}/generate_embedding.py \"${text}\"`);
      return JSON.parse(stdout.trim());
    } catch (error) {
      console.error("Embedding generation failed:", error);
      return null;
    }
  }

  getRecentMemories(limit: number = 10): MemoryEntry[] {
    return [...this.memories].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
}

export default new MemorySystem();
