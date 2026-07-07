import React, { useState, useEffect } from 'react';
import { Search, Function, Variable, Type, File } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface CodeSymbol {
  id: string;
  name: string;
  type: 'function' | 'variable' | 'class' | 'interface' | 'type';
  file: string;
  line: number;
  column: number;
  description?: string;
}

export default function SymbolSearchPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [symbols, setSymbols] = useState<CodeSymbol[]>([]);
  const [filteredSymbols, setFilteredSymbols] = useState<CodeSymbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<CodeSymbol | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterByType, setFilterByType] = useState<string | null>(null);

  // Search symbols
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredSymbols([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'search-symbols',
        { query: searchQuery }
      );

      if (result && result.symbols) {
        setSymbols(result.symbols);
        filterSymbols(result.symbols);
      }
    } catch (err) {
      console.error('Failed to search symbols:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSymbols = (allSymbols: CodeSymbol[]) => {
    let filtered = allSymbols;

    if (filterByType) {
      filtered = filtered.filter((s) => s.type === filterByType);
    }

    setFilteredSymbols(filtered);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectSymbol = (symbol: CodeSymbol) => {
    setSelectedSymbol(symbol);
    // Navigate to symbol in editor
    window.electron.ipcRenderer.send('navigate-to-symbol', {
      file: symbol.file,
      line: symbol.line,
      column: symbol.column,
    });
  };

  const getSymbolIcon = (type: string) => {
    switch (type) {
      case 'function':
        return <Function size={16} />;
      case 'variable':
        return <Variable size={16} />;
      case 'class':
      case 'interface':
      case 'type':
        return <Type size={16} />;
      default:
        return <File size={16} />;
    }
  };

  const getSymbolColor = (type: string) => {
    switch (type) {
      case 'function':
        return 'text-yellow-400';
      case 'variable':
        return 'text-blue-400';
      case 'class':
      case 'interface':
        return 'text-green-400';
      case 'type':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      className={`flex flex-col h-full rounded-lg border ${
        isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
      } overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <h2 className="font-semibold text-sm">Symbol Search</h2>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2 bg-gray-700 rounded px-3 py-2 mb-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search symbols (function, class, variable...)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => {
              setFilterByType(null);
              filterSymbols(symbols);
            }}
            className={`px-2 py-1 rounded text-xs transition ${
              filterByType === null
                ? 'bg-synapse-accent text-white'
                : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {['function', 'variable', 'class', 'interface', 'type'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterByType(type);
                filterSymbols(symbols.filter((s) => s.type === type));
              }}
              className={`px-2 py-1 rounded text-xs transition capitalize ${
                filterByType === type
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Searching...</p>
          </div>
        ) : filteredSymbols.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">
              {searchQuery ? 'No symbols found' : 'Enter a search query'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredSymbols.map((symbol) => (
              <button
                key={symbol.id}
                onClick={() => handleSelectSymbol(symbol)}
                className={`w-full text-left px-4 py-3 transition ${
                  selectedSymbol?.id === symbol.id
                    ? isDarkMode
                      ? 'bg-synapse-accent text-white'
                      : 'bg-blue-100 text-blue-900'
                    : isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`flex-shrink-0 mt-0.5 ${getSymbolColor(symbol.type)}`}>
                    {getSymbolIcon(symbol.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{symbol.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {symbol.file}:{symbol.line}:{symbol.column}
                    </p>
                    {symbol.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {symbol.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 flex-shrink-0 capitalize">
                    {symbol.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {filteredSymbols.length > 0 && (
        <div
          className={`border-t ${
            isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
          } px-4 py-2 text-xs text-gray-400`}
        >
          <span>
            {filteredSymbols.length} symbol{filteredSymbols.length !== 1 ? 's' : ''} found
          </span>
        </div>
      )}
    </div>
  );
}
