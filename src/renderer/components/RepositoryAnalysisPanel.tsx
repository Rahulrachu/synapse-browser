import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

interface AnalysisResult {
  architecture: { mermaidCode: string; description: string };
  folderStructure: Record<string, string>;
  entryPoints: Array<{ file: string; type: string; description: string }>;
  apiMap: Array<{ method: string; path: string; handler: string }>;
  todoList: Array<{ file: string; line: number; text: string; priority: string }>;
  riskAnalysis: Array<{
    type: string;
    severity: string;
    description: string;
    suggestion: string;
  }>;
}

export default function RepositoryAnalysisPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'structure' | 'api' | 'todos' | 'risks'
  >('overview');
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electron.ipcRenderer.invoke(
        'analyze-repository'
      );
      if (result && result.analysis) {
        setAnalysis(result.analysis);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze repository';
      setError(errorMessage);
      console.error('Failed to analyze repository:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const downloadReport = async () => {
    if (!analysis) return;

    try {
      await window.electron.ipcRenderer.invoke('download-analysis-report', {
        analysis,
      });
    } catch (err) {
      console.error('Failed to download report:', err);
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
        <h2 className="font-semibold text-sm">Repository Analysis</h2>
        <div className="flex gap-2">
          <button
            onClick={loadAnalysis}
            disabled={isLoading}
            className="p-1 rounded hover:bg-synapse-accent hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={downloadReport}
            disabled={!analysis}
            className="p-1 rounded hover:bg-synapse-accent hover:text-white transition disabled:opacity-50"
          >
            <Download size={16} />
          </button>
        </div>
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
        {(['overview', 'structure', 'api', 'todos', 'risks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition ${
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Analyzing repository...</p>
          </div>
        ) : !analysis ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No analysis available</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div
                  className={`p-3 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <h3 className="font-medium text-sm mb-2">Architecture</h3>
                  <p className="text-xs text-gray-400">
                    {analysis.architecture.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Entry Points</h3>
                  {analysis.entryPoints.map((ep, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-xs ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <p className="font-medium">{ep.file}</p>
                      <p className="text-gray-400">{ep.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structure Tab */}
            {activeTab === 'structure' && (
              <div className="space-y-2">
                {Object.entries(analysis.folderStructure).map(([folder, desc]) => (
                  <div
                    key={folder}
                    className={`p-2 rounded text-xs ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <p className="font-medium">{folder}</p>
                    <p className="text-gray-400">{desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* API Tab */}
            {activeTab === 'api' && (
              <div className="space-y-2">
                {analysis.apiMap.length === 0 ? (
                  <p className="text-gray-400 text-xs">No API endpoints found</p>
                ) : (
                  analysis.apiMap.map((endpoint, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-xs ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-synapse-accent text-white font-mono text-xs">
                          {endpoint.method}
                        </span>
                        <span className="font-mono">{endpoint.path}</span>
                      </div>
                      <p className="text-gray-400 mt-1">{endpoint.handler}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TODOs Tab */}
            {activeTab === 'todos' && (
              <div className="space-y-2">
                {analysis.todoList.length === 0 ? (
                  <p className="text-gray-400 text-xs">No TODOs found</p>
                ) : (
                  analysis.todoList.map((todo, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-xs ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          size={14}
                          className={
                            todo.priority === 'high'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }
                        />
                        <div className="flex-1">
                          <p className="font-mono text-gray-400">
                            {todo.file}:{todo.line}
                          </p>
                          <p className="mt-1">{todo.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Risks Tab */}
            {activeTab === 'risks' && (
              <div className="space-y-2">
                {analysis.riskAnalysis.length === 0 ? (
                  <p className="text-gray-400 text-xs">No risks detected</p>
                ) : (
                  analysis.riskAnalysis.map((risk, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-xs ${
                        risk.severity === 'critical'
                          ? isDarkMode
                            ? 'bg-red-900 bg-opacity-30'
                            : 'bg-red-100'
                          : isDarkMode
                            ? 'bg-yellow-900 bg-opacity-30'
                            : 'bg-yellow-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={14}
                          className={
                            risk.severity === 'critical'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {risk.type} ({risk.severity})
                          </p>
                          <p className="text-gray-400 mt-1">{risk.description}</p>
                          <p className="text-gray-500 mt-1">
                            💡 {risk.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
