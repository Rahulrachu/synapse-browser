import React, { useState } from 'react';
import { 
  Camera, 
  Trash2, 
  RotateCcw, 
  Edit2, 
  Check, 
  Clock,
  Calendar,
  Layout,
  Globe,
  FileText
} from 'lucide-react';
import { useWorkspaceSnapshotStore } from '../store/workspaceSnapshotStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function WorkspaceSnapshotManager() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { 
    snapshots, 
    createSnapshot, 
    restoreSnapshot, 
    deleteSnapshot, 
    renameSnapshot 
  } = useWorkspaceSnapshotStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreateSnapshot = () => {
    if (newName.trim()) {
      createSnapshot(newName);
      setNewName('');
      setShowCreateForm(false);
    } else {
      createSnapshot(`Snapshot ${new Date().toLocaleString()}`);
      setShowCreateForm(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border ${
      isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
    } overflow-hidden`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${
        isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
      }`}>
        <h2 className="text-lg font-bold">Workspace Snapshots</h2>
        <Camera size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create Snapshot Form */}
        {!showCreateForm ? (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-synapse-accent hover:bg-synapse-accent-light text-white rounded-lg transition font-medium"
          >
            <Camera size={18} />
            Take Snapshot
          </button>
        ) : (
          <div className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Snapshot name (optional)..."
              className={`w-full px-3 py-2 rounded border mb-2 ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={handleCreateSnapshot}
                className="flex-1 px-3 py-1.5 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light text-sm"
              >
                Capture
              </button>
              <button 
                onClick={() => setShowCreateForm(false)}
                className={`flex-1 px-3 py-1.5 rounded text-sm ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Snapshots List */}
        <div className="space-y-3">
          {snapshots.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <Clock size={48} className="mx-auto mb-2 opacity-20" />
              <p>No snapshots yet</p>
              <p className="text-xs">Take a snapshot to preserve your current workspace state</p>
            </div>
          ) : (
            snapshots.map((snapshot) => (
              <div 
                key={snapshot.id}
                className={`group p-3 rounded-lg border transition ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-750' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === snapshot.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <input 
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`flex-1 px-2 py-0.5 rounded border text-sm ${
                            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                          }`}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renameSnapshot(snapshot.id, editName);
                              setEditingId(null);
                            }
                          }}
                        />
                        <button onClick={() => {
                          renameSnapshot(snapshot.id, editName);
                          setEditingId(null);
                        }}>
                          <Check size={14} className="text-green-500" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-sm truncate mb-1">{snapshot.name}</h3>
                    )}
                    
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <div className={`flex items-center gap-1 text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar size={10} />
                        {formatDate(snapshot.timestamp)}
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Clock size={10} />
                        {getTimeAgo(snapshot.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => {
                        setEditingId(snapshot.id);
                        setEditName(snapshot.name);
                      }}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Rename"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => deleteSnapshot(snapshot.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Snapshot Stats */}
                <div className="mt-3 flex gap-2">
                  <div className={`flex-1 p-1.5 rounded flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>
                    <Globe size={12} className="text-blue-500" />
                    <span className="text-[10px] font-medium">{snapshot.tabs.length} Tabs</span>
                  </div>
                  <div className={`flex-1 p-1.5 rounded flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>
                    <Layout size={12} className="text-purple-500" />
                    <span className="text-[10px] font-medium uppercase">{snapshot.panelLayout.replace('split-', '')}</span>
                  </div>
                  <div className={`flex-1 p-1.5 rounded flex items-center justify-center gap-1.5 ${isDarkMode ? 'bg-gray-900/50' : 'bg-white'}`}>
                    <FileText size={12} className="text-green-500" />
                    <span className="text-[10px] font-medium">{snapshot.notes.length} Notes</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => restoreSnapshot(snapshot.id)}
                  className="w-full mt-3 px-3 py-1.5 bg-synapse-accent/10 hover:bg-synapse-accent text-synapse-accent hover:text-white border border-synapse-accent/20 rounded transition text-xs font-medium flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} />
                  Restore Snapshot
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
