import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Diagnostic {
  id: string;
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  source: 'linter' | 'compiler' | 'ai' | 'test';
}

export default function DiagnosticsPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<Diagnostic | null>(null);
  const [filterBySeverity, setFilterBySeverity] = useState<string | null>(null);
  const [filterBySource, setFilterBySource] = useState<string | null>(null);

  // Load diagnostics
  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('get-diagnostics');
      if (result && result.diagnostics) {
        setDiagnostics(result.diagnostics);
      }
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    }
  };

  const filteredDiagnostics = diagnostics.filter((d) => {
    const matchesSeverity = !filterBySeverity || d.severity === filterBySeverity;
    const matchesSource = !filterBySource || d.source === filterBySource;
    return matchesSeverity && matchesSource;
  });

  const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
  const infoCount = diagnostics.filter((d) => d.severity === 'info').length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      default:
        return <CheckCircle size={16} className="text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return isDarkMode ? 'bg-red-900 bg-opacity-30' : 'bg-red-100';
      case 'warning':
        return isDarkMode ? 'bg-yellow-900 bg-opacity-30' : 'bg-yellow-100';
      case 'info':
        return isDarkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-100';
      default:
        return isDarkMode ? 'bg-green-900 bg-opacity-30' : 'bg-green-100';
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
        <h2 className="font-semibold text-sm">Diagnostics</h2>
        <button
          onClick={loadDiagnostics}
          className="p-1 rounded hover:bg-synapse-accent hover:text-white transition"
        >
          ↻
        </button>
      </div>

      {/* Statistics */}
      <div
        className={`flex gap-4 px-4 py-3 border-b text-sm ${
          isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-1">
          <AlertCircle size={14} className="text-red-500" />
          <span className="text-red-500 font-medium">{errorCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle size={14} className="text-yellow-500" />
          <span className="text-yellow-500 font-medium">{warningCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <Info size={14} className="text-blue-500" />
          <span className="text-blue-500 font-medium">{infoCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-gray-700 space-y-2">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterBySeverity(null)}
            className={`px-2 py-1 rounded text-xs transition ${
              filterBySeverity === null
                ? 'bg-synapse-accent text-white'
                : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {['error', 'warning', 'info'].map((severity) => (
            <button
              key={severity}
              onClick={() => setFilterBySeverity(severity)}
              className={`px-2 py-1 rounded text-xs transition capitalize ${
                filterBySeverity === severity
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {severity}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterBySource(null)}
            className={`px-2 py-1 rounded text-xs transition ${
              filterBySource === null
                ? 'bg-synapse-accent text-white'
                : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All Sources
          </button>
          {['linter', 'compiler', 'ai', 'test'].map((source) => (
            <button
              key={source}
              onClick={() => setFilterBySource(source)}
              className={`px-2 py-1 rounded text-xs transition capitalize ${
                filterBySource === source
                  ? 'bg-synapse-accent text-white'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="flex-1 overflow-y-auto">
        {filteredDiagnostics.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No diagnostics</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredDiagnostics.map((diagnostic) => (
              <button
                key={diagnostic.id}
                onClick={() => setSelectedDiagnostic(diagnostic)}
                className={`w-full text-left px-4 py-3 transition ${
                  selectedDiagnostic?.id === diagnostic.id
                    ? getSeverityColor(diagnostic.severity)
                    : isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(diagnostic.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {diagnostic.message}
                      </p>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 flex-shrink-0">
                        {diagnostic.source}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {diagnostic.file}:{diagnostic.line}:{diagnostic.column}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedDiagnostic && (
        <div
          className={`border-t ${
            isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
          } p-3 max-h-40 overflow-y-auto`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm">Details</h3>
            <button
              onClick={() => setSelectedDiagnostic(null)}
              className="p-1 rounded hover:bg-gray-700 transition"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-sm mb-2">{selectedDiagnostic.message}</p>
          {selectedDiagnostic.suggestion && (
            <div
              className={`px-3 py-2 rounded text-sm ${
                isDarkMode
                  ? 'bg-blue-900 bg-opacity-30 text-blue-300'
                  : 'bg-blue-100 text-blue-900'
              }`}
            >
              <p className="font-medium text-xs mb-1">Suggestion:</p>
              <p>{selectedDiagnostic.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
