import React, { useState } from 'react';
import { Bookmark, Trash2, Plus, Folder } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function BookmarksPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const bookmarks = useBrowserStore((state) => state.bookmarks);
  const addBookmark = useBrowserStore((state) => state.addBookmark);
  const removeBookmark = useBrowserStore((state) => state.removeBookmark);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAddBookmark = () => {
    if (newTitle && newUrl) {
      addBookmark(newTitle, newUrl);
      setNewTitle('');
      setNewUrl('');
    }
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <Bookmark size={18} />
          Bookmarks
        </h2>
      </div>

      {/* Add Bookmark Form */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Title..."
          className={`w-full px-3 py-2 rounded border mb-2 ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL..."
            className={`flex-1 px-3 py-2 rounded border ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
          <button
            onClick={handleAddBookmark}
            className="px-3 py-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            No bookmarks yet
          </div>
        ) : (
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className={`flex items-center justify-between px-4 py-3 border-b ${
                isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
              } transition`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{bookmark.title}</p>
                <p className="text-xs text-gray-400 truncate">{bookmark.url}</p>
              </div>
              <button
                onClick={() => removeBookmark(bookmark.id)}
                className="ml-2 p-1 rounded hover:bg-red-500 hover:text-white transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
