import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Trash2, Plus } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function SessionManagerPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { tabs, sessions, saveSession, restoreSession, deleteSession } = useBrowserStore();
  const [sessionName, setSessionName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleSaveSession = async () => {
    if (sessionName.trim()) {
      try {
        await (window as any).electron.ipcRenderer.invoke(
          'save-session',
          sessionName,
          tabs
        );
        saveSession(sessionName, tabs);
        setSessionName('');
        setShowSaveForm(false);
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  const handleRestoreSession = async (sessionId: string) => {
    try {
      const session = await (window as any).electron.ipcRenderer.invoke(
        'get-session',
        sessionId
      );
      if (session) {
        restoreSession(sessionId);
        // Restore each tab
        for (const tab of session.tabs) {
          await (window as any).electron.ipcRenderer.invoke('create-tab', tab.url);
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await (window as any).electron.ipcRenderer.invoke('delete-session', sessionId);
      deleteSession(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
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
        <h2 className="text-lg font-bold">Sessions</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Save Current Session */}
        {!showSaveForm ? (
          <button
            onClick={() => setShowSaveForm(true)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition mb-4 ${
              isDarkMode
                ? 'bg-synapse-accent hover:bg-synapse-accent-light text-white'
                : 'bg-synapse-accent hover:bg-synapse-accent-light text-white'
            }`}
          >
            <Save size={18} />
            Save Current Session
          </button>
        ) : (
          <div
            className={`p-3 rounded-lg mb-4 border ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
            }`}
          >
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Session name..."
              className={`w-full px-3 py-2 rounded border mb-2 ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveSession}
                className="flex-1 px-3 py-1 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setSessionName('');
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

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No saved sessions yet</p>
            <p className="text-sm mt-2">Save your current tabs as a session to restore them later</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg border transition ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-750'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{session.name}</h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {session.tabs.length} tabs • {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Tab Preview */}
                <div className="mb-2 space-y-1">
                  {session.tabs.slice(0, 3).map((tab, idx) => (
                    <div
                      key={idx}
                      className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      • {tab.title || tab.url}
                    </div>
                  ))}
                  {session.tabs.length > 3 && (
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      +{session.tabs.length - 3} more
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestoreSession(session.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition text-xs"
                  >
                    <RotateCcw size={14} />
                    Restore
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className={`px-2 py-1 rounded transition text-xs ${
                      isDarkMode
                        ? 'bg-red-900 hover:bg-red-800 text-red-200'
                        : 'bg-red-100 hover:bg-red-200 text-red-900'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
