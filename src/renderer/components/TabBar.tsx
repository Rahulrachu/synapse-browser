import React from 'react';
import { Plus, X, Pin, Volume2, VolumeX } from 'lucide-react';

interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  pinned?: boolean;
  isMuted?: boolean;
  isPlayingAudio?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }) => {
  return (
    <div className="flex items-center gap-1 h-10 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <div 
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg min-w-[140px] max-w-[200px] cursor-pointer transition-all duration-200 group ${
            activeTabId === tab.id 
              ? 'bg-[#1a1d24] text-white border border-white/5 shadow-sm' 
              : 'text-gray-500 hover:bg-white/5'
          }`}
        >
          {tab.isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-synapse-accent border-t-transparent rounded-full animate-spin" />
          ) : tab.favicon ? (
            <img src={tab.favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />
          ) : (
            <div className="w-3.5 h-3.5 bg-gray-700 rounded-sm" />
          )}
          <span className="text-xs font-medium truncate flex-1">
            {tab.pinned && <Pin size={10} className="inline mr-1 text-synapse-accent" />}
            {tab.title || 'New Tab'}
          </span>
          {tab.isPlayingAudio && (
            <div className="text-synapse-accent">
              {tab.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </div>
          )}
          <X 
            size={12} 
            className={`opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ${activeTabId === tab.id ? 'opacity-40' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
          />
        </div>
      ))}
      <button 
        onClick={onNewTab}
        className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default TabBar;
