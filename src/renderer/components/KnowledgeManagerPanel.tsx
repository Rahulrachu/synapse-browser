import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { 
  Search, 
  Plus, 
  Trash2, 
  Pin, 
  Download, 
  Upload, 
  Filter, 
  Tag as TagIcon,
  MessageSquare,
  Briefcase,
  Layout,
  Clock,
  Database
} from 'lucide-react';

interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  metadata: any;
  timestamp: number;
  tags: string[];
  isPinned: boolean;
  source: string;
}

export default function KnowledgeManagerPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedMemory, setSelectedMemory] = useState<MemoryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const memoryTypes = ['All', 'short_term', 'long_term', 'workspace', 'project', 'conversation', 'fact', 'preference'];

  const fetchMemories = async () => {
    try {
      let result;
      if (searchQuery) {
        result = await window.electron.invoke('memory:search', searchQuery, { 
          type: selectedType === 'All' ? undefined : selectedType 
        });
      } else {
        if (selectedType === 'All') {
          // Fallback to get some memories if no type is selected
          result = await window.electron.invoke('memory:search', '', { k: 50 });
        } else {
          result = await window.electron.invoke('memory:get-by-type', selectedType);
        }
      }
      setMemories(result || []);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [selectedType]);

  const handleSearch = () => {
    fetchMemories();
  };

  const handleAddMemory = async () => {
    const content = prompt('Enter memory content:');
    if (!content) return;
    const type = prompt('Enter memory type (short_term, long_term, workspace, project, conversation, fact, preference):', 'long_term');
    if (!type) return;

    await window.electron.invoke('memory:add', {
      content,
      type,
      tags: [],
      metadata: { createdManually: true }
    });
    fetchMemories();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      await window.electron.invoke('memory:delete', id);
      if (selectedMemory?.id === id) setSelectedMemory(null);
      fetchMemories();
    }
  };

  const handleTogglePin = async (memory: MemoryEntry) => {
    await window.electron.invoke('memory:update', memory.id, { isPinned: !memory.isPinned });
    fetchMemories();
    if (selectedMemory?.id === memory.id) {
      setSelectedMemory({ ...selectedMemory, isPinned: !memory.isPinned });
    }
  };

  const handleUpdate = async () => {
    if (!selectedMemory) return;
    const tags = editTags.split(',').map(t => t.trim()).filter(t => t !== '');
    await window.electron.invoke('memory:update', selectedMemory.id, { 
      content: editContent,
      tags
    });
    setIsEditing(false);
    fetchMemories();
    setSelectedMemory({ ...selectedMemory, content: editContent, tags });
  };

  const handleExport = async () => {
    const json = await window.electron.invoke('memory:export');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse-memories-${new Date().toISOString()}.json`;
    a.click();
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const json = e.target.result;
        await window.electron.invoke('memory:import', json);
        fetchMemories();
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conversation': return <MessageSquare size={14} />;
      case 'project': return <Briefcase size={14} />;
      case 'workspace': return <Layout size={14} />;
      case 'short_term': return <Clock size={14} />;
      default: return <Database size={14} />;
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Knowledge Manager</h2>
          <div className="flex gap-2">
            <button onClick={handleImport} title="Import JSON" className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <Upload size={18} />
            </button>
            <button onClick={handleExport} title="Export JSON" className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <Download size={18} />
            </button>
            <button onClick={handleAddMemory} className="flex items-center gap-1 px-3 py-1 bg-synapse-accent text-white rounded hover:opacity-90 transition-opacity">
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search memories..."
              className={`flex-1 bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-black'}`}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded bg-synapse-accent text-white hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {memoryTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Memory List */}
        <div className={`w-1/3 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {memories.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No memories found</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  onClick={() => {
                    setSelectedMemory(memory);
                    setIsEditing(false);
                    setEditContent(memory.content);
                    setEditTags(memory.tags.join(', '));
                  }}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedMemory?.id === memory.id
                      ? 'bg-synapse-accent/20 border-l-4 border-synapse-accent'
                      : isDarkMode
                      ? 'hover:bg-gray-700/50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-synapse-accent">
                      {getTypeIcon(memory.type)}
                      <span>{memory.type.replace('_', ' ')}</span>
                    </div>
                    {memory.isPinned && <Pin size={12} className="text-yellow-500 fill-yellow-500" />}
                  </div>
                  <div className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {memory.content}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {memory.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-gray-500/20 text-[10px] text-gray-400">
                        #{tag}
                      </span>
                    ))}
                    {memory.tags.length > 2 && <span className="text-[10px] text-gray-500">+{memory.tags.length - 2}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Memory Details */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedMemory ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedMemory.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedMemory.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">Memory Details</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleTogglePin(selectedMemory)}
                    className={`p-2 rounded ${selectedMemory.isPinned ? 'text-yellow-500' : 'text-gray-500'} hover:bg-gray-500/10`}
                  >
                    <Pin size={18} fill={selectedMemory.isPinned ? 'currentColor' : 'none'} />
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedMemory.id)}
                    className="p-2 rounded text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={`w-full h-40 p-3 rounded border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
                      } outline-none focus:border-synapse-accent`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className={`w-full p-2 rounded border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
                      } outline-none focus:border-synapse-accent`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-synapse-accent text-white rounded font-medium"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className={`px-4 py-2 rounded font-medium ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {selectedMemory.content}
                    </p>
                  </div>

                  {selectedMemory.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <TagIcon size={12} />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedMemory.tags.map(tag => (
                          <span key={tag} className={`px-2 py-1 rounded text-xs ${
                            isDarkMode ? 'bg-synapse-accent/20 text-synapse-accent' : 'bg-synapse-accent/10 text-synapse-accent'
                          }`}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Source</div>
                      <div className="text-sm font-medium">{selectedMemory.source}</div>
                    </div>
                    <div className={`p-3 rounded border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">ID</div>
                      <div className="text-[10px] font-mono break-all">{selectedMemory.id}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsEditing(true)}
                    className={`w-full py-2 rounded border ${
                      isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                    } text-sm font-medium transition-colors`}
                  >
                    Edit Memory
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <div className={`p-6 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Database size={48} className="opacity-20" />
              </div>
              <p>Select a memory to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
