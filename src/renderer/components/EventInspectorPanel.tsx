import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useEventStore } from '../store/eventStore';
import { SynapseEvent } from '../../common/types/event';
import { Search, Pause, Play, Trash2, Download, Filter } from 'lucide-react';

export default function EventInspectorPanel() {
  const isDarkMode = useWorkspaceStore((state) => state.isDarkMode);
  const { events, isPaused, addEvent, setPaused, clearEvents, exportEvents } = useEventStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<SynapseEvent | null>(null);

  const categories = ['all', 'browser', 'workspace', 'panel', 'plugin', 'workflow', 'skill', 'download', 'notification', 'system'];

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    const json = exportEvents();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Event Inspector</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPaused(!isPaused)}
              className={`px-3 py-1 rounded text-sm flex items-center gap-2 transition-colors ${
                isPaused
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={clearEvents}
              className="px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Search size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className={`flex-1 bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-black'}`}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Event List */}
        <div className={`w-1/2 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
          {filteredEvents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No events</div>
          ) : (
            <div className="space-y-1 p-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-3 rounded cursor-pointer transition-colors text-sm ${
                    selectedEvent?.id === event.id
                      ? 'bg-synapse-accent text-white'
                      : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{event.type}</div>
                      <div className="text-xs opacity-75">{event.source}</div>
                    </div>
                    <div className="text-xs opacity-75">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="w-1/2 overflow-y-auto p-4">
          {selectedEvent ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold mb-2">{selectedEvent.type}</h3>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedEvent.id}
                </div>
              </div>

              {/* Metadata */}
              <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Category:</span> {selectedEvent.category}
                  </div>
                  <div>
                    <span className="font-semibold">Source:</span> {selectedEvent.source}
                  </div>
                  <div>
                    <span className="font-semibold">Priority:</span> {selectedEvent.priority}
                  </div>
                  <div>
                    <span className="font-semibold">Timestamp:</span> {new Date(selectedEvent.timestamp).toLocaleString()}
                  </div>
                  {selectedEvent.duration && (
                    <div>
                      <span className="font-semibold">Duration:</span> {selectedEvent.duration}ms
                    </div>
                  )}
                </div>
              </div>

              {/* Payload */}
              {selectedEvent.payload && (
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="font-semibold mb-2">Payload</div>
                  <pre className={`text-xs overflow-x-auto p-2 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select an event to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
