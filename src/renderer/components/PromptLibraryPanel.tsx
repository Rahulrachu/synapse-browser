import React, { useEffect, useState } from 'react';
import { Search, Plus, Copy, Trash2, Heart, Download, Upload, Edit2 } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useIPC } from '../hooks/useIPC';
import { AIPrompt, PromptLibraryStats } from '../../common/types/prompt';
import './PromptLibraryPanel.css';

export default function PromptLibraryPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { invoke } = useIPC();

  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [stats, setStats] = useState<PromptLibraryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadPrompts();
    loadStats();
  }, []);

  const loadPrompts = async () => {
    try {
      const data = await invoke('prompts:get-all');
      setPrompts(data || []);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await invoke('prompts:get-stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSavePrompt = async (prompt: AIPrompt) => {
    try {
      await invoke('prompts:save', prompt);
      loadPrompts();
      loadStats();
      setEditingPrompt(null);
      setShowEditor(false);
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await invoke('prompts:delete', id);
        loadPrompts();
        loadStats();
        setSelectedPrompt(null);
      } catch (error) {
        console.error('Failed to delete prompt:', error);
      }
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await invoke('prompts:toggle-favorite', id);
      loadPrompts();
      loadStats();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleCopyPrompt = (prompt: AIPrompt) => {
    navigator.clipboard.writeText(prompt.content);
    alert('Prompt copied to clipboard!');
  };

  const handleExport = () => {
    const toExport = selectedPrompt ? [selectedPrompt] : prompts;
    const json = JSON.stringify(toExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const text = await file.text();
      const imported = JSON.parse(text);
      try {
        await invoke('prompts:import', imported);
        loadPrompts();
        loadStats();
      } catch (error) {
        console.error('Failed to import prompts:', error);
      }
    };
    input.click();
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = stats?.categories || [];

  return (
    <div className={`prompt-library-panel ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <h2>Prompt Library</h2>
        <div className="header-actions">
          <button onClick={() => setShowEditor(true)} className="btn-primary">
            <Plus size={18} /> New
          </button>
          <button onClick={handleExport} className="btn-secondary">
            <Download size={18} />
          </button>
          <button onClick={handleImport} className="btn-secondary">
            <Upload size={18} />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          <span>{stats.totalPrompts} prompts</span>
          <span>{stats.favoriteCount} favorites</span>
          <span>{stats.builtInCount} built-in</span>
        </div>
      )}

      <div className="panel-content">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="categories">
            <h3>Categories</h3>
            <button
              className={`category-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {showEditor && (
            <PromptEditor
              prompt={editingPrompt}
              onSave={handleSavePrompt}
              onCancel={() => {
                setShowEditor(false);
                setEditingPrompt(null);
              }}
              isDarkMode={isDarkMode}
            />
          )}

          {!showEditor && (
            <>
              <div className="prompts-list">
                {filteredPrompts.length === 0 ? (
                  <p className="empty-state">No prompts found</p>
                ) : (
                  filteredPrompts.map(prompt => (
                    <div
                      key={prompt.id}
                      className={`prompt-item ${selectedPrompt?.id === prompt.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      <div className="prompt-header">
                        <h4>{prompt.title}</h4>
                        <span className={`category-badge ${prompt.category.toLowerCase()}`}>
                          {prompt.category}
                        </span>
                      </div>
                      <p className="prompt-preview">{prompt.content.substring(0, 100)}...</p>
                      <div className="prompt-tags">
                        {prompt.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedPrompt && (
                <div className="prompt-detail">
                  <div className="detail-header">
                    <h3>{selectedPrompt.title}</h3>
                    <div className="detail-actions">
                      <button
                        onClick={() => handleToggleFavorite(selectedPrompt.id)}
                        className={`btn-icon ${selectedPrompt.isFavorite ? 'active' : ''}`}
                        title="Toggle favorite"
                      >
                        <Heart size={18} />
                      </button>
                      {!selectedPrompt.isBuiltIn && (
                        <>
                          <button
                            onClick={() => {
                              setEditingPrompt(selectedPrompt);
                              setShowEditor(true);
                            }}
                            className="btn-icon"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(selectedPrompt.id)}
                            className="btn-icon danger"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleCopyPrompt(selectedPrompt)}
                        className="btn-icon"
                        title="Copy"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="detail-content">
                    <div className="detail-field">
                      <label>Category</label>
                      <span>{selectedPrompt.category}</span>
                    </div>
                    <div className="detail-field">
                      <label>Type</label>
                      <span>{selectedPrompt.type}</span>
                    </div>
                    <div className="detail-field">
                      <label>Content</label>
                      <pre>{selectedPrompt.content}</pre>
                    </div>
                    {selectedPrompt.variables && selectedPrompt.variables.length > 0 && (
                      <div className="detail-field">
                        <label>Variables</label>
                        <div className="variables-list">
                          {selectedPrompt.variables.map(v => (
                            <span key={v} className="variable-badge">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface PromptEditorProps {
  prompt: AIPrompt | null;
  onSave: (prompt: AIPrompt) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

function PromptEditor({ prompt, onSave, onCancel, isDarkMode }: PromptEditorProps) {
  const [formData, setFormData] = useState<AIPrompt>(
    prompt || {
      id: `prompt-${Date.now()}`,
      title: '',
      content: '',
      type: 'user',
      category: 'General',
      tags: [],
      isFavorite: false,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  );

  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <div className={`prompt-editor ${isDarkMode ? 'dark' : 'light'}`}>
      <h3>{prompt ? 'Edit Prompt' : 'New Prompt'}</h3>
      
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Prompt title"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Coding"
          />
        </div>

        <div className="form-group">
          <label>Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          >
            <option value="system">System</option>
            <option value="user">User</option>
            <option value="template">Template</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Prompt content"
          rows={8}
        />
      </div>

      <div className="form-group">
        <label>Tags</label>
        <div className="tag-input">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add tag and press Enter"
          />
          <button onClick={handleAddTag}>Add</button>
        </div>
        <div className="tags-list">
          {formData.tags.map(tag => (
            <span key={tag} className="tag-item">
              {tag}
              <button onClick={() => handleRemoveTag(tag)}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="editor-actions">
        <button onClick={() => onSave(formData)} className="btn-primary">
          Save
        </button>
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
