import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export default function NotesPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load notes from store
  useEffect(() => {
    const storeNotes = useWorkspaceStore((state) => state.notes);
    if (storeNotes) {
      setNotes(storeNotes);
    }
  }, []);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setIsCreating(false);
    // Save to store
    useWorkspaceStore.setState({ notes: [newNote, ...notes] });
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, title, content, updatedAt: Date.now() }
          : note
      )
    );
    // Save to store
    const updatedNotes = notes.map((note) =>
      note.id === id
        ? { ...note, title, content, updatedAt: Date.now() }
        : note
    );
    useWorkspaceStore.setState({ notes: updatedNotes });
  };

  const handleDeleteNote = (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
    // Save to store
    const updatedNotes = notes.filter((note) => note.id !== id);
    useWorkspaceStore.setState({ notes: updatedNotes });
  };

  return (
    <div
      className={`flex h-full rounded-lg border ${
        isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
      } overflow-hidden`}
    >
      {/* Notes List */}
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
          <h2 className="font-semibold text-sm">Notes</h2>
          <button
            onClick={handleCreateNote}
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
              placeholder="Search notes..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">No notes yet</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`px-3 py-2 border-b cursor-pointer transition ${
                  selectedNoteId === note.id
                    ? isDarkMode
                      ? 'bg-synapse-accent text-white'
                      : 'bg-blue-100 text-blue-900'
                    : isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                }`}
              >
                <p className="font-medium text-sm truncate">{note.title}</p>
                <p className="text-xs text-gray-400 truncate">{note.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="w-2/3 flex flex-col">
        {selectedNote ? (
          <>
            {/* Title */}
            <input
              type="text"
              value={selectedNote.title}
              onChange={(e) =>
                handleUpdateNote(selectedNote.id, e.target.value, selectedNote.content)
              }
              className={`px-4 py-3 border-b text-lg font-semibold ${
                isDarkMode
                  ? 'bg-synapse-dark border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              } focus:outline-none`}
              placeholder="Note title..."
            />

            {/* Content */}
            <textarea
              value={selectedNote.content}
              onChange={(e) =>
                handleUpdateNote(selectedNote.id, selectedNote.title, e.target.value)
              }
              className={`flex-1 px-4 py-3 resize-none ${
                isDarkMode
                  ? 'bg-synapse-dark text-white'
                  : 'bg-white text-gray-900'
              } focus:outline-none`}
              placeholder="Note content..."
            />

            {/* Footer */}
            <div
              className={`flex items-center justify-between px-4 py-2 border-t ${
                isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-200 bg-gray-50'
              } text-xs text-gray-400`}
            >
              <span>
                Updated: {new Date(selectedNote.updatedAt).toLocaleString()}
              </span>
              <button
                onClick={() => handleDeleteNote(selectedNote.id)}
                className="p-1 rounded hover:bg-red-500 hover:text-white transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Select a note to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
