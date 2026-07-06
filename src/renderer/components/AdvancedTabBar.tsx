import React, { useState, useRef } from 'react';
import { Plus, X, ChevronDown, Loader } from 'lucide-react';
import { useBrowserStore } from '../store/browserStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { TabData } from '@/common/utils';

interface AdvancedTabBarProps {
  tabs: TabData[];
  activeTabId: string | null;
  onAddTab: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onDuplicateTab: (tabId: string) => void;
}

const TAB_COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
];

export default function AdvancedTabBar({
  tabs,
  activeTabId,
  onAddTab,
  onSelectTab,
  onCloseTab,
  onDuplicateTab,
}: AdvancedTabBarProps) {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { pinTab, unpinTab, sleepTab, wakeTab, setTabColor } = useBrowserStore();
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [contextMenuTab, setContextMenuTab] = useState<string | null>(null);
  const [colorPickerTab, setColorPickerTab] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== targetTabId) {
      const draggedIndex = tabs.findIndex(t => t.id === draggedTabId);
      const targetIndex = tabs.findIndex(t => t.id === targetTabId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newTabs = [...tabs];
        const [draggedTab] = newTabs.splice(draggedIndex, 1);
        newTabs.splice(targetIndex, 0, draggedTab);
        
        // Update store with reordered tabs
        const { reorderTabs } = useBrowserStore.getState();
        reorderTabs(newTabs);
      }
    }
    setDraggedTabId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenuTab(tabId);
  };

  const pinnedTabs = tabs.filter(t => t.isPinned);
  const unpinnedTabs = tabs.filter(t => !t.isPinned);

  return (
    <div
      className={`flex items-center gap-1 px-2 py-2 border-b overflow-x-auto ${
        isDarkMode ? 'border-gray-700 bg-synapse-dark' : 'border-gray-200 bg-gray-50'
      }`}
    >
      {/* Pinned Tabs */}
      {pinnedTabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={activeTabId === tab.id}
          isDarkMode={isDarkMode}
          isDragging={draggedTabId === tab.id}
          onSelect={() => onSelectTab(tab.id)}
          onClose={() => onCloseTab(tab.id)}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, tab.id)}
        />
      ))}

      {/* Separator if pinned tabs exist */}
      {pinnedTabs.length > 0 && (
        <div className={`w-px h-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
      )}

      {/* Unpinned Tabs */}
      {unpinnedTabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={activeTabId === tab.id}
          isDarkMode={isDarkMode}
          isDragging={draggedTabId === tab.id}
          onSelect={() => onSelectTab(tab.id)}
          onClose={() => onCloseTab(tab.id)}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, tab.id)}
        />
      ))}

      {/* Add Tab Button */}
      <button
        onClick={onAddTab}
        className={`ml-auto p-1 rounded hover:bg-synapse-accent hover:text-white transition`}
        title="New Tab (Ctrl+T)"
      >
        <Plus size={18} />
      </button>

      {/* Context Menu */}
      {contextMenuTab && (
        <TabContextMenu
          tabId={contextMenuTab}
          tab={tabs.find(t => t.id === contextMenuTab)!}
          isDarkMode={isDarkMode}
          onClose={() => setContextMenuTab(null)}
          onPin={() => {
            pinTab(contextMenuTab);
            setContextMenuTab(null);
          }}
          onUnpin={() => {
            unpinTab(contextMenuTab);
            setContextMenuTab(null);
          }}
          onSleep={() => {
            sleepTab(contextMenuTab);
            setContextMenuTab(null);
          }}
          onWake={() => {
            wakeTab(contextMenuTab);
            setContextMenuTab(null);
          }}
          onDuplicate={() => {
            onDuplicateTab(contextMenuTab);
            setContextMenuTab(null);
          }}
          onColor={() => setColorPickerTab(contextMenuTab)}
          ref={contextMenuRef}
        />
      )}

      {/* Color Picker */}
      {colorPickerTab && (
        <ColorPicker
          isDarkMode={isDarkMode}
          onSelectColor={(color) => {
            setTabColor(colorPickerTab, color);
            setColorPickerTab(null);
          }}
          onClose={() => setColorPickerTab(null)}
        />
      )}
    </div>
  );
}

interface TabItemProps {
  tab: TabData;
  isActive: boolean;
  isDarkMode: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onClose: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function TabItem({
  tab,
  isActive,
  isDarkMode,
  isDragging,
  onSelect,
  onClose,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
}: TabItemProps) {
  const bgColor = tab.color || (isActive ? 'bg-synapse-accent' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200');
  const hoverBg = isActive ? '' : isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onContextMenu={onContextMenu}
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-1 rounded-t cursor-grab active:cursor-grabbing transition whitespace-nowrap ${bgColor} ${hoverBg} ${
        isDragging ? 'opacity-50' : ''
      } ${isActive ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}
    >
      {tab.isSleeping && (
        <div className="w-2 h-2 rounded-full bg-yellow-500" title="Tab is sleeping" />
      )}
      {tab.isLoading && <Loader size={14} className="animate-spin" />}
      <span className="text-sm truncate max-w-[100px]">{tab.title || 'New Tab'}</span>
      {tab.isPinned && <span className="text-xs">📌</span>}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="hover:bg-red-500 rounded p-0.5 transition"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface TabContextMenuProps {
  tabId: string;
  tab: TabData;
  isDarkMode: boolean;
  onClose: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onSleep: () => void;
  onWake: () => void;
  onDuplicate: () => void;
  onColor: () => void;
}

const TabContextMenu = React.forwardRef<HTMLDivElement, TabContextMenuProps>(
  ({ tab, isDarkMode, onClose, onPin, onUnpin, onSleep, onWake, onDuplicate, onColor }, ref) => {
    return (
      <div
        ref={ref}
        className={`absolute top-12 left-0 z-50 rounded-lg shadow-lg border ${
          isDarkMode
            ? 'bg-synapse-darker border-gray-700'
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onDuplicate}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-synapse-accent hover:text-white transition ${
            isDarkMode ? 'text-gray-300' : 'text-gray-900'
          }`}
        >
          Duplicate Tab
        </button>
        <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        {tab.isPinned ? (
          <button
            onClick={onUnpin}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-synapse-accent hover:text-white transition ${
              isDarkMode ? 'text-gray-300' : 'text-gray-900'
            }`}
          >
            Unpin Tab
          </button>
        ) : (
          <button
            onClick={onPin}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-synapse-accent hover:text-white transition ${
              isDarkMode ? 'text-gray-300' : 'text-gray-900'
            }`}
          >
            Pin Tab
          </button>
        )}
        {tab.isSleeping ? (
          <button
            onClick={onWake}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-synapse-accent hover:text-white transition ${
              isDarkMode ? 'text-gray-300' : 'text-gray-900'
            }`}
          >
            Wake Tab
          </button>
        ) : (
          <button
            onClick={onSleep}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-synapse-accent hover:text-white transition ${
              isDarkMode ? 'text-gray-300' : 'text-gray-900'
            }`}
          >
            Sleep Tab
          </button>
        )}
        <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <button
          onClick={onColor}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-synapse-accent hover:text-white transition ${
            isDarkMode ? 'text-gray-300' : 'text-gray-900'
          }`}
        >
          Color Tab
        </button>
      </div>
    );
  }
);

TabContextMenu.displayName = 'TabContextMenu';

interface ColorPickerProps {
  isDarkMode: boolean;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

function ColorPicker({ isDarkMode, onSelectColor, onClose }: ColorPickerProps) {
  return (
    <div
      className={`absolute top-12 left-0 z-50 rounded-lg shadow-lg border p-3 ${
        isDarkMode
          ? 'bg-synapse-darker border-gray-700'
          : 'bg-white border-gray-200'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-4 gap-2">
        {TAB_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onSelectColor(color.value)}
            className="w-6 h-6 rounded hover:scale-110 transition"
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}
