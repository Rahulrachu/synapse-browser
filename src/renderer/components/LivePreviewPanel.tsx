import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, Code } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface LivePreviewPanelProps {
  filePath?: string;
  content?: string;
}

export default function LivePreviewPanel({ filePath, content }: LivePreviewPanelProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'preview' | 'source'>('preview');

  // Load and render content on mount or when filePath changes
  useEffect(() => {
    if (content) {
      renderContent(content);
    } else if (filePath) {
      loadAndRenderFile();
    }
  }, [filePath, content]);

  const loadAndRenderFile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.electron.ipcRenderer.invoke('read-file', {
        path: filePath,
      });
      if (result && result.content) {
        renderContent(result.content);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      setError(errorMessage);
      console.error('Failed to load file:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (fileContent: string) => {
    try {
      // Check if content is markdown
      if (filePath?.endsWith('.md') || content?.includes('#')) {
        // Simple markdown to HTML conversion
        const html = markdownToHtml(fileContent);
        setPreviewContent(html);
      } else if (filePath?.endsWith('.html') || filePath?.endsWith('.htm')) {
        setPreviewContent(fileContent);
      } else {
        // For other file types, display as code
        setPreviewContent(`<pre>${escapeHtml(fileContent)}</pre>`);
      }
    } catch (err) {
      setError('Failed to render content');
      console.error('Failed to render content:', err);
    }
  };

  const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Code blocks
    html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Lists
    html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;

    return html;
  };

  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
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
        <h2 className="font-semibold text-sm">Live Preview</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('preview')}
            className={`p-1 rounded transition ${
              mode === 'preview'
                ? 'bg-synapse-accent text-white'
                : isDarkMode
                  ? 'hover:bg-gray-700'
                  : 'hover:bg-gray-200'
            }`}
            title="Preview Mode"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setMode('source')}
            className={`p-1 rounded transition ${
              mode === 'source'
                ? 'bg-synapse-accent text-white'
                : isDarkMode
                  ? 'hover:bg-gray-700'
                  : 'hover:bg-gray-200'
            }`}
            title="Source Mode"
          >
            <Code size={16} />
          </button>
          <button
            onClick={loadAndRenderFile}
            disabled={isLoading}
            className="p-1 rounded hover:bg-synapse-accent hover:text-white transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 border-b border-red-300">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Content Area */}
      <div
        className={`flex-1 overflow-auto ${
          isDarkMode ? 'bg-synapse-dark' : 'bg-white'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Loading preview...</p>
          </div>
        ) : !filePath && !content ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No file selected</p>
          </div>
        ) : mode === 'preview' ? (
          <div
            className={`p-4 prose ${isDarkMode ? 'prose-invert' : ''}`}
            dangerouslySetInnerHTML={{ __html: previewContent }}
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          />
        ) : (
          <pre
            className={`p-4 text-sm font-mono overflow-auto ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}
          >
            {content || previewContent}
          </pre>
        )}
      </div>
    </div>
  );
}
