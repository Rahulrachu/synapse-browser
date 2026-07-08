import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Edit2, 
  Download, 
  Upload, 
  Check, 
  Star, 
  Layout, 
  LayoutGrid, 
  Columns, 
  Rows,
  Save
} from 'lucide-react';
import { useWorkspaceTemplateStore } from '../store/workspaceTemplateStore';
import { usePanelStore } from '../store/panelStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function WorkspaceTemplateManager() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { 
    templates, 
    deleteTemplate, 
    duplicateTemplate, 
    updateTemplate, 
    setDefaultTemplate, 
    defaultTemplateId,
    importTemplates,
    exportTemplates,
    saveCurrentAsTemplate
  } = useWorkspaceTemplateStore();
  
  const { restorePanelState, setPanelLayout, splitPanels } = usePanelStore();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showSaveCurrent, setShowSaveCurrent] = useState(false);
  const [newName, setNewName] = useState('');

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setPanelLayout(template.panelLayout);
      restorePanelState(template.panelState);
    }
  };

  const handleSaveCurrent = () => {
    if (newName.trim()) {
      // We need to get current panel layout from somewhere. 
      // Looking at panelStore, it has setPanelLayout but doesn't seem to store the current layout string explicitly in the state we read.
      // However, we can infer it or just use 'grid' as a safe default if not sure.
      // For now, let's assume we can determine it from splitPanels.
      let layout: 'single' | 'split-h' | 'split-v' | 'grid' = 'single';
      if (splitPanels.left && splitPanels.right && splitPanels.top && splitPanels.bottom) layout = 'grid';
      else if (splitPanels.left && splitPanels.right) layout = 'split-h';
      else if (splitPanels.left && splitPanels.bottom) layout = 'split-v';
      
      const currentPanelState = usePanelStore.getState();
      saveCurrentAsTemplate(newName, layout, {
        activePanel: currentPanelState.activePanel,
        panelHistory: currentPanelState.panelHistory,
        splitPanels: currentPanelState.splitPanels,
        panelData: currentPanelState.panelData,
      });
      setNewName('');
      setShowSaveCurrent(false);
    }
  };

  const handleExport = () => {
    const data = exportTemplates();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synapse-templates.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importTemplates(content);
      };
      reader.readAsText(file);
    }
  };

  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'grid': return <LayoutGrid size={16} />;
      case 'split-h': return <Columns size={16} />;
      case 'split-v': return <Rows size={16} />;
      default: return <Layout size={16} />;
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border ${
      isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
    } overflow-hidden`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${
        isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
      }`}>
        <h2 className="text-lg font-bold">Workspace Templates</h2>
        <div className="flex gap-2">
          <label className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition" title="Import Templates">
            <Upload size={18} />
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition" title="Export Templates">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Save Current Workspace */}
        {!showSaveCurrent ? (
          <button 
            onClick={() => setShowSaveCurrent(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-synapse-accent hover:bg-synapse-accent-light text-white rounded-lg transition font-medium"
          >
            <Save size={18} />
            Save Current Workspace
          </button>
        ) : (
          <div className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Template name..."
              className={`w-full px-3 py-2 rounded border mb-2 ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={handleSaveCurrent}
                className="flex-1 px-3 py-1.5 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light text-sm"
              >
                Save
              </button>
              <button 
                onClick={() => setShowSaveCurrent(false)}
                className={`flex-1 px-3 py-1.5 rounded text-sm ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div className="space-y-2">
          {templates.map((template) => (
            <div 
              key={template.id}
              className={`group p-3 rounded-lg border transition ${
                isDarkMode 
                  ? 'border-gray-700 bg-gray-800 hover:bg-gray-750' 
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    {getLayoutIcon(template.panelLayout)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === template.id ? (
                      <div className="flex items-center gap-2">
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
                              updateTemplate(template.id, { name: editName });
                              setEditingId(null);
                            }
                          }}
                        />
                        <button onClick={() => {
                          updateTemplate(template.id, { name: editName });
                          setEditingId(null);
                        }}>
                          <Check size={14} className="text-green-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                        {template.isBuiltIn && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded-full">Built-in</span>
                        )}
                        {defaultTemplateId === template.id && (
                          <Star size={12} className="fill-yellow-500 text-yellow-500" />
                        )}
                      </div>
                    )}
                    <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {template.description || `${template.panelLayout} layout`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={() => setDefaultTemplate(template.id)}
                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${defaultTemplateId === template.id ? 'text-yellow-500' : ''}`}
                    title="Set as default"
                  >
                    <Star size={14} fill={defaultTemplateId === template.id ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={() => duplicateTemplate(template.id)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  {!template.isBuiltIn && (
                    <>
                      <button 
                        onClick={() => {
                          setEditingId(template.id);
                          setEditName(template.name);
                        }}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        title="Rename"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => deleteTemplate(template.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => handleLoadTemplate(template.id)}
                className="w-full mt-3 px-3 py-1.5 bg-synapse-accent/10 hover:bg-synapse-accent text-synapse-accent hover:text-white border border-synapse-accent/20 rounded transition text-xs font-medium"
              >
                Apply Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
