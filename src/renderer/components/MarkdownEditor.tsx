import React, { useState } from 'react';
import { Eye, Code } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

export default function MarkdownEditor({ value, onChange, isDarkMode }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const renderMarkdown = (md: string) => {
    // Simple markdown rendering
    let html = md
      .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-5 mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>');

    return `<div class="prose prose-sm max-w-none"><p class="mb-2">${html}</p></div>`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'}`}>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1 px-3 py-1 rounded transition ${
            showPreview
              ? 'bg-synapse-accent text-white'
              : 'hover:bg-synapse-accent hover:text-white'
          }`}
        >
          {showPreview ? <Eye size={16} /> : <Code size={16} />}
          {showPreview ? 'Preview' : 'Edit'}
        </button>
      </div>

      {/* Editor/Preview */}
      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div
            className={`p-4 overflow-y-auto h-full ${isDarkMode ? 'bg-synapse-darker text-gray-100' : 'bg-white text-gray-900'}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full h-full p-4 resize-none border-0 font-mono text-sm ${
              isDarkMode
                ? 'bg-synapse-darker text-white placeholder-gray-500'
                : 'bg-white text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
            placeholder="Write markdown here..."
          />
        )}
      </div>
    </div>
  );
}
