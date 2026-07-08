import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { usePermissionStore } from '../store/permissionStore';
import { Permission, PermissionHistoryEntry } from '../../common/types/permission';
import { Lock, Check, X, Clock, Trash2 } from 'lucide-react';

export default function PermissionManagerPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { permissions, history, isLoading, error, fetchPermissions, fetchHistory, updatePermission } = usePermissionStore();
  
  const [activeTab, setActiveTab] = useState<'permissions' | 'history'>('permissions');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  useEffect(() => {
    fetchPermissions();
    fetchHistory();
  }, []);

  const handleStateChange = async (permission: Permission, newState: any) => {
    await updatePermission({ ...permission, state: newState });
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'granted':
        return <Check size={16} className="text-green-500" />;
      case 'denied':
        return <X size={16} className="text-red-500" />;
      case 'temporary':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'granted':
        return isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
      case 'denied':
        return isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
      case 'requested':
        return isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800';
      default:
        return isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <h2 className="text-lg font-bold mb-4">Permission Manager</h2>
        
        {error && (
          <div className={`p-2 rounded text-sm mb-4 ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
              activeTab === 'permissions'
                ? 'bg-synapse-accent text-white'
                : isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Permissions
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
              activeTab === 'history'
                ? 'bg-synapse-accent text-white'
                : isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'permissions' ? (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading permissions...</div>
            ) : permissions.length === 0 ? (
              <div className="text-center text-gray-500">No permissions granted yet</div>
            ) : (
              <div className="space-y-3">
                {permissions.map((perm) => (
                  <div
                    key={`${perm.scope}:${perm.resource}`}
                    onClick={() => setSelectedPermission(perm)}
                    className={`p-4 rounded cursor-pointer transition-colors ${
                      selectedPermission?.id === perm.id
                        ? 'bg-synapse-accent text-white'
                        : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{perm.resource}</div>
                        <div className="text-xs opacity-75">{perm.scope}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStateIcon(perm.state)}
                        <span className="text-xs font-semibold">{perm.state}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPermission && (
              <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Change Permission State</h3>
                  <div className="flex gap-2">
                    {(['granted', 'denied', 'ask', 'temporary'] as const).map((state) => (
                      <button
                        key={state}
                        onClick={() => handleStateChange(selectedPermission, state)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          selectedPermission.state === state
                            ? 'bg-synapse-accent text-white'
                            : isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-500'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPermission.grantedAt && (
                  <div className="text-xs opacity-75">
                    Granted: {new Date(selectedPermission.grantedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-gray-500">No permission history</div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded text-sm ${getActionColor(entry.action)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{entry.resource}</div>
                      <div className="text-xs opacity-75">{entry.scope}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold capitalize">{entry.action}</div>
                      <div className="text-xs opacity-75">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
