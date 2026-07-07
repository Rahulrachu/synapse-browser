import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: ProjectFile[];
  isOpen?: boolean;
}

interface ProjectExplorerPanelProps {
  projectId?: string;
}

export default function ProjectExplorerPanel({ projectId }: ProjectExplorerPanelProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load project files on mount
  useEffect(() => {
    if (projectId) {
      loadProjectFiles();
    }
  }, [projectId]);

  const loadProjectFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'get-project-files',
        projectId
      );
      if (result && result.files) {
        setFiles(result.files);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project files';
      setError(errorMessage);
      console.error('Failed to load project files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleFileSelect = (path: string) => {
    setSelectedPath(path);
    // Emit event to open file in editor
    window.electron.ipcRenderer.send('file-selected', { path });
  };

  const handleCreateFile = async () => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    try {
      await window.electron.ipcRenderer.invoke('create-file', {
        projectId,
        path: selectedPath || '/',
        name: fileName,
      });
      await loadProjectFiles();
    } catch (err) {
      console.error('Failed to create file:', err);
      setError('Failed to create file');
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      await window.electron.ipcRenderer.invoke('create-directory', {
        projectId,
        path: selectedPath || '/',
        name: folderName,
      });
      await loadProjectFiles();
    } catch (err) {
      console.error('Failed to create folder:', err);
      setError('Failed to create folder');
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm(`Are you sure you want to delete this file/folder?`)) return;

    try {
      await window.electron.ipcRenderer.invoke('delete-file', {
        projectId,
        path,
      });
      await loadProjectFiles();
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError('Failed to delete file');
    }
  };

  const renderFileTree = (items: ProjectFile[], level: number = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        <div
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-sm ${
            selectedPath === item.path
              ? isDarkMode
                ? 'bg-synapse-accent text-white'
                : 'bg-blue-100 text-blue-900'
              : isDarkMode
                ? 'hover:bg-gray-700'
                : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (item.type === 'directory') {
              toggleExpand(item.path);
            } else {
              handleFileSelect(item.path);
            }
          }}
        >
          {item.type === 'directory' ? (
            <>
              {expandedPaths.has(item.path) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              {expandedPaths.has(item.path) ? (
                <FolderOpen size={16} />
              ) : (
                <Folder size={16} />
              )}
            </>
          ) : (
            <>
              <div className="w-4" />
              <File size={16} />
            </>
          )}
          <span className="flex-1 truncate">{item.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.path);
            }}
            className="p-0.5 rounded hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {item.type === 'directory' && expandedPaths.has(item.path) && item.children && (
          <div>{renderFileTree(item.children, level + 1)}</div>
        )}
      </div>
    ));
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
        <h2 className="font-semibold text-sm">Project Explorer</h2>
        <div className="flex gap-1">
          <button
            onClick={handleCreateFile}
            title="New File"
            className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleCreateFolder}
            title="New Folder"
            className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
          >
            <Folder size={16} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 border-b border-red-300">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Files Area */}
      <div
        className={`flex-1 overflow-y-auto ${
          isDarkMode ? 'bg-synapse-dark' : 'bg-gray-50'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Loading project files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No project files</p>
          </div>
        ) : (
          <div className="p-2">{renderFileTree(files)}</div>
        )}
      </div>
    </div>
  );
}
