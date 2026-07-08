import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { 
  Play, 
  Pause, 
  X, 
  RefreshCcw, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Database, 
  Filter, 
  Search 
} from 'lucide-react';
import { Job, JobStatus } from '../../common/types/job';

export default function TaskQueuePanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    try {
      const filter: any = {};
      if (filterStatus !== 'all') {
        filter.status = filterStatus;
      }
      if (searchQuery) {
        filter.name = searchQuery;
      }
      const fetchedJobs = await window.electron.invoke('task-queue:get-all', filter);
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  useEffect(() => {
    fetchJobs();

    const handleJobUpdate = () => {
      fetchJobs();
    };

    window.electron.on('job:updated', handleJobUpdate);
    window.electron.on('job:queued', handleJobUpdate);
    window.electron.on('job:running', handleJobUpdate);
    window.electron.on('job:completed', handleJobUpdate);
    window.electron.on('job:failed', handleJobUpdate);
    window.electron.on('job:cancelled', handleJobUpdate);

    return () => {
      window.electron.removeListener('job:updated', handleJobUpdate);
      window.electron.removeListener('job:queued', handleJobUpdate);
      window.electron.removeListener('job:running', handleJobUpdate);
      window.electron.removeListener('job:completed', handleJobUpdate);
      window.electron.removeListener('job:failed', handleJobUpdate);
      window.electron.removeListener('job:cancelled', handleJobUpdate);
    };
  }, [filterStatus, searchQuery]);

  const handleCancel = async (id: string) => {
    await window.electron.invoke('task-queue:cancel', id);
  };

  const handlePause = async (id: string) => {
    await window.electron.invoke('task-queue:pause', id);
  };

  const handleResume = async (id: string) => {
    await window.electron.invoke('task-queue:resume', id);
  };

  const handleClearCompleted = async () => {
    if (confirm('Are you sure you want to clear all completed jobs?')) {
      await window.electron.invoke('task-queue:clear-completed');
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'queued': return <Clock size={14} className="text-gray-500" />;
      case 'running': return <Play size={14} className="text-blue-500" />;
      case 'completed': return <CheckCircle2 size={14} className="text-green-500" />;
      case 'failed': return <AlertCircle size={14} className="text-red-500" />;
      case 'cancelled': return <X size={14} className="text-yellow-500" />;
      case 'paused': return <Pause size={14} className="text-orange-500" />;
      default: return <Info size={14} className="text-gray-500" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (ms === undefined) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Task Queue</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleClearCompleted}
              title="Clear Completed Jobs"
              className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-red-500`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchJobs()}
              placeholder="Search jobs..."
              className={`flex-1 bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-black'}`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as JobStatus | 'all')}
            className={`px-3 py-2 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
          >
            <option value="all">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="paused">Paused</option>
          </select>
          <button
            onClick={fetchJobs}
            className="px-4 py-2 rounded bg-synapse-accent text-white hover:opacity-90 transition-opacity"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Job List */}
        <div className={`w-1/3 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {jobs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No jobs found</div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-3 cursor-pointer transition-colors ${
                    selectedJob?.id === job.id
                      ? 'bg-synapse-accent/20 border-l-4 border-synapse-accent'
                      : isDarkMode
                      ? 'hover:bg-gray-700/50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      {getStatusIcon(job.status)}
                      <span className={`uppercase ${job.status === 'failed' ? 'text-red-400' : ''}`}>{job.status}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDuration(job.duration)}</span>
                  </div>
                  <div className={`text-sm font-medium line-clamp-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {job.name}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {job.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedJob ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(selectedJob.status)}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedJob.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedJob.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{selectedJob.name}</h3>
                </div>
                <div className="flex gap-2">
                  {selectedJob.status === 'queued' || selectedJob.status === 'running' || selectedJob.status === 'paused' ? (
                    <button 
                      onClick={() => handleCancel(selectedJob.id)}
                      className="p-2 rounded text-red-500 hover:bg-red-500/10"
                      title="Cancel Job"
                    >
                      <X size={18} />
                    </button>
                  ) : null}
                  {selectedJob.status === 'running' ? (
                    <button 
                      onClick={() => handlePause(selectedJob.id)}
                      className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      title="Pause Job"
                    >
                      <Pause size={18} />
                    </button>
                  ) : null}
                  {selectedJob.status === 'paused' || selectedJob.status === 'failed' ? (
                    <button 
                      onClick={() => handleResume(selectedJob.id)}
                      className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      title="Resume Job"
                    >
                      <Play size={18} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Type: {selectedJob.type}
                </p>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Progress: {selectedJob.progress}%
                </p>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Duration: {formatDuration(selectedJob.duration)}
                </p>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Retries: {selectedJob.retries}/{selectedJob.maxRetries}
                </p>
                {selectedJob.error && (
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap text-red-400`}>
                    Error: {selectedJob.error}
                  </p>
                )}
                {selectedJob.result && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Result</h4>
                    <pre className={`p-2 rounded text-xs overflow-x-auto ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {JSON.stringify(selectedJob.result, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Payload</h4>
                  <pre className={`p-2 rounded text-xs overflow-x-auto ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {JSON.stringify(selectedJob.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <div className={`p-6 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Database size={48} className="opacity-20" />
              </div>
              <p>Select a job to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
