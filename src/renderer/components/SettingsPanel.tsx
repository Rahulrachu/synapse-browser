import React, { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Settings {
  theme: 'dark' | 'light' | 'auto';
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  autoSaveInterval: number;
  enableNotifications: boolean;
  enableGitIntegration: boolean;
  defaultBrowser: string;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  autoSave: true,
  autoSaveInterval: 30,
  enableNotifications: true,
  enableGitIntegration: true,
  defaultBrowser: 'chrome',
};

export default function SettingsPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = localStorage.getItem('synapse-settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('synapse-settings', JSON.stringify(settings));
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
    }
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  return (
    <div
      className={`flex flex-col h-full rounded-lg border ${
        isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
      } overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <h2 className="text-lg font-bold">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6 max-w-2xl">
          {/* Appearance Section */}
          <div>
            <h3 className="text-sm font-bold uppercase mb-3 text-synapse-accent">Appearance</h3>
            <div className="space-y-3">
              <SettingItem
                label="Theme"
                isDarkMode={isDarkMode}
              >
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value as any)}
                  className={`px-3 py-2 rounded border text-sm ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </SettingItem>

              <SettingItem
                label="Font Size"
                description="Editor font size in pixels"
                isDarkMode={isDarkMode}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="20"
                    value={settings.fontSize}
                    onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-8">{settings.fontSize}px</span>
                </div>
              </SettingItem>
            </div>
          </div>

          {/* Editor Section */}
          <div>
            <h3 className="text-sm font-bold uppercase mb-3 text-synapse-accent">Editor</h3>
            <div className="space-y-3">
              <SettingItem
                label="Tab Size"
                description="Number of spaces per indent"
                isDarkMode={isDarkMode}
              >
                <select
                  value={settings.tabSize}
                  onChange={(e) => handleSettingChange('tabSize', parseInt(e.target.value))}
                  className={`px-3 py-2 rounded border text-sm ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
                >
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="8">8 spaces</option>
                </select>
              </SettingItem>

              <SettingItem
                label="Auto Save"
                description="Automatically save files"
                isDarkMode={isDarkMode}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </SettingItem>

              {settings.autoSave && (
                <SettingItem
                  label="Auto Save Interval"
                  description="Seconds between auto saves"
                  isDarkMode={isDarkMode}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="10"
                      value={settings.autoSaveInterval}
                      onChange={(e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-12">{settings.autoSaveInterval}s</span>
                  </div>
                </SettingItem>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div>
            <h3 className="text-sm font-bold uppercase mb-3 text-synapse-accent">Features</h3>
            <div className="space-y-3">
              <SettingItem
                label="Notifications"
                description="Enable desktop notifications"
                isDarkMode={isDarkMode}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </SettingItem>

              <SettingItem
                label="Git Integration"
                description="Enable Git features and commands"
                isDarkMode={isDarkMode}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableGitIntegration}
                    onChange={(e) => handleSettingChange('enableGitIntegration', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </SettingItem>
            </div>
          </div>

          {/* Browser Section */}
          <div>
            <h3 className="text-sm font-bold uppercase mb-3 text-synapse-accent">Browser</h3>
            <div className="space-y-3">
              <SettingItem
                label="Default Browser"
                isDarkMode={isDarkMode}
              >
                <select
                  value={settings.defaultBrowser}
                  onChange={(e) => handleSettingChange('defaultBrowser', e.target.value)}
                  className={`px-3 py-2 rounded border text-sm ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
                >
                  <option value="chrome">Chrome</option>
                  <option value="firefox">Firefox</option>
                  <option value="safari">Safari</option>
                  <option value="edge">Edge</option>
                </select>
              </SettingItem>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 flex justify-end gap-2`}
      >
        <button
          onClick={handleResetSettings}
          className={`px-4 py-2 rounded transition flex items-center gap-2 ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
          }`}
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={!hasChanges}
          className={`px-4 py-2 rounded transition flex items-center gap-2 ${
            hasChanges
              ? 'bg-synapse-accent hover:bg-synapse-accent-light text-white'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
          }`}
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  );
}

interface SettingItemProps {
  label: string;
  description?: string;
  isDarkMode: boolean;
  children: React.ReactNode;
}

function SettingItem({ label, description, isDarkMode, children }: SettingItemProps) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{label}</label>
          {description && (
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {description}
            </p>
          )}
        </div>
        <div className="ml-4">{children}</div>
      </div>
    </div>
  );
}
