import React, { useState } from 'react';
import { X, Plus, Lock, ZZz } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  return (
    <div className="h-12 flex items-center gap-1 px-2 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-xl border-b border-white/20 dark:border-white/10 overflow-x-auto scrollbar-hide">
      <AnimatePresence>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectTab(tab.id)}
              onMouseEnter={() => setHoveredTabId(tab.id)}
              onMouseLeave={() => setHoveredTabId(null)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg min-w-max transition-all duration-200 ${
                isActive
                  ? 'bg-white/60 dark:bg-neutral-800/60 shadow-md'
                  : 'hover:bg-white/30 dark:hover:bg-neutral-800/30'
              }`}
            >
              {/* Favicon or Loading Indicator */}
              <div className="w-4 h-4 flex-shrink-0">
                {tab.isLoading ? (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" className="w-4 h-4 rounded" />
                ) : (
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
                )}
              </div>

              {/* Tab Title */}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-xs">
                {tab.title || 'New Tab'}
              </span>

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={`flex-shrink-0 p-0.5 rounded hover:bg-red-500/20 transition-colors ${
                  hoveredTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <X size={14} className="text-gray-600 dark:text-gray-400 hover:text-red-500" />
              </button>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* New Tab Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNewTab}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-neutral-800/30 transition-colors"
      >
        <Plus size={16} className="text-gray-600 dark:text-gray-400" />
      </motion.button>
    </div>
  );
};

export default TabBar;
