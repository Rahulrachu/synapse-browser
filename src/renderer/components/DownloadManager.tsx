import React, { useEffect } from 'react';
import { 
  Download, 
  Pause, 
  Play, 
  X, 
  RotateCcw, 
  FolderOpen, 
  File, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useDownloadStore } from '../store/downloadStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { DownloadStatus } from '../types/download';

export default function DownloadManager() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { 
    downloads, 
    clearCompleted, 
    pauseDownload, 
    resumeDownload, 
    cancelDownload, 
    retryDownload,
    openFile,
    openFolder,
    addDownload,
    updateDownload
  } = useDownloadStore();

  useEffect(() => {
    // Listen for download events from main process
    const handleStarted = (_event: any, download: any) => {
      addDownload({
        id: download.id,
        filename: download.filename,
        url: download.url,
        path: download.path,
        size: download.size,
        receivedBytes: download.receivedBytes,
        status: 'downloading',
        startTime: download.startTime
      });
    };

    const handleUpdated = (_event: any, download: any) => {
      let status: DownloadStatus = 'downloading';
      if (download.state === 'completed') status = 'completed';
      else if (download.state === 'cancelled') status = 'cancelled';
      else if (download.state === 'interrupted') status = 'failed';
      
      updateDownload(download.id, {
        receivedBytes: download.receivedBytes,
        status,
        endTime: download.endTime
      });
    };

    (window as any).electron.ipcRenderer.on('download-started', handleStarted);
    (window as any).electron.ipcRenderer.on('download-updated', handleUpdated);

    return () => {
      (window as any).electron.ipcRenderer.removeListener('download-started', handleStarted);
      (window as any).electron.ipcRenderer.removeListener('download-updated', handleUpdated);
    };
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatSize(bytesPerSecond) + '/s';
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === Infinity) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s remaining`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m remaining`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h remaining`;
  };

  const getStatusIcon = (status: DownloadStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'failed': return <AlertCircle className="text-red-500" size={18} />;
      case 'cancelled': return <X className="text-gray-500" size={18} />;
      case 'paused': return <Pause className="text-yellow-500" size={18} />;
      default: return <Download className="text-blue-500 animate-pulse" size={18} />;
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border ${
      isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
    } overflow-hidden`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${
        isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <Download size={18} />
          <h2 className="text-lg font-bold">Downloads</h2>
        </div>
        <button 
          onClick={clearCompleted}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition" 
          title="Clear completed"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {downloads.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Download size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No downloads</p>
            <p className="text-xs">Files you download will appear here.</p>
          </div>
        ) : (
          downloads.map((item) => (
            <div 
              key={item.id}
              className={`p-3 rounded-lg border transition ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0">
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold truncate" title={item.filename}>
                      {item.filename}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.status === 'downloading' && (
                        <button onClick={() => pauseDownload(item.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                          <Pause size={14} />
                        </button>
                      )}
                      {item.status === 'paused' && (
                        <button onClick={() => resumeDownload(item.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                          <Play size={14} />
                        </button>
                      )}
                      {(item.status === 'downloading' || item.status === 'paused') && (
                        <button onClick={() => cancelDownload(item.id)} className="p-1 rounded hover:bg-red-500/20 text-red-500">
                          <X size={14} />
                        </button>
                      )}
                      {item.status === 'failed' && (
                        <button onClick={() => retryDownload(item.id)} className="p-1 rounded hover:bg-blue-500/20 text-blue-500">
                          <RotateCcw size={14} />
                        </button>
                      )}
                      {item.status === 'completed' && (
                        <>
                          <button onClick={() => openFile(item.path)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Open file">
                            <File size={14} />
                          </button>
                          <button onClick={() => openFolder(item.path)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Open folder">
                            <FolderOpen size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(item.status === 'downloading' || item.status === 'paused') && (
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${item.status === 'paused' ? 'bg-yellow-500' : 'bg-synapse-accent'}`}
                          style={{ width: `${(item.receivedBytes / item.size) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatSize(item.receivedBytes)} of {formatSize(item.size)}
                        </span>
                        <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.status === 'paused' ? 'Paused' : formatSpeed(item.speed)}
                        </span>
                      </div>
                      {item.status === 'downloading' && (
                        <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          <Clock size={10} />
                          {formatTime(item.remainingTime || 0)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completed/Failed Stats */}
                  {(item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatSize(item.size)} • {new Date(item.startTime).toLocaleDateString()}
                      </span>
                      <span className={`text-[10px] font-medium ${
                        item.status === 'completed' ? 'text-green-500' : 
                        item.status === 'failed' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className={`text-[10px] mt-1 truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {item.url}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
