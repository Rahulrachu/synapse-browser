import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useWorkflowStore } from '../store/workflowStore';
import { Workflow, WorkflowAction } from '../../common/types/workflow';
import { Plus, Trash2, Play, Copy, Download, Upload, Edit2 } from 'lucide-react';

export default function WorkflowManagerPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { workflows, isLoading, error, fetchWorkflows, saveWorkflow, deleteWorkflow, executeWorkflow, importWorkflow, exportWorkflow } = useWorkflowStore();
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [newActionType, setNewActionType] = useState('open-url');
  const [newActionParams, setNewActionParams] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const actionTypes = [
    { value: 'open-url', label: 'Open URL' },
    { value: 'open-workspace', label: 'Open Workspace' },
    { value: 'open-panel', label: 'Open Panel' },
    { value: 'wait', label: 'Wait/Delay' },
    { value: 'show-notification', label: 'Show Notification' },
    { value: 'plugin-action', label: 'Plugin Action' }
  ];

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreateWorkflow = async () => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      description: '',
      actions: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await saveWorkflow(newWorkflow);
    setSelectedWorkflow(newWorkflow);
    setEditingName('New Workflow');
    setEditingDescription('');
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;
    const updated = {
      ...selectedWorkflow,
      name: editingName,
      description: editingDescription
    };
    await saveWorkflow(updated);
    setSelectedWorkflow(updated);
  };

  const handleAddAction = async () => {
    if (!selectedWorkflow) return;
    const newAction: WorkflowAction = {
      id: `action-${Date.now()}`,
      type: newActionType,
      params: newActionParams
    };
    const updated = {
      ...selectedWorkflow,
      actions: [...selectedWorkflow.actions, newAction]
    };
    await saveWorkflow(updated);
    setSelectedWorkflow(updated);
    setNewActionParams({});
  };

  const handleRemoveAction = async (actionId: string) => {
    if (!selectedWorkflow) return;
    const updated = {
      ...selectedWorkflow,
      actions: selectedWorkflow.actions.filter(a => a.id !== actionId)
    };
    await saveWorkflow(updated);
    setSelectedWorkflow(updated);
  };

  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflow) return;
    setIsExecuting(true);
    try {
      const result = await executeWorkflow(selectedWorkflow.id);
      setExecutionResult(result);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDuplicateWorkflow = async () => {
    if (!selectedWorkflow) return;
    const duplicate: Workflow = {
      ...selectedWorkflow,
      id: `workflow-${Date.now()}`,
      name: `${selectedWorkflow.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await saveWorkflow(duplicate);
    setSelectedWorkflow(duplicate);
  };

  const handleExportWorkflow = async () => {
    if (!selectedWorkflow) return;
    try {
      const json = await exportWorkflow(selectedWorkflow.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedWorkflow.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImportWorkflow = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        try {
          await importWorkflow(text);
        } catch (err) {
          console.error('Import failed:', err);
        }
      }
    };
    input.click();
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Workflow Manager</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCreateWorkflow}
              className="px-3 py-1 rounded text-sm bg-synapse-accent text-white hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus size={16} />
              New Workflow
            </button>
            <button
              onClick={handleImportWorkflow}
              className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} flex items-center gap-2`}
            >
              <Upload size={16} />
              Import
            </button>
          </div>
        </div>

        {error && (
          <div className={`p-2 rounded text-sm ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Workflow List */}
        <div className={`w-1/4 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No workflows created</div>
          ) : (
            <div className="space-y-2 p-4">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  onClick={() => {
                    setSelectedWorkflow(wf);
                    setEditingName(wf.name);
                    setEditingDescription(wf.description);
                    setExecutionResult(null);
                  }}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedWorkflow?.id === wf.id
                      ? 'bg-synapse-accent text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold text-sm">{wf.name}</div>
                  <div className="text-xs opacity-75">{wf.actions.length} actions</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Editor */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedWorkflow ? (
            <div className="space-y-4">
              {/* Workflow Info */}
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-semibold">Name</label>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Description</label>
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className={`w-full px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                    rows={2}
                  />
                </div>
                <button
                  onClick={handleSaveWorkflow}
                  className="px-4 py-2 rounded bg-synapse-accent text-white hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
              </div>

              {/* Actions */}
              <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-semibold mb-3">Actions</h3>
                {selectedWorkflow.actions.length === 0 ? (
                  <p className="text-sm text-gray-500 mb-3">No actions added yet</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {selectedWorkflow.actions.map((action, idx) => (
                      <div
                        key={action.id}
                        className={`p-2 rounded flex items-center justify-between ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{idx + 1}. {action.type}</div>
                          <div className="text-xs opacity-75">{JSON.stringify(action.params)}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveAction(action.id)}
                          className="p-1 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Action */}
                <div className="space-y-2 border-t border-gray-600 pt-3">
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value)}
                    className={`w-full px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                  >
                    {actionTypes.map(at => (
                      <option key={at.value} value={at.value}>{at.label}</option>
                    ))}
                  </select>
                  {newActionType === 'open-url' && (
                    <input
                      type="text"
                      placeholder="URL"
                      value={newActionParams.url || ''}
                      onChange={(e) => setNewActionParams({ ...newActionParams, url: e.target.value })}
                      className={`w-full px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200'}`}
                    />
                  )}
                  {newActionType === 'wait' && (
                    <input
                      type="number"
                      placeholder="Duration (ms)"
                      value={newActionParams.durationMs || ''}
                      onChange={(e) => setNewActionParams({ ...newActionParams, durationMs: parseInt(e.target.value) })}
                      className={`w-full px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200'}`}
                    />
                  )}
                  <button
                    onClick={handleAddAction}
                    className="w-full px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Add Action
                  </button>
                </div>
              </div>

              {/* Execution Result */}
              {executionResult && (
                <div className={`p-3 rounded ${executionResult.success ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                  <div className="font-semibold">
                    {executionResult.success ? 'Workflow Completed' : 'Workflow Failed'}
                  </div>
                  <div className="text-sm">
                    {executionResult.completedActions}/{executionResult.totalActions} actions completed
                  </div>
                  {executionResult.error && <div className="text-sm">{executionResult.error}</div>}
                </div>
              )}

              {/* Workflow Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleExecuteWorkflow}
                  disabled={isExecuting}
                  className={`flex-1 px-4 py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2 ${
                    isExecuting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Play size={16} />
                  {isExecuting ? 'Executing...' : 'Execute'}
                </button>
                <button
                  onClick={handleDuplicateWorkflow}
                  className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <button
                  onClick={handleExportWorkflow}
                  className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Export
                </button>
                <button
                  onClick={() => deleteWorkflow(selectedWorkflow.id).then(() => setSelectedWorkflow(null))}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a workflow or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
