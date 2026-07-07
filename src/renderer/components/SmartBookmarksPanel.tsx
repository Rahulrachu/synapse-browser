import React, { useState, useEffect } from 'react';
import { Star, Trash2, Search, Tag, Plus } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  tags: string[];
  summary: string;
  createdAt: number;
  frequency: number;
}

export default function SmartBookmarksPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');

  // Load bookmarks
  useEffect(() => {
    loadBookmarks();
  }, []);

  // Extract all tags
  useEffect(() => {
    const tags = new Set<string>();
    bookmarks.forEach((b) => {
      b.tags.forEach((t) => tags.add(t));
    });
    setAllTags(Array.from(tags));
  }, [bookmarks]);

  const loadBookmarks = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('get-bookmarks');
      if (result && result.bookmarks) {
        setBookmarks(result.bookmarks);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesSearch =
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || bookmark.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const handleAddBookmark = async () => {
    if (!newBookmarkUrl.trim() || !newBookmarkTitle.trim()) return;

    try {
      await window.electron.ipcRenderer.invoke('add-bookmark', {
        title: newBookmarkTitle,
        url: newBookmarkUrl,
        tags: [],
        summary: '',
      });

      setNewBookmarkUrl('');
      setNewBookmarkTitle('');
      setIsAddingBookmark(false);
      await loadBookmarks();
    } catch (err) {
      console.error('Failed to add bookmark:', err);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;

    try {
      await window.electron.ipcRenderer.invoke('delete-bookmark', id);
      await loadBookmarks();
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    }
  };

  const handleOpenBookmark = (url: string) => {
    window.electron.ipcRenderer.send('open-url', url);
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
        <h2 className="font-semibold text-sm">Smart Bookmarks</h2>
        <button
          onClick={() => setIsAddingBookmark(!isAddingBookmark)}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Add Bookmark Form */}
      {isAddingBookmark && (
        <div
          className={`px-4 py-3 border-b ${
            isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <input
            type="text"
            value={newBookmarkTitle}
            onChange={(e) => setNewBookmarkTitle(e.target.value)}
            placeholder="Bookmark title..."
            className={`w-full px-3 py-2 rounded border mb-2 text-sm ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
          <input
            type="text"
            value={newBookmarkUrl}
            onChange={(e) => setNewBookmarkUrl(e.target.value)}
            placeholder="URL..."
            className={`w-full px-3 py-2 rounded border mb-2 text-sm ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
          <button
            onClick={handleAddBookmark}
            className="w-full px-3 py-2 bg-synapse-accent text-white rounded text-sm hover:bg-synapse-accent-light transition"
          >
            Add Bookmark
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="px-3 py-2 border-b border-gray-700 space-y-2">
        <div className="flex items-center gap-2 bg-gray-700 rounded px-2 py-1">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-1 rounded text-xs transition ${
                selectedTag === null
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-synapse-accent text-white'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto">
        {filteredBookmarks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No bookmarks found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`p-3 border-b cursor-pointer transition ${
                  isDarkMode
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleOpenBookmark(bookmark.url)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {bookmark.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {bookmark.url}
                    </p>
                    {bookmark.summary && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {bookmark.summary}
                      </p>
                    )}
                    {bookmark.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bookmark.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBookmark(bookmark.id);
                    }}
                    className="p-1 rounded hover:bg-red-500 hover:text-white transition flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
