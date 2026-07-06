import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { useWorkspaceStore } from '../store/workspaceStore';

const GROUP_COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
];

export default function TabGroupsPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { tabs, tabGroups, createGroup, deleteGroup, addTabToGroup, removeTabFromGroup } =
    useBrowserStore();
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0].value);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      try {
        await (window as any).electron.ipcRenderer.invoke(
          'create-tab-group',
          newGroupName,
          newGroupColor
        );
        createGroup(newGroupName, newGroupColor);
        setNewGroupName('');
        setNewGroupColor(GROUP_COLORS[0].value);
        setShowNewGroupForm(false);
      } catch (error) {
        console.error('Failed to create group:', error);
      }
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('delete-tab-group', groupId);
      deleteGroup(groupId);
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleAddTabToGroup = async (tabId: string, groupId: string) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('add-tab-to-group', tabId, groupId);
      addTabToGroup(tabId, groupId);
    } catch (error) {
      console.error('Failed to add tab to group:', error);
    }
  };

  const handleRemoveTabFromGroup = async (tabId: string) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('remove-tab-from-group', tabId);
      removeTabFromGroup(tabId);
    } catch (error) {
      console.error('Failed to remove tab from group:', error);
    }
  };

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const ungroupedTabs = tabs.filter(t => !t.groupId);

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
        <h2 className="text-lg font-bold">Tab Groups</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* New Group Form */}
        {!showNewGroupForm ? (
          <button
            onClick={() => setShowNewGroupForm(true)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition mb-4 ${
              isDarkMode
                ? 'bg-synapse-accent hover:bg-synapse-accent-light text-white'
                : 'bg-synapse-accent hover:bg-synapse-accent-light text-white'
            }`}
          >
            <Plus size={18} />
            New Group
          </button>
        ) : (
          <div
            className={`p-3 rounded-lg mb-4 border ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
            }`}
          >
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className={`w-full px-3 py-2 rounded border mb-2 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              autoFocus
            />
            <div className="mb-2">
              <label className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Color
              </label>
              <div className="grid grid-cols-7 gap-1">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewGroupColor(color.value)}
                    className={`w-6 h-6 rounded transition ${
                      newGroupColor === color.value ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateGroup}
                className="flex-1 px-3 py-1 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition text-sm"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewGroupForm(false);
                  setNewGroupName('');
                  setNewGroupColor(GROUP_COLORS[0].value);
                }}
                className={`flex-1 px-3 py-1 rounded transition text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Groups List */}
        {tabGroups.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No tab groups yet</p>
            <p className="text-sm mt-2">Create a group to organize your tabs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tabGroups.map((group) => {
              const groupTabs = tabs.filter(t => t.groupId === group.id);
              const isExpanded = expandedGroups.has(group.id);

              return (
                <div
                  key={group.id}
                  className={`rounded-lg border overflow-hidden ${
                    isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Group Header */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      onClick={() => toggleGroupExpanded(group.id)}
                      className="p-0.5 hover:bg-gray-600 rounded transition"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-semibold text-sm flex-1">{group.name}</span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {groupTabs.length}
                    </span>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-0.5 hover:bg-red-500 rounded transition"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Group Tabs */}
                  {isExpanded && groupTabs.length > 0 && (
                    <div
                      className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-2 space-y-1`}
                    >
                      {groupTabs.map((tab) => (
                        <div
                          key={tab.id}
                          className={`flex items-center gap-2 px-2 py-1 rounded text-xs truncate ${
                            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
                          }`}
                        >
                          <span className="flex-1 truncate">{tab.title}</span>
                          <button
                            onClick={() => handleRemoveTabFromGroup(tab.id)}
                            className="p-0.5 hover:bg-red-500 rounded transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Ungrouped Tabs */}
        {ungroupedTabs.length > 0 && (
          <div className="mt-4">
            <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Ungrouped Tabs ({ungroupedTabs.length})
            </h3>
            <div className="space-y-1">
              {ungroupedTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center justify-between px-2 py-1 rounded text-xs truncate ${
                    isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="flex-1 truncate">{tab.title}</span>
                  {tabGroups.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddTabToGroup(tab.id, e.target.value);
                        }
                      }}
                      className={`text-xs px-1 py-0.5 rounded ${
                        isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none`}
                      defaultValue=""
                    >
                      <option value="">Add to group</option>
                      {tabGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
