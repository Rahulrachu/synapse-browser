import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Folder, FileText, Tag } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface ResearchPage {
  id: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  addedAt: number;
}

interface ResearchCollection {
  id: string;
  name: string;
  description: string;
  pages: ResearchPage[];
  createdAt: number;
  updatedAt: number;
}

export default function ResearchCollectionsPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [collections, setCollections] = useState<ResearchCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');

  // Load collections
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'get-research-collections'
      );
      if (result && result.collections) {
        setCollections(result.collections);
      }
    } catch (err) {
      console.error('Failed to load research collections:', err);
    }
  };

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  const filteredPages = selectedCollection
    ? selectedCollection.pages.filter(
        (page) =>
          page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      const newCollection: ResearchCollection = {
        id: Date.now().toString(),
        name: newCollectionName,
        description: newCollectionDescription,
        pages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setCollections((prev) => [...prev, newCollection]);
      setSelectedCollectionId(newCollection.id);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setIsCreatingCollection(false);

      // Save to backend
      await window.electron.ipcRenderer.invoke('create-research-collection', {
        collection: newCollection,
      });
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (selectedCollectionId === id) {
        setSelectedCollectionId(null);
      }

      await window.electron.ipcRenderer.invoke('delete-research-collection', id);
    } catch (err) {
      console.error('Failed to delete collection:', err);
    }
  };

  const handleAddPage = async () => {
    if (!selectedCollection) return;

    const url = prompt('Enter page URL:');
    if (!url) return;

    try {
      const newPage: ResearchPage = {
        id: Date.now().toString(),
        title: url,
        url,
        summary: '',
        tags: [],
        addedAt: Date.now(),
      };

      const updatedCollection = {
        ...selectedCollection,
        pages: [...selectedCollection.pages, newPage],
        updatedAt: Date.now(),
      };

      setCollections((prev) =>
        prev.map((c) => (c.id === selectedCollection.id ? updatedCollection : c))
      );

      await window.electron.ipcRenderer.invoke('add-page-to-collection', {
        collectionId: selectedCollection.id,
        page: newPage,
      });
    } catch (err) {
      console.error('Failed to add page:', err);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!selectedCollection) return;

    try {
      const updatedCollection = {
        ...selectedCollection,
        pages: selectedCollection.pages.filter((p) => p.id !== pageId),
        updatedAt: Date.now(),
      };

      setCollections((prev) =>
        prev.map((c) => (c.id === selectedCollection.id ? updatedCollection : c))
      );

      await window.electron.ipcRenderer.invoke('remove-page-from-collection', {
        collectionId: selectedCollection.id,
        pageId,
      });
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };

  const handleOpenPage = (url: string) => {
    window.electron.ipcRenderer.send('open-url', url);
  };

  return (
    <div
      className={`flex h-full rounded-lg border ${
        isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
      } overflow-hidden`}
    >
      {/* Collections List */}
      <div
        className={`w-1/3 border-r flex flex-col ${
          isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2 className="font-semibold text-sm">Research Collections</h2>
          <button
            onClick={() => setIsCreatingCollection(!isCreatingCollection)}
            className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Create Collection Form */}
        {isCreatingCollection && (
          <div className="px-3 py-2 border-b border-gray-700 space-y-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name..."
              className={`w-full px-3 py-2 rounded border text-sm ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
            />
            <textarea
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="Description..."
              className={`w-full px-3 py-2 rounded border text-sm resize-none ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              rows={2}
            />
            <button
              onClick={handleCreateCollection}
              className="w-full px-3 py-2 bg-synapse-accent text-white rounded text-sm hover:bg-synapse-accent-light transition"
            >
              Create
            </button>
          </div>
        )}

        {/* Collections */}
        <div className="flex-1 overflow-y-auto">
          {collections.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">No collections yet</p>
            </div>
          ) : (
            collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollectionId(collection.id)}
                className={`w-full text-left px-3 py-2 border-b cursor-pointer transition ${
                  selectedCollectionId === collection.id
                    ? isDarkMode
                      ? 'bg-synapse-accent text-white'
                      : 'bg-blue-100 text-blue-900'
                    : isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder size={14} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {collection.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {collection.pages.length} pages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCollection(collection.id);
                    }}
                    className="p-1 rounded hover:bg-red-500 hover:text-white transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Pages List */}
      <div className="w-2/3 flex flex-col">
        {selectedCollection ? (
          <>
            {/* Header */}
            <div
              className={`flex items-center justify-between px-4 py-3 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div>
                <h3 className="font-semibold text-sm">{selectedCollection.name}</h3>
                <p className="text-xs text-gray-400">
                  {selectedCollection.description}
                </p>
              </div>
              <button
                onClick={handleAddPage}
                className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-gray-700">
              <div className="flex items-center gap-2 bg-gray-700 rounded px-2 py-1">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Pages */}
            <div className="flex-1 overflow-y-auto">
              {filteredPages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-sm">No pages in this collection</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {filteredPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => handleOpenPage(page.url)}
                      className={`w-full text-left px-4 py-3 transition ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText size={14} />
                            <p className="font-medium text-sm truncate">
                              {page.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {page.url}
                          </p>
                          {page.summary && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {page.summary}
                            </p>
                          )}
                          {page.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {page.tags.map((tag) => (
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
                            handleDeletePage(page.id);
                          }}
                          className="p-1 rounded hover:bg-red-500 hover:text-white transition flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Select a collection to view pages</p>
          </div>
        )}
      </div>
    </div>
  );
}
