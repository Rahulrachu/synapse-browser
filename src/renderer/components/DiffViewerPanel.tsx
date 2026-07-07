import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
}

interface DiffViewerPanelProps {
  filePath?: string;
  fromVersion?: string;
  toVersion?: string;
}

export default function DiffViewerPanel({
  filePath,
  fromVersion,
  toVersion,
}: DiffViewerPanelProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );

  // Load diff on mount
  useEffect(() => {
    if (filePath && fromVersion && toVersion) {
      loadDiff();
    }
  }, [filePath, fromVersion, toVersion]);

  const loadDiff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'git-diff',
        {
          filePath,
          fromCommit: fromVersion,
          toCommit: toVersion,
        }
      );

      if (result && result.diff) {
        parseDiff(result.diff);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load diff';
      setError(errorMessage);
      console.error('Failed to load diff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const parseDiff = (diffText: string) => {
    const lines: DiffLine[] = [];
    const diffLines = diffText.split('\n');

    diffLines.forEach((line) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        lines.push({
          type: 'add',
          content: line.substring(1),
        });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        lines.push({
          type: 'remove',
          content: line.substring(1),
        });
      } else if (!line.startsWith('@@')) {
        lines.push({
          type: 'context',
          content: line,
        });
      }
    });

    setDiffLines(lines);
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
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
        <h2 className="font-semibold text-sm">Diff Viewer</h2>
        <div className="flex gap-2 text-xs text-gray-400">
          {fromVersion && <span>{fromVersion}</span>}
          {toVersion && (
            <>
              <span>→</span>
              <span>{toVersion}</span>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-100 border-b border-red-300">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Diff Content */}
      <div
        className={`flex-1 overflow-y-auto font-mono text-sm ${
          isDarkMode ? 'bg-synapse-dark' : 'bg-white'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Loading diff...</p>
          </div>
        ) : diffLines.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No differences found</p>
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {diffLines.map((line, index) => (
              <div
                key={index}
                className={`px-2 py-0.5 ${
                  line.type === 'add'
                    ? isDarkMode
                      ? 'bg-green-900 bg-opacity-30 text-green-400'
                      : 'bg-green-100 text-green-800'
                    : line.type === 'remove'
                      ? isDarkMode
                        ? 'bg-red-900 bg-opacity-30 text-red-400'
                        : 'bg-red-100 text-red-800'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-600'
                }`}
              >
                <span className="inline-block w-6 text-right mr-2">
                  {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                </span>
                <span className="break-all">{line.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      {diffLines.length > 0 && (
        <div
          className={`border-t ${
            isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-200 bg-gray-50'
          } px-4 py-2 text-xs text-gray-400`}
        >
          <span className="text-green-400">
            +{diffLines.filter((l) => l.type === 'add').length}
          </span>
          <span className="mx-2">|</span>
          <span className="text-red-400">
            -{diffLines.filter((l) => l.type === 'remove').length}
          </span>
        </div>
      )}
    </div>
  );
}
