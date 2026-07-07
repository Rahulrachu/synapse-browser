import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  uncommitted: number;
  untracked: number;
}

interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

interface GitBranchInfo {
  name: string;
  isActive: boolean;
  lastCommit: string;
}

export default function GitPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<GitBranchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'commits' | 'branches'>(
    'status'
  );
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');

  // Load git data
  useEffect(() => {
    loadGitData();
  }, []);

  const loadGitData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statusResult, commitsResult, branchesResult] = await Promise.all([
        window.electron.ipcRenderer.invoke('get-git-status'),
        window.electron.ipcRenderer.invoke('get-git-commits'),
        window.electron.ipcRenderer.invoke('get-git-branches'),
      ]);

      if (statusResult) setStatus(statusResult);
      if (commitsResult) setCommits(commitsResult);
      if (branchesResult) setBranches(branchesResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load git data';
      setError(errorMessage);
      console.error('Failed to load git data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    try {
      await window.electron.ipcRenderer.invoke('git-commit', {
        message: commitMessage,
      });
      setCommitMessage('');
      await loadGitData();
    } catch (err) {
      console.error('Failed to commit:', err);
      setError('Failed to create commit');
    }
  };

  const handlePush = async () => {
    try {
      await window.electron.ipcRenderer.invoke('git-push');
      await loadGitData();
    } catch (err) {
      console.error('Failed to push:', err);
      setError('Failed to push changes');
    }
  };

  const handlePull = async () => {
    try {
      await window.electron.ipcRenderer.invoke('git-pull');
      await loadGitData();
    } catch (err) {
      console.error('Failed to pull:', err);
      setError('Failed to pull changes');
    }
  };

  const handleCreateBranch = async () => {
    const branchName = prompt('Enter branch name:');
    if (!branchName) return;

    try {
      await window.electron.ipcRenderer.invoke('git-create-branch', {
        name: branchName,
      });
      await loadGitData();
    } catch (err) {
      console.error('Failed to create branch:', err);
      setError('Failed to create branch');
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    try {
      await window.electron.ipcRenderer.invoke('git-switch-branch', {
        name: branchName,
      });
      await loadGitData();
    } catch (err) {
      console.error('Failed to switch branch:', err);
      setError('Failed to switch branch');
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
        className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <GitBranch size={18} />
          <h2 className="font-semibold text-sm">Git</h2>
        </div>
        <button
          onClick={loadGitData}
          disabled={isLoading}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 border-b border-red-300">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div
        className={`flex border-b ${
          isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
        }`}
      >
        {(['status', 'commits', 'branches'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? isDarkMode
                  ? 'border-b-2 border-synapse-accent text-synapse-accent'
                  : 'border-b-2 border-blue-500 text-blue-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Status Tab */}
        {activeTab === 'status' && (
          <div className="p-4 space-y-4">
            {status ? (
              <>
                <div
                  className={`p-3 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <p className="text-sm font-medium mb-2">Current Branch</p>
                  <p className="text-lg font-bold text-synapse-accent">
                    {status.branch}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`p-3 rounded text-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <p className="text-xs text-gray-400">Ahead</p>
                    <p className="text-lg font-bold text-green-400">
                      {status.ahead}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded text-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <p className="text-xs text-gray-400">Behind</p>
                    <p className="text-lg font-bold text-red-400">
                      {status.behind}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded text-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <p className="text-xs text-gray-400">Uncommitted</p>
                    <p className="text-lg font-bold text-yellow-400">
                      {status.uncommitted}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded text-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <p className="text-xs text-gray-400">Untracked</p>
                    <p className="text-lg font-bold text-blue-400">
                      {status.untracked}
                    </p>
                  </div>
                </div>

                {/* Commit Section */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick Commit</p>
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Commit message..."
                    className={`w-full px-3 py-2 rounded border text-sm resize-none ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCommit}
                      className="flex-1 px-3 py-2 bg-synapse-accent text-white rounded text-sm hover:bg-synapse-accent-light transition"
                    >
                      Commit
                    </button>
                    <button
                      onClick={handlePush}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                    >
                      Push
                    </button>
                    <button
                      onClick={handlePull}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                    >
                      Pull
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">No git status available</p>
            )}
          </div>
        )}

        {/* Commits Tab */}
        {activeTab === 'commits' && (
          <div className="divide-y divide-gray-700">
            {commits.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm">No commits found</div>
            ) : (
              commits.map((commit) => (
                <button
                  key={commit.hash}
                  onClick={() =>
                    setExpandedCommit(
                      expandedCommit === commit.hash ? null : commit.hash
                    )
                  }
                  className={`w-full text-left px-4 py-3 transition ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {expandedCommit === commit.hash ? (
                      <ChevronDown size={16} className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight size={16} className="flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {commit.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {commit.author} · {commit.date}
                      </p>
                      {expandedCommit === commit.hash && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <code className="text-xs text-gray-300 break-all">
                            {commit.hash}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <div className="p-4 space-y-2">
            <button
              onClick={handleCreateBranch}
              className="w-full px-3 py-2 bg-synapse-accent text-white rounded text-sm hover:bg-synapse-accent-light transition flex items-center justify-center gap-2 mb-4"
            >
              <Plus size={16} />
              New Branch
            </button>

            <div className="space-y-1">
              {branches.length === 0 ? (
                <p className="text-gray-400 text-sm">No branches found</p>
              ) : (
                branches.map((branch) => (
                  <button
                    key={branch.name}
                    onClick={() => handleSwitchBranch(branch.name)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      branch.isActive
                        ? isDarkMode
                          ? 'bg-synapse-accent text-white'
                          : 'bg-blue-100 text-blue-900'
                        : isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch size={14} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {branch.name}
                          {branch.isActive && (
                            <span className="ml-2 text-xs">✓</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {branch.lastCommit}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
