import React, { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Bell, Lock } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function SettingsPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const toggleDarkMode = useWorkspaceStore((state) => state.toggleDarkMode);
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: true,
    autoSaveInterval: 30,
    fontSize: 14,
    lineHeight: 1.5,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <SettingsIcon size={18} />
          Settings
        </h2>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Theme Section */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            Appearance
          </h3>
          <div className="space-y-3 ml-6">
            <div className="flex items-center justify-between">
              <label className="text-sm">Dark Mode</label>
              <button
                onClick={toggleDarkMode}
                className={`px-4 py-2 rounded transition ${
                  isDarkMode
                    ? 'bg-synapse-accent text-white'
                    : 'bg-gray-300 text-gray-900'
                }`}
              >
                {isDarkMode ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Font Size</label>
              <input
                type="range"
                min="12"
                max="18"
                value={settings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-400 w-8">{settings.fontSize}px</span>
            </div>
          </div>
        </div>

        {/* Editor Section */}
        <div>
          <h3 className="font-semibold mb-3">Editor</h3>
          <div className="space-y-3 ml-6">
            <div className="flex items-center justify-between">
              <label className="text-sm">Line Height</label>
              <input
                type="range"
                min="1"
                max="2"
                step="0.1"
                value={settings.lineHeight}
                onChange={(e) => handleSettingChange('lineHeight', parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-400 w-8">{settings.lineHeight.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Bell size={18} />
            Notifications
          </h3>
          <div className="space-y-3 ml-6">
            <div className="flex items-center justify-between">
              <label className="text-sm">Enable Notifications</label>
              <button
                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                className={`px-4 py-2 rounded transition ${
                  settings.notifications
                    ? 'bg-synapse-accent text-white'
                    : 'bg-gray-300 text-gray-900'
                }`}
              >
                {settings.notifications ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Save Section */}
        <div>
          <h3 className="font-semibold mb-3">Auto-Save</h3>
          <div className="space-y-3 ml-6">
            <div className="flex items-center justify-between">
              <label className="text-sm">Enable Auto-Save</label>
              <button
                onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                className={`px-4 py-2 rounded transition ${
                  settings.autoSave
                    ? 'bg-synapse-accent text-white'
                    : 'bg-gray-300 text-gray-900'
                }`}
              >
                {settings.autoSave ? 'On' : 'Off'}
              </button>
            </div>
            {settings.autoSave && (
              <div className="flex items-center justify-between">
                <label className="text-sm">Interval (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={settings.autoSaveInterval}
                  onChange={(e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value))}
                  className={`w-24 px-2 py-1 rounded border text-sm ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Lock size={18} />
            Security
          </h3>
          <div className="space-y-3 ml-6">
            <button className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm">
              Clear Browsing Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
