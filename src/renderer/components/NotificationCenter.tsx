import React from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Pin, 
  PinOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Zap,
  Download,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { NotificationType } from '../types/notification';

export default function NotificationCenter() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearNotification, 
    clearAll, 
    togglePin 
  } = useNotificationStore();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'error': return <AlertCircle className="text-red-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={18} />;
      case 'info': return <Info className="text-blue-500" size={18} />;
      case 'ai-task': return <Zap className="text-purple-500" size={18} />;
      case 'download': return <Download className="text-cyan-500" size={18} />;
      case 'git': return <GitBranch className="text-orange-500" size={18} />;
      default: return <Bell className="text-gray-500" size={18} />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border ${
      isDarkMode ? 'border-gray-700 bg-synapse-darker' : 'border-gray-300 bg-white'
    } overflow-hidden`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${
        isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <Bell size={18} />
          <h2 className="text-lg font-bold">Notifications</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={markAllAsRead}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition" 
            title="Mark all as read"
          >
            <CheckCheck size={18} />
          </button>
          <button 
            onClick={clearAll}
            className="p-1.5 rounded hover:bg-red-500/20 text-red-500 transition" 
            title="Clear all (except pinned)"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Bell size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">All caught up!</p>
            <p className="text-xs">No new notifications at the moment.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`group relative p-3 rounded-lg border transition ${
                notification.isRead 
                  ? (isDarkMode ? 'border-gray-800 bg-gray-900/30' : 'border-gray-100 bg-gray-50/50')
                  : (isDarkMode ? 'border-gray-700 bg-gray-800 shadow-sm' : 'border-gray-200 bg-white shadow-sm')
              }`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              {!notification.isRead && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-synapse-accent rounded-full" />
              )}
              
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className={`text-sm font-semibold truncate ${notification.isRead ? 'opacity-70' : ''}`}>
                    {notification.title}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${notification.isRead ? 'text-gray-500' : (isDarkMode ? 'text-gray-300' : 'text-gray-600')}`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatDate(notification.timestamp)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {notification.actionUrl && (
                        <a 
                          href={notification.actionUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-synapse-accent/10 text-synapse-accent transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(notification.id);
                        }}
                        className={`p-1 rounded transition ${
                          notification.isPinned 
                            ? 'text-synapse-accent bg-synapse-accent/10' 
                            : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title={notification.isPinned ? "Unpin" : "Pin"}
                      >
                        {notification.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 transition"
                        title="Dismiss"
                      >
                        <X size={12} />
                      </button>
                    </div>
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
