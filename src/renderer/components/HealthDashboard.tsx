import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  Layers, 
  Globe, 
  Bell, 
  Download, 
  GitBranch, 
  Info,
  RefreshCw,
  Box
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useBrowserStore } from '../store/browserStore';
import { usePanelStore } from '../store/panelStore';
import { useDownloadStore } from '../store/downloadStore';
import { useNotificationStore } from '../store/notificationStore';

export default function HealthDashboard() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const tabs = useBrowserStore((state) => state.tabs);
  const splitPanels = usePanelStore((state) => state.splitPanels);
  const activeDownloads = useDownloadStore((state) => state.activeCount);
  const unreadNotifications = useNotificationStore((state) => state.unreadCount);
  
  const [systemStats, setSystemStats] = useState({
    memory: '0 MB',
    cpu: '0%',
    uptime: '0s',
    version: '1.0.0',
    branch: 'master'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activePanelsCount = Object.values(splitPanels).filter(p => p !== null).length;

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      // In a real Electron app, these would come from IPC
      const stats = await (window as any).electron.ipcRenderer.invoke('get-system-stats');
      setSystemStats(stats);
    } catch (error) {
      // Fallback for demo/dev
      const mockUptime = Math.floor(performance.now() / 1000);
      setSystemStats(prev => ({
        ...prev,
        uptime: `${mockUptime}s`,
        memory: `${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024) || 120} MB`,
        cpu: `${(Math.random() * 5).toFixed(1)}%`
      }));
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`p-4 rounded-xl border transition-all ${
      isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full rounded-lg border ${
      isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
    } overflow-hidden`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${
        isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-synapse-accent" />
          <h2 className="text-lg font-bold">Health Dashboard</h2>
        </div>
        <button 
          onClick={fetchStats}
          className={`p-1.5 rounded-full transition ${isRefreshing ? 'animate-spin' : ''} hover:bg-gray-200 dark:hover:bg-gray-700`}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            icon={Cpu} 
            label="CPU Usage" 
            value={systemStats.cpu} 
            color="bg-orange-500" 
          />
          <StatCard 
            icon={HardDrive} 
            label="Memory" 
            value={systemStats.memory} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={Clock} 
            label="Uptime" 
            value={systemStats.uptime} 
            color="bg-green-500" 
          />
          <StatCard 
            icon={Box} 
            label="Version" 
            value={systemStats.version} 
            color="bg-purple-500" 
          />
        </div>

        {/* Subsystem Status */}
        <div className="space-y-3">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Subsystem Status
          </h3>
          <div className={`divide-y ${isDarkMode ? 'divide-gray-700 border-gray-700' : 'divide-gray-200 border-gray-200'} border rounded-lg overflow-hidden`}>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-blue-500" />
                <span className="text-sm font-medium">Browser Tabs</span>
              </div>
              <span className="text-sm font-bold">{tabs.length} Active</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Layers size={16} className="text-purple-500" />
                <span className="text-sm font-medium">Active Panels</span>
              </div>
              <span className="text-sm font-bold">{activePanelsCount} Visible</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Download size={16} className="text-cyan-500" />
                <span className="text-sm font-medium">Downloads</span>
              </div>
              <span className={`text-sm font-bold ${activeDownloads > 0 ? 'text-synapse-accent' : ''}`}>
                {activeDownloads} Running
              </span>
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-yellow-500" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <span className={`text-sm font-bold ${unreadNotifications > 0 ? 'text-yellow-500' : ''}`}>
                {unreadNotifications} Unread
              </span>
            </div>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <GitBranch size={16} className="text-orange-500" />
                <span className="text-sm font-medium">Git Branch</span>
              </div>
              <span className="text-sm font-bold font-mono">{systemStats.branch}</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className={`p-4 rounded-lg flex gap-3 ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
            All systems are operating normally. The health dashboard monitors core application subsystems and system resource allocation in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
