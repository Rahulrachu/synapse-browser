
import path from 'path';
import { app, ipcMain } from 'electron';
import fs from 'fs';
import { AIPrompt, PromptLibraryStats } from '../common/types/prompt';
import { BUILT_IN_PROMPTS } from './BuiltInPrompts';

class PromptManager {
  private dataDir: string;
  private promptsFile: string;
  private prompts: Map<string, AIPrompt> = new Map();

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.promptsFile = path.join(this.dataDir, 'prompts.json');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.loadPrompts();
    this.initializeBuiltInPrompts();
    this.setupIPCHandlers();
  }

  private initializeBuiltInPrompts(): void {
    BUILT_IN_PROMPTS.forEach(prompt => {
      if (!this.prompts.has(prompt.id)) {
        this.prompts.set(prompt.id, prompt);
      }
    });
    this.persist();
  }

  private loadPrompts(): void {
    try {
      if (fs.existsSync(this.promptsFile)) {
        const data = JSON.parse(fs.readFileSync(this.promptsFile, 'utf-8'));
        data.forEach((prompt: AIPrompt) => {
          this.prompts.set(prompt.id, prompt);
        });
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  }

  private setupIPCHandlers() {
    ipcMain.handle('prompts:get-all', () => Array.from(this.prompts.values()));
    ipcMain.handle('prompts:get-by-id', (_, id: string) => this.prompts.get(id));
    ipcMain.handle('prompts:save', (_, prompt: AIPrompt) => this.savePrompt(prompt));
    ipcMain.handle('prompts:delete', (_, id: string) => this.deletePrompt(id));
    ipcMain.handle('prompts:toggle-favorite', (_, id: string) => this.toggleFavorite(id));
    ipcMain.handle('prompts:import', (_, prompts: AIPrompt[]) => this.importPrompts(prompts));
    ipcMain.handle('prompts:get-stats', () => this.getStats());
  }

  public getPromptById(id: string): AIPrompt | undefined {
    return this.prompts.get(id);
  }

  public savePrompt(prompt: AIPrompt): AIPrompt {
    const now = Date.now();
    const existing = this.prompts.get(prompt.id);
    
    const newPrompt: AIPrompt = {
      ...prompt,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    this.prompts.set(newPrompt.id, newPrompt);
    this.persist();
    return newPrompt;
  }

  public deletePrompt(id: string): boolean {
    if (this.prompts.delete(id)) {
      this.persist();
      return true;
    }
    return false;
  }

  public toggleFavorite(id: string): boolean {
    const prompt = this.prompts.get(id);
    if (prompt) {
      prompt.isFavorite = !prompt.isFavorite;
      prompt.updatedAt = Date.now();
      this.persist();
      return true;
    }
    return false;
  }

  public importPrompts(newPrompts: AIPrompt[]): void {
    newPrompts.forEach(p => {
      this.prompts.set(p.id, {
        ...p,
        createdAt: p.createdAt || Date.now(),
        updatedAt: Date.now()
      });
    });
    this.persist();
  }

  private persist(): void {
    try {
      fs.writeFileSync(
        this.promptsFile,
        JSON.stringify(Array.from(this.prompts.values()), null, 2)
      );
    } catch (error) {
      console.error('Failed to save prompts:', error);
    }
  }

  public getStats(): PromptLibraryStats {
    const all = Array.from(this.prompts.values());
    return {
      totalPrompts: all.length,
      favoriteCount: all.filter(p => p.isFavorite).length,
      builtInCount: all.filter(p => p.isBuiltIn).length,
      categories: Array.from(new Set(all.map(p => p.category)))
    };
  }
}

export default new PromptManager();
