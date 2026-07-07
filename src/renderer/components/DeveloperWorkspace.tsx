import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function DeveloperWorkspace() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [files] = useState<string[]>(['main.ts', 'utils.ts', 'config.json']);

  return (
    <div className={`flex h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      <div className={`w-48 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <h3 className="font-bold mb-4">Files</h3>
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file} className={`p-2 rounded cursor-pointer hover:bg-synapse-accent hover:text-white`}>
              {file}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4">
        <h2 className="text-lg font-bold mb-4">Developer Workspace</h2>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Select a file to edit</p>
      </div>
    </div>
  );
}
