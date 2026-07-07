import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Minus, Moon, Sun } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Article {
  title: string;
  content: string;
  author?: string;
  publishedDate?: string;
  readingTime?: number;
}

export default function ReadingModePanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [article, setArticle] = useState<Article | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [readingTheme, setReadingTheme] = useState<'light' | 'dark' | 'sepia'>(
    'dark'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Load article from current tab
  useEffect(() => {
    loadArticle();
  }, []);

  const loadArticle = async () => {
    setIsLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'extract-article'
      );
      if (result && result.article) {
        setArticle(result.article);
      }
    } catch (err) {
      console.error('Failed to extract article:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getThemeStyles = () => {
    switch (readingTheme) {
      case 'light':
        return {
          bg: 'bg-white',
          text: 'text-gray-900',
          accent: 'text-gray-600',
        };
      case 'sepia':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          accent: 'text-amber-700',
        };
      case 'dark':
      default:
        return {
          bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-100',
          text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
          accent: isDarkMode ? 'text-gray-400' : 'text-gray-600',
        };
    }
  };

  const theme = getThemeStyles();

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
        <div className="flex items-center gap-2">
          <BookOpen size={18} />
          <h2 className="font-semibold text-sm">Reading Mode</h2>
        </div>
      </div>

      {/* Controls */}
      <div
        className={`px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
        } space-y-3`}
      >
        {/* Font Size */}
        <div>
          <p className="text-xs font-medium mb-2">Font Size</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              className="p-1 rounded hover:bg-gray-700 transition"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm flex-1 text-center">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              className="p-1 rounded hover:bg-gray-700 transition"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Line Height */}
        <div>
          <p className="text-xs font-medium mb-2">Line Height</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.2))}
              className="p-1 rounded hover:bg-gray-700 transition"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm flex-1 text-center">{lineHeight.toFixed(1)}</span>
            <button
              onClick={() => setLineHeight(Math.min(2.0, lineHeight + 0.2))}
              className="p-1 rounded hover:bg-gray-700 transition"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Theme */}
        <div>
          <p className="text-xs font-medium mb-2">Theme</p>
          <div className="flex gap-2">
            <button
              onClick={() => setReadingTheme('light')}
              className={`flex-1 px-3 py-2 rounded text-xs transition flex items-center justify-center gap-1 ${
                readingTheme === 'light'
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <Sun size={12} />
              Light
            </button>
            <button
              onClick={() => setReadingTheme('sepia')}
              className={`flex-1 px-3 py-2 rounded text-xs transition ${
                readingTheme === 'sepia'
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Sepia
            </button>
            <button
              onClick={() => setReadingTheme('dark')}
              className={`flex-1 px-3 py-2 rounded text-xs transition flex items-center justify-center gap-1 ${
                readingTheme === 'dark'
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <Moon size={12} />
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${theme.bg} p-8`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className={`text-sm ${theme.accent}`}>Loading article...</p>
          </div>
        ) : article ? (
          <article>
            <h1 className={`text-3xl font-bold mb-4 ${theme.text}`}>
              {article.title}
            </h1>

            {(article.author || article.publishedDate || article.readingTime) && (
              <div className={`text-sm ${theme.accent} mb-6 pb-4 border-b border-gray-300`}>
                {article.author && <span>{article.author}</span>}
                {article.author && article.publishedDate && <span> • </span>}
                {article.publishedDate && <span>{article.publishedDate}</span>}
                {article.readingTime && (
                  <>
                    <span> • </span>
                    <span>{article.readingTime} min read</span>
                  </>
                )}
              </div>
            )}

            <div
              className={`prose max-w-none ${theme.text}`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
              }}
            >
              <p>{article.content}</p>
            </div>
          </article>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className={`text-sm ${theme.accent}`}>No article loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
