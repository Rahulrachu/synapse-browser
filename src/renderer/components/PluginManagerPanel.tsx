import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { usePluginStore } from '../store/pluginStore';
import { PluginInfo } from '../../common/types/plugin';
import { Zap, Trash2, RotateCcw, Upload } from 'lucide-react';

export default function PluginManagerPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { plugins, isLoading, error, fetchPlugins, enablePlugin, disablePlugin, reloadPlugin } = usePluginStore();
  const [selectedPlugin, setSelectedPlugin] = useState<PluginInfo | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleTogglePlugin = async (plugin: PluginInfo) => {
    if (plugin.enabled) {
      await disablePlugin(plugin.manifest.id);
    } else {
      await enablePlugin(plugin.manifest.id);
    }
  };

  const handleReloadPlugin = async (plugin: PluginInfo) => {
    await reloadPlugin(plugin.manifest.id);
  };

  const handleInstallLocal = async () => {
    // This would open a file picker in a real implementation
    // For now, we'll show a placeholder
    alert('Install local plugin feature coming soon');
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-synapse-accent" />
            <h2 className="text-lg font-bold">Plugins</h2>
          </div>
          <button
            onClick={handleInstallLocal}
            className="px-3 py-1 rounded text-sm bg-synapse-accent text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Upload size={16} />
            Install Local
          </button>
        </div>
        {error && (
          <div className={`p-2 rounded text-sm ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Plugin List */}
        <div className={`w-1/3 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading plugins...</div>
          ) : plugins.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No plugins installed</div>
          ) : (
            <div className="space-y-2 p-4">
              {plugins.map((plugin) => (
                <div
                  key={plugin.manifest.id}
                  onClick={() => setSelectedPlugin(plugin)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedPlugin?.manifest.id === plugin.manifest.id
                      ? isDarkMode
                        ? 'bg-synapse-accent text-white'
                        : 'bg-synapse-accent text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{plugin.manifest.name}</div>
                      <div className="text-xs opacity-75">{plugin.manifest.version}</div>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${plugin.enabled ? 'bg-green-500' : 'bg-gray-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plugin Details */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedPlugin ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{selectedPlugin.manifest.name}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedPlugin.manifest.description}
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Version:</span> {selectedPlugin.manifest.version}
                </div>
                <div>
                  <span className="font-semibold">Author:</span> {selectedPlugin.manifest.author}
                </div>
                <div>
                  <span className="font-semibold">ID:</span>
                  <code className={`block text-xs p-2 rounded mt-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {selectedPlugin.manifest.id}
                  </code>
                </div>
                <div>
                  <span className="font-semibold">Status:</span>
                  <span className={`ml-2 ${selectedPlugin.enabled ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedPlugin.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {selectedPlugin.loaded && <span className="ml-2 text-blue-500">(Loaded)</span>}
                </div>
              </div>

              {selectedPlugin.manifest.permissions && selectedPlugin.manifest.permissions.length > 0 && (
                <div>
                  <span className="font-semibold block mb-2">Permissions:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.manifest.permissions.map((perm) => (
                      <span
                        key={perm}
                        className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlugin.manifest.contributions && (
                <div>
                  <span className="font-semibold block mb-2">Contributions:</span>
                  <div className="space-y-1 text-sm">
                    {selectedPlugin.manifest.contributions.commands && (
                      <div>
                        Commands: {selectedPlugin.manifest.contributions.commands.length}
                      </div>
                    )}
                    {selectedPlugin.manifest.contributions.panels && (
                      <div>Panels: {selectedPlugin.manifest.contributions.panels.length}</div>
                    )}
                    {selectedPlugin.manifest.contributions.menus && (
                      <div>Menus: {selectedPlugin.manifest.contributions.menus.length}</div>
                    )}
                    {selectedPlugin.manifest.contributions.shortcuts && (
                      <div>
                        Shortcuts: {selectedPlugin.manifest.contributions.shortcuts.length}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => handleTogglePlugin(selectedPlugin)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    selectedPlugin.enabled
                      ? isDarkMode
                        ? 'bg-red-900 hover:bg-red-800 text-red-200'
                        : 'bg-red-100 hover:bg-red-200 text-red-800'
                      : isDarkMode
                      ? 'bg-green-900 hover:bg-green-800 text-green-200'
                      : 'bg-green-100 hover:bg-green-200 text-green-800'
                  }`}
                >
                  {selectedPlugin.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleReloadPlugin(selectedPlugin)}
                  className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    isDarkMode
                      ? 'bg-blue-900 hover:bg-blue-800 text-blue-200'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                  }`}
                  title="Reload plugin"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a plugin to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
