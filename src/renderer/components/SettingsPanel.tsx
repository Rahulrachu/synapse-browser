import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import AboutDialog from './AboutDialog';
import { Info } from 'lucide-react';

export default function SettingsPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const toggleDarkMode = useWorkspaceStore((state) => state.toggleDarkMode);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <h2 className="text-lg font-bold">Settings</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <label>Dark Mode</label>
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded ${isDarkMode ? 'bg-synapse-accent text-white' : 'bg-gray-300'}`}
            >
              {isDarkMode ? 'On' : 'Off'}
            </button>
          </div>
        </div>
        <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <label>Language</label>
          <select className={`w-full mt-2 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}>
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </div>

        <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <button
            onClick={() => setIsAboutOpen(true)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Info size={18} />
            <span>About Synapse Browser</span>
          </button>
        </div>
      </div>

      <AboutDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
