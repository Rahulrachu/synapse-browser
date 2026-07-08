import React, { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSearch } from '../hooks/useSearch';
import { SearchQuery, SearchResult } from '../../common/types/search';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { results, isSearching, search } = useSearch();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (isOpen) {
      // Focus input when modal opens
      setTimeout(() => {
        const input = document.getElementById('global-search-input');
        if (input) {
          input.focus();
        }
      }, 0);
    }
  }, [isOpen]);

  const handleSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      return;
    }

    const searchQuery: SearchQuery = {
      text,
      limit: 20
    };

    await search(searchQuery);
  }, [search]);

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
      onClose();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    console.log('Quick action for result:', result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className={`w-full max-w-2xl rounded-lg shadow-lg ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
        {/* Search Input */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              id="global-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search everything... (Ctrl+Shift+F)"
              className={`w-full pl-10 pr-10 py-3 rounded border text-lg ${
                isDarkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-gray-100 text-black border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin">
                <div className="h-6 w-6 border-2 border-synapse-accent border-t-transparent rounded-full" />
              </div>
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No results found for "{query}"
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div>
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left px-4 py-3 border-b transition ${
                    idx === selectedIndex
                      ? 'bg-synapse-accent text-white'
                      : isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{result.title}</div>
                      <div className={`text-sm mt-1 ${idx === selectedIndex ? 'text-white' : 'text-gray-500'}`}>
                        {result.description}
                      </div>
                    </div>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                      idx === selectedIndex
                        ? 'bg-white bg-opacity-20'
                        : isDarkMode
                        ? 'bg-gray-600'
                        : 'bg-gray-200'
                    }`}>
                      {result.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} px-4 py-2 text-xs text-gray-500`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="mr-4">↑↓ Navigate</span>
              <span className="mr-4">⏎ Select</span>
              <span>Esc Close</span>
            </div>
            {results.length > 0 && (
              <div>{results.length} results</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
