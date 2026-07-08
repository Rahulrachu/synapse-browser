import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, Zap, RotateCcw } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSearch } from '../hooks/useSearch';
import { SearchQuery, SearchResult } from '../../common/types/search';

const categoryColors: Record<string, string> = {
  'Tabs': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Notes': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Projects': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Workflows': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Skills': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'Downloads': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'Notifications': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Plugins': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface SearchHistory {
  text: string;
  timestamp: number;
}

export default function SearchCenterPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { results, isSearching, stats, providers, search, reindex } = useSearch();
  
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search-history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  const handleSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }

    const searchQuery: SearchQuery = {
      text,
      filters: selectedFilters.length > 0 ? selectedFilters : undefined,
      limit: 50
    };

    await search(searchQuery);

    // Add to history
    const newHistory = [
      { text, timestamp: Date.now() },
      ...searchHistory.filter(h => h.text !== text)
    ].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('search-history', JSON.stringify(newHistory));
  }, [search, selectedFilters, searchHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Escape') {
      setQuery('');
      setSelectedIndex(-1);
    }
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedIndex(-1);
  };

  const handleResultClick = (result: SearchResult) => {
    // This would be extended with quick actions
    console.log('Result clicked:', result);
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <h2 className="text-lg font-bold mb-4">Search Center</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tabs, notes, projects..."
            className={`w-full pl-10 pr-10 py-2 rounded border ${
              isDarkMode
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-gray-100 text-black border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {providers.map(provider => (
            <button
              key={provider.id}
              onClick={() => toggleFilter(provider.id)}
              className={`px-3 py-1 rounded text-sm transition ${
                selectedFilters.includes(provider.id)
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {provider.name}
            </button>
          ))}
        </div>

        {/* Stats and Actions */}
        <div className="flex items-center justify-between text-sm">
          {stats && (
            <div className="text-gray-500">
              {stats.totalItems} items indexed • {stats.providerCount} providers
            </div>
          )}
          <button
            onClick={reindex}
            className="flex items-center gap-1 text-gray-500 hover:text-synapse-accent transition"
            title="Reindex all providers"
          >
            <RotateCcw size={14} />
            Reindex
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {isSearching && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin">
              <Zap className="text-synapse-accent" size={24} />
            </div>
          </div>
        )}

        {!isSearching && query && results.length === 0 && (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No results found for "{query}"
          </div>
        )}

        {!isSearching && !query && searchHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-500">Recent Searches</h3>
            <div className="space-y-2">
              {searchHistory.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item.text);
                    handleSearch(item.text);
                  }}
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="text-sm">{item.text}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={`p-3 rounded cursor-pointer transition ${
                  idx === selectedIndex
                    ? 'bg-synapse-accent text-white'
                    : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{result.title}</div>
                    <div className={`text-xs mt-1 ${idx === selectedIndex ? 'text-white' : 'text-gray-500'}`}>
                      {result.description}
                    </div>
                  </div>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                    categoryColors[result.category] || 'bg-gray-200 text-gray-800'
                  }`}>
                    {result.category}
                  </span>
                </div>
                {result.score && (
                  <div className="text-xs mt-2 text-gray-400">
                    Relevance: {(result.score * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
