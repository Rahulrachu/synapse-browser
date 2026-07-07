import React, { useState, useEffect } from 'react';
import { Zap, Plus, Folder, Code, Play } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface ProjectTemplate {
  name: string;
  command: string;
  description: string;
}

export default function ProjectCreationPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'get-project-templates'
      );
      if (result && result.templates) {
        setTemplates(result.templates);
        if (result.templates.length > 0) {
          setSelectedTemplate(result.templates[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedTemplate) {
      setError('Please enter a project name and select a template');
      return;
    }

    setIsCreating(true);
    setError(null);
    setProgress(0);

    try {
      // Listen for progress updates
      window.electron.ipcRenderer.on('project-creation-progress', (event, data) => {
        setProgress(data.progress);
        setStatus(data.message);

        if (data.stage === 'error') {
          setError(data.error);
          setIsCreating(false);
        } else if (data.stage === 'complete') {
          setIsCreating(false);
          // Reset form
          setProjectName('');
          setProjectDescription('');
        }
      });

      // Start project creation
      await window.electron.ipcRenderer.invoke('create-project', {
        name: projectName,
        type: selectedTemplate,
        description: projectDescription,
        outputPath: process.env.HOME || '/home/ubuntu',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      setIsCreating(false);
    }
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
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-synapse-accent" />
          <h2 className="font-semibold text-sm">AI Project Creator</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., my-saas-app"
            disabled={isCreating}
            className={`w-full px-3 py-2 rounded border text-sm ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent disabled:opacity-50`}
          />
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            placeholder="Brief description of your project..."
            disabled={isCreating}
            className={`w-full px-3 py-2 rounded border text-sm resize-none ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent disabled:opacity-50`}
            rows={3}
          />
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Template</label>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => setSelectedTemplate(template.name)}
                disabled={isCreating}
                className={`w-full text-left px-3 py-2 rounded border transition ${
                  selectedTemplate === template.name
                    ? isDarkMode
                      ? 'border-synapse-accent bg-synapse-accent bg-opacity-20'
                      : 'border-blue-500 bg-blue-50'
                    : isDarkMode
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-300 hover:border-gray-400'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  <Code size={16} />
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-gray-400">{template.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`px-3 py-2 rounded text-sm ${
              isDarkMode
                ? 'bg-red-900 bg-opacity-30 text-red-300'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {error}
          </div>
        )}

        {/* Progress */}
        {isCreating && (
          <div className="space-y-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-synapse-accent h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{status}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`border-t ${
          isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
        } p-4 flex gap-2`}
      >
        <button
          onClick={handleCreateProject}
          disabled={isCreating || !projectName.trim() || !selectedTemplate}
          className={`flex-1 px-4 py-2 rounded font-medium text-sm transition flex items-center justify-center gap-2 ${
            isCreating || !projectName.trim() || !selectedTemplate
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-synapse-accent text-white hover:bg-synapse-accent-light'
          }`}
        >
          <Plus size={16} />
          Create Project
        </button>
      </div>
    </div>
  );
}
