import React from 'react';
import { Plus, X, Pin, Volume2, VolumeX } from 'lucide-react';
import { SynapseIconButton } from './synapse-ui.js';

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

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }) => (
  <div className="flex h-10 items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Open tabs">
    {tabs.map(tab => {
      const active = activeTabId === tab.id;
      return <div key={tab.id} role="tab" aria-selected={active} tabIndex={active ? 0 : -1} onClick={() => onSelectTab(tab.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectTab(tab.id); } }} className={`synapse-tab group flex min-w-[150px] max-w-[230px] cursor-pointer items-center gap-2 px-3 py-2 text-xs ${active ? 'active' : ''}`}>
        {tab.isLoading ? <span className="h-3 w-3 shrink-0 animate-spin rounded-full border border-synapse-accent border-t-transparent" aria-label="Loading" /> : tab.favicon ? <img src={tab.favicon} alt="" className="h-3.5 w-3.5 shrink-0 rounded-sm" /> : <span className="h-3.5 w-3.5 shrink-0 rounded-[5px] bg-white/10" aria-hidden="true" />}
        <span className="min-w-0 flex-1 truncate font-medium">{tab.pinned && <Pin size={10} className="mr-1 inline text-synapse-accent" />}{tab.title || 'New Tab'}</span>
        {tab.isPlayingAudio && <span className="text-synapse-accent" title={tab.isMuted ? 'Muted' : 'Playing'}>{tab.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}</span>}
        <button type="button" aria-label={`Close ${tab.title || 'tab'}`} onClick={event => { event.stopPropagation(); onCloseTab(tab.id); }} className="rounded-md p-1 text-white/25 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus-visible:opacity-100"> <X size={12} /> </button>
      </div>;
    })}
    <SynapseIconButton type="button" aria-label="New tab" title="New tab" onClick={onNewTab} className="ml-1 h-8 w-8 shrink-0"><Plus size={15} /></SynapseIconButton>
  </div>
);

export default TabBar;
