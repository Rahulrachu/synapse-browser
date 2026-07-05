import React, { useState } from 'react';
import { GitBranch, GitCommit, Plus, Send } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface GitLog {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export default function GitPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [branch, setBranch] = useState('main');
  const [branches, setBranches] = useState(['main', 'develop', 'feature/ai-workspace']);
  const [commitMessage, setCommitMessage] = useState('');
  const [gitLog, setGitLog] = useState<GitLog[]>([
    {
      hash: 'a1b2c3d',
      message: 'Add AI workspace panel',
      author: 'Developer',
      date: '2 hours ago',
    },
    {
      hash: 'e4f5g6h',
      message: 'Implement session manager',
      author: 'Developer',
      date: '5 hours ago',
    },
  ]);

  const handleCommit = () => {
    if (commitMessage.trim()) {
      setGitLog([
        {
          hash: Math.random().toString(36).substring(7),
          message: commitMessage,
          author: 'Developer',
          date: 'just now',
        },
        ...gitLog,
      ]);
      setCommitMessage('');
    }
  };

  return (
    <div className={`flex-1 flex flex-col rounded-lg border ${isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="font-semibold flex items-center gap-2">
          <GitBranch size={18} />
          Git
        </h2>
      </div>

      {/* Branch Selector */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className="text-sm font-semibold mb-2">Current Branch</p>
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className={`w-full px-3 py-2 rounded border ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-gray-100 border-gray-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
        >
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Commit Section */}
      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className="text-sm font-semibold mb-2">Commit</p>
        <div className="flex gap-2">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            rows={2}
            className={`flex-1 px-3 py-2 rounded border resize-none ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-synapse-accent`}
          />
          <button
            onClick={handleCommit}
            className="px-3 py-2 bg-synapse-accent text-white rounded hover:bg-synapse-accent-light transition h-fit"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Git Log */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <GitCommit size={16} />
            Recent Commits
          </p>
          <div className="space-y-2">
            {gitLog.map((commit) => (
              <div
                key={commit.hash}
                className={`p-3 rounded border ${
                  isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-300 bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-synapse-accent mb-1">{commit.hash}</p>
                    <p className="text-sm truncate">{commit.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {commit.author} • {commit.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
