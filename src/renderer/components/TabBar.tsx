import { useState } from 'react';
import { X, Plus, Volume2, VolumeX, Pin, RotateCcw, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isMuted?: boolean;
  isPlayingAudio?: boolean;
  isCrashed?: boolean;
  pinned?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onReopenClosedTab?: () => void;
  onDuplicateTab?: (tabId: string) => void;
  onToggleMute?: (tabId: string) => void;
  onPinTab?: (tabId: string, pinned: boolean) => void;
  onMoveTab?: (tabId: string, targetIndex: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onReopenClosedTab,
  onDuplicateTab,
  onToggleMute,
  onPinTab,
  onMoveTab,
}) => {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  return (
    <div className="h-12 flex items-center gap-1 px-2 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border-b border-white/20 dark:border-white/10 overflow-x-auto scrollbar-hide">
      <AnimatePresence initial={false}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          return (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              draggable
              onDragStart={() => setDraggedTabId(tab.id)}
              onDragEnd={() => setDraggedTabId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedTabId && draggedTabId !== tab.id) onMoveTab?.(draggedTabId, index);
                setDraggedTabId(null);
              }}
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg min-w-[180px] max-w-[280px] transition-all duration-200 cursor-default ${
                isActive
                  ? 'bg-white/60 dark:bg-neutral-800/60 shadow-md'
                  : 'hover:bg-white/30 dark:hover:bg-neutral-800/30'
              } ${draggedTabId === tab.id ? 'opacity-50' : ''}`}
              onDoubleClick={() => onDuplicateTab?.(tab.id)}
              title="Double-click to duplicate"
            >
              <button type="button" onClick={() => onSelectTab(tab.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <div className="w-4 h-4 flex-shrink-0">
                  {tab.isLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : tab.isCrashed ? (
                    <div className="w-4 h-4 rounded bg-red-500" title="This tab crashed" />
                  ) : tab.favicon ? (
                    <img src={tab.favicon} alt="" className="w-4 h-4 rounded" />
                  ) : (
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {tab.pinned && <Pin size={12} className="inline mr-1 text-blue-500" />}
                  {tab.title || 'New Tab'}
                </span>
              </button>

              {tab.isPlayingAudio && (
                <button type="button" onClick={() => onToggleMute?.(tab.id)} className="flex-shrink-0 p-0.5 rounded hover:bg-blue-500/20" title={tab.isMuted ? 'Unmute tab' : 'Mute tab'}>
                  {tab.isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              )}
              {hoveredTabId === tab.id && (
                <div className="flex items-center gap-0.5">
                  <button type="button" onClick={() => onPinTab?.(tab.id, !tab.pinned)} className="flex-shrink-0 p-0.5 rounded hover:bg-blue-500/20" title={tab.pinned ? 'Unpin tab' : 'Pin tab'}>
                    <Pin size={13} className={tab.pinned ? 'text-blue-500' : 'text-gray-500'} />
                  </button>
                  <button type="button" onClick={() => onDuplicateTab?.(tab.id)} className="flex-shrink-0 p-0.5 rounded hover:bg-blue-500/20" title="Duplicate tab">
                    <Copy size={13} className="text-gray-500" />
                  </button>
                  <button type="button" onClick={() => onCloseTab(tab.id)} className="flex-shrink-0 p-0.5 rounded hover:bg-red-500/20" title="Close tab">
                    <X size={14} className="text-gray-600 dark:text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onNewTab} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-neutral-800/30 transition-colors" title="New tab">
        <Plus size={16} className="text-gray-600 dark:text-gray-400" />
      </motion.button>
      <button type="button" onClick={onReopenClosedTab} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-neutral-800/30 transition-colors" title="Reopen closed tab (Ctrl/Cmd+Shift+T)">
        <RotateCcw size={15} className="text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
};

export default TabBar;
