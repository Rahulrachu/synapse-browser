import { ipcMain } from 'electron';
import { SearchQuery, SearchResult, SearchStats, SearchProviderInfo } from '../common/types/search.js';
import EventBus from './EventBus.js';

export interface ISearchProvider {
  id: string;
  name: string;
  index(): Promise<void>;
  search(query: SearchQuery): Promise<SearchResult[]>;
}

class SearchEngine {
  private providers: Map<string, ISearchProvider> = new Map();
  private stats: SearchStats = {
    totalItems: 0,
    providerCount: 0,
    lastIndexTime: Date.now()
  };

  constructor() {
    this.setupIPCHandlers();
  }

  private setupIPCHandlers() {
    ipcMain.handle('search:query', async (_, query: SearchQuery) => {
      return this.search(query);
    });

    ipcMain.handle('search:get-stats', () => {
      return this.stats;
    });

    ipcMain.handle('search:get-providers', () => {
      return this.getProviders();
    });

    ipcMain.handle('search:reindex', async () => {
      await this.reindexAll();
      return this.stats;
    });
  }

  registerProvider(provider: ISearchProvider) {
    console.log(`[SearchEngine] Registering provider: ${provider.name} (${provider.id})`);
    this.providers.set(provider.id, provider);
    this.updateStats();
    
    // Initial indexing
    provider.index().catch(err => {
      console.error(`[SearchEngine] Error indexing provider ${provider.id}:`, err);
    });
  }

  unregisterProvider(providerId: string) {
    this.providers.delete(providerId);
    this.updateStats();
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const promises = Array.from(this.providers.values())
      .filter(p => !query.filters || query.filters.length === 0 || query.filters.includes(p.id))
      .map(async p => {
        try {
          return await p.search(query);
        } catch (err) {
          console.error(`[SearchEngine] Search error in provider ${p.id}:`, err);
          return [];
        }
      });

    const results = await Promise.all(promises);
    const flatResults = results.flat();

    // Sort by score (if available) or by relevance
    return flatResults
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, query.limit || 50);
  }

  async reindexAll() {
    console.log('[SearchEngine] Reindexing all providers...');
    const promises = Array.from(this.providers.values()).map(p => p.index());
    await Promise.all(promises);
    this.stats.lastIndexTime = Date.now();
    this.updateStats();
  }

  private updateStats() {
    this.stats.providerCount = this.providers.size;
    // Note: totalItems calculation would depend on providers reporting their count
    this.stats.totalItems = 0; // Placeholder
  }

  private getProviders(): SearchProviderInfo[] {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      enabled: true
    }));
  }
}

export default new SearchEngine();
