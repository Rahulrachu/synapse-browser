import { useState, useCallback, useEffect } from 'react';
import { SearchQuery, SearchResult, SearchStats, SearchProviderInfo } from '../../common/types/search.js';

const { ipcRenderer } = (window as any).electron;

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [providers, setProviders] = useState<SearchProviderInfo[]>([]);

  const search = useCallback(async (query: SearchQuery) => {
    setIsSearching(true);
    try {
      const results = await ipcRenderer.invoke('search:query', query);
      setResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      const stats = await ipcRenderer.invoke('search:get-stats');
      setStats(stats);
    } catch (error) {
      console.error('Error getting search stats:', error);
    }
  }, []);

  const getProviders = useCallback(async () => {
    try {
      const providers = await ipcRenderer.invoke('search:get-providers');
      setProviders(providers);
    } catch (error) {
      console.error('Error getting search providers:', error);
    }
  }, []);

  const reindex = useCallback(async () => {
    try {
      const stats = await ipcRenderer.invoke('search:reindex');
      setStats(stats);
    } catch (error) {
      console.error('Error reindexing:', error);
    }
  }, []);

  useEffect(() => {
    getStats();
    getProviders();
  }, [getStats, getProviders]);

  return {
    results,
    isSearching,
    stats,
    providers,
    search,
    getStats,
    getProviders,
    reindex
  };
}
