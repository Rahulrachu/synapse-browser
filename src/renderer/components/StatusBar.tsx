import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Bell, 
  Download, 
  GitBranch, 
  Zap,
  Clock,
  Layout,
  Circle
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useBrowserStore } from '../store/browserStore';
import { useDownloadStore } from '../store/downloadStore';
import { useNotificationStore } from '../store/notificationStore';
import { useWorkspaceTemplateStore } from '../store/workspaceTemplateStore';

export default function StatusBar() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const tabs = useBrowserStore((state) => state.tabs);
  const activeDownloads = useDownloadStore((state) => state.activeCount);
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  const { templates, defaultTemplateId } = useWorkspaceTemplateStore();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiStatus, setAiStatus] = useState<'idle' | 'running'>('idle');
  const [gitBranch, setGitBranch] = useState('master');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Simulate AI status check or listen to a real store if available
    const aiCheck = setInterval(() => {
      // Logic to check if any AI agent is currently working
      // For now we'll keep it simple
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(aiCheck);
    };
  }, []);

  const currentWorkspaceName = templates.find(t => t.id === defaultTemplateId)?.name || 'Default';

  const StatusItem = ({ icon: Icon, label, value, color, onClick }: any) => (
    <div 
      className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium transition cursor-default ${
        isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
      }`}
      onClick={onClick}
    >
      <Icon size={12} className={color} />
      <span>{label}: <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>{value}</span></span>
    </div>
  );

  return (
    <div className={`h-7 flex items-center justify-between px-2 border-t select-none ${
      isDarkMode ? 'bg-synapse-darker border-gray-800' : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Left Section */}
      <div className="flex items-center divide-x divide-gray-200 dark:divide-gray-800">
        <StatusItem 
          icon={Layout} 
          label="Workspace" 
          value={currentWorkspaceName} 
          color="text-synapse-accent" 
        />
        <StatusItem 
          icon={Globe} 
          label="Tabs" 
          value={tabs.length} 
          color="text-blue-500" 
        />
        <StatusItem 
          icon={GitBranch} 
          label="Branch" 
          value={gitBranch} 
          color="text-orange-500" 
        />
      </div>

      {/* Middle Section - AI Status */}
      <div className="flex items-center gap-2 px-3">
        <div className="flex items-center gap-1.5">
          <Circle size={8} className={aiStatus === 'running' ? 'fill-green-500 text-green-500 animate-pulse' : 'fill-gray-400 text-gray-400'} />
          <span className={`text-[10px] font-bold uppercase tracking-tighter ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            AI {aiStatus === 'running' ? 'Processing' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center divide-x divide-gray-200 dark:divide-gray-800">
        <div className="flex items-center px-2 gap-3">
          {activeDownloads > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-synapse-accent animate-pulse">
              <Download size={12} />
              <span className="font-bold">{activeDownloads}</span>
            </div>
          )}
          {unreadNotifications > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-yellow-500">
              <Bell size={12} />
              <span className="font-bold">{unreadNotifications}</span>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Clock size={12} />
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
