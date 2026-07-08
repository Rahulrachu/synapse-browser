import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useMarketplaceStore } from '../store/marketplaceStore';
import { usePluginStore } from '../store/pluginStore';
import { ExtensionMetadata } from '../../common/types/marketplace';
import { Search, Download, Trash2, AlertCircle, Star, TrendingUp } from 'lucide-react';

export default function ExtensionMarketplacePanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { extensions, isLoading, error, searchExtensions, installExtension, uninstallExtension, checkUpdates, updates } = useMarketplaceStore();
  const { plugins, fetchPlugins } = usePluginStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'downloads' | 'updated'>('rating');
  const [selectedExt, setSelectedExt] = useState<ExtensionMetadata | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);
  const [pendingInstallId, setPendingInstallId] = useState<string | null>(null);

  const categories = ['All', 'Productivity', 'UI/UX', 'Tools', 'Development'];
  const sensitivePermissions = ['network', 'filesystem', 'process'];

  useEffect(() => {
    handleSearch();
    checkUpdates();
    fetchPlugins();
  }, []);

  const handleSearch = async () => {
    await searchExtensions({
      query: searchQuery,
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      sortBy
    });
  };

  const isExtensionInstalled = (id: string) => {
    return plugins.some(p => p.manifest.id === id);
  };

  const handleInstallClick = (ext: ExtensionMetadata) => {
    const hasSensitivePerms = ext.requiredPermissions.some(p => sensitivePermissions.includes(p));
    if (hasSensitivePerms) {
      setPendingInstallId(ext.id);
      setShowPermissionWarning(true);
    } else {
      handleInstall(ext.id);
    }
  };

  const handleInstall = async (id: string) => {
    setInstallingId(id);
    try {
      await installExtension(id);
      await fetchPlugins();
      setShowPermissionWarning(false);
      setPendingInstallId(null);
    } catch (err) {
      console.error('Installation failed:', err);
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = async (id: string) => {
    if (window.confirm('Are you sure you want to uninstall this extension?')) {
      try {
        await uninstallExtension(id);
        await fetchPlugins();
      } catch (err) {
        console.error('Uninstallation failed:', err);
      }
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Extension Marketplace</h2>
          {updates.length > 0 && (
            <div className="px-3 py-1 rounded text-sm bg-blue-500 text-white">
              {updates.length} update{updates.length !== 1 ? 's' : ''} available
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search extensions..."
              className={`flex-1 bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-black'}`}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded bg-synapse-accent text-white hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
          >
            <option value="rating">Top Rated</option>
            <option value="downloads">Most Downloaded</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>

        {error && (
          <div className={`p-2 rounded text-sm mt-2 ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Extension List */}
        <div className={`w-1/3 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading extensions...</div>
          ) : extensions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No extensions found</div>
          ) : (
            <div className="space-y-2 p-4">
              {extensions.map((ext) => (
                <div
                  key={ext.id}
                  onClick={() => setSelectedExt(ext)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedExt?.id === ext.id
                      ? 'bg-synapse-accent text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{ext.name}</div>
                      <div className="text-xs opacity-75">{ext.author}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={12} className="fill-current" />
                      {ext.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extension Details */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedExt ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{selectedExt.name}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedExt.description}
                </p>
              </div>

              {/* Metadata */}
              <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Author:</span> {selectedExt.author}
                  </div>
                  <div>
                    <span className="font-semibold">Version:</span> {selectedExt.version}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-current text-yellow-500" />
                    <span>{selectedExt.rating.toFixed(1)} ({selectedExt.downloadCount.toLocaleString()} downloads)</span>
                  </div>
                  <div>
                    <span className="font-semibold">Updated:</span> {selectedExt.lastUpdated}
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <span className="font-semibold block mb-2">Permissions:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedExt.requiredPermissions.map((perm) => (
                    <span
                      key={perm}
                      className={`px-2 py-1 rounded text-xs ${
                        sensitivePermissions.includes(perm)
                          ? isDarkMode
                            ? 'bg-red-900 text-red-200'
                            : 'bg-red-100 text-red-800'
                          : isDarkMode
                          ? 'bg-green-900 text-green-200'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Compatibility */}
              <div className={`p-3 rounded text-sm ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                Requires Synapse Browser v{selectedExt.minBrowserVersion} or higher
              </div>

              {/* Action Button */}
              <div>
                {isExtensionInstalled(selectedExt.id) ? (
                  <button
                    onClick={() => handleUninstall(selectedExt.id)}
                    className={`w-full px-4 py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? 'bg-red-900 hover:bg-red-800 text-red-200'
                        : 'bg-red-100 hover:bg-red-200 text-red-800'
                    }`}
                  >
                    <Trash2 size={16} />
                    Uninstall
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstallClick(selectedExt)}
                    disabled={installingId === selectedExt.id}
                    className={`w-full px-4 py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2 ${
                      installingId === selectedExt.id
                        ? 'opacity-50 cursor-not-allowed'
                        : isDarkMode
                        ? 'bg-green-900 hover:bg-green-800 text-green-200'
                        : 'bg-green-100 hover:bg-green-200 text-green-800'
                    }`}
                  >
                    <Download size={16} />
                    {installingId === selectedExt.id ? 'Installing...' : 'Install'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select an extension to view details
            </div>
          )}
        </div>
      </div>

      {/* Permission Warning Modal */}
      {showPermissionWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-yellow-500" />
              <h3 className="text-lg font-bold">Permission Warning</h3>
            </div>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              This extension requests sensitive permissions. Please review them carefully before installing.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPermissionWarning(false)}
                className={`flex-1 px-4 py-2 rounded transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => pendingInstallId && handleInstall(pendingInstallId)}
                className="flex-1 px-4 py-2 rounded bg-synapse-accent text-white hover:opacity-90 transition-opacity"
              >
                Install Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
