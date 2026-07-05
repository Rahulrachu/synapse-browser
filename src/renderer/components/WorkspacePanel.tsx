import React, { useState } from 'react';
import { FileText, Plus, Trash2, Edit2 } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function WorkspacePanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const notes = useWorkspaceStore((state) => state.notes);
  const addNote = useWorkspaceStore((state) => state.addNote);
  const deleteNote = useWorkspaceStore((state) => state.deleteNote);
  const updateNote = useWorkspaceStore((state) => state.updateNote);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  const handleNewNote = () => {
    addNote('Untitled Note', '');
  };

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  };

  const handleSaveNote = () => {
    if (selectedNoteId) {
      updateNote(selectedNoteId, editTitle, editContent);
    }
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <FileText size={18} />
          Notes
        </h2>
        <button
          onClick={handleNewNote}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Notes List */}
        <div className={`w-48 border-r ${isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'} overflow-y-auto`}>
          {notes.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No notes yet
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note.id)}
                className={`p-3 border-b cursor-pointer transition ${
                  selectedNoteId === note.id
                    ? isDarkMode ? 'bg-synapse-accent text-white' : 'bg-synapse-accent text-white'
                    : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <p className="font-medium text-sm truncate">{note.title}</p>
                <p className="text-xs text-gray-400 truncate">{note.content.substring(0, 50)}</p>
              </div>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col p-4 gap-3">
          {selectedNote ? (
            <>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note title..."
                className={`px-3 py-2 rounded border font-semibold ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Start typing..."
                className={`flex-1 px-3 py-2 rounded border resize-none ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNote}
                  className="flex-1 px-3 py-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    deleteNote(selectedNoteId);
                    setSelectedNoteId(null);
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a note or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
