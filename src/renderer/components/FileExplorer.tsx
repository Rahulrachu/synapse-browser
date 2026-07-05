import React, { useState } from 'react';
import { FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  expanded?: boolean;
}

export default function FileExplorer() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      id: '1',
      name: 'projects',
      type: 'folder',
      expanded: true,
      children: [
        {
          id: '2',
          name: 'synapse-browser',
          type: 'folder',
          expanded: false,
          children: [
            { id: '3', name: 'src', type: 'folder', expanded: false },
            { id: '4', name: 'package.json', type: 'file' },
            { id: '5', name: 'README.md', type: 'file' },
          ],
        },
        {
          id: '6',
          name: 'ai-workspace',
          type: 'folder',
          expanded: false,
        },
      ],
    },
  ]);

  const toggleFolder = (nodeId: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId && node.type === 'folder') {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };

    setFileTree(updateTree(fileTree));
  };

  const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1 ml-${depth * 4} hover:bg-gray-700 cursor-pointer transition`}
          onClick={() => node.type === 'folder' && toggleFolder(node.id)}
        >
          {node.type === 'folder' ? (
            <>
              {node.expanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <FolderOpen size={16} className="text-yellow-500" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File size={16} className="text-gray-400" />
            </>
          )}
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {node.expanded && node.children && renderFileTree(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <FolderOpen size={18} />
          File Explorer
        </h2>
      </div>

      {/* File Tree */}
      <div className={`flex-1 overflow-y-auto p-2 ${isDarkMode ? 'bg-synapse-dark' : 'bg-gray-50'}`}>
        {renderFileTree(fileTree)}
      </div>
    </div>
  );
}
