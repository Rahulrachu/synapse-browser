import { create } from 'zustand';
import { SynapseEvent, EventCategory } from '../../common/types/event.js';
import { eventBus } from '../utils/EventBus.js';

interface EventStoreState {
  events: SynapseEvent[];
  isPaused: boolean;
  maxEvents: number;
  addEvent: (event: SynapseEvent) => void;
  setPaused: (paused: boolean) => void;
  clearEvents: () => void;
  exportEvents: () => string;
}

export const useEventStore = create<EventStoreState>((set, get) => ({
  events: [],
  isPaused: false,
  maxEvents: 1000,

  addEvent: (event: SynapseEvent) => {
    if (get().isPaused) return;

    set((state) => {
      const newEvents = [event, ...state.events].slice(0, state.maxEvents);
      return { events: newEvents };
    });
  },

  setPaused: (paused: boolean) => set({ isPaused: paused }),
  
  clearEvents: () => set({ events: [] }),

  exportEvents: () => {
    return JSON.stringify(get().events, null, 2);
  }
}));

// Auto-subscribe to all events for the inspector
// This is a special internal subscription
(window as any).electron?.ipcRenderer.on('event-bus:event', (event: SynapseEvent) => {
  useEventStore.getState().addEvent(event);
});
