import { SynapseEvent, EventCallback, SubscriptionOptions } from '../../common/types/event.js';

class RendererEventBus {
  private listeners: Map<string, { callback: EventCallback; options: SubscriptionOptions }[]> = new Map();

  constructor() {
    this.setupIPC();
  }

  private setupIPC() {
    if ((window as any).electron?.ipcRenderer) {
      (window as any).electron.ipcRenderer.on('event-bus:event', (event: SynapseEvent) => {
        this.dispatchLocal(event);
      });
    }
  }

  subscribe(type: string, callback: EventCallback, options: SubscriptionOptions = {}) {
    const listeners = this.listeners.get(type) || [];
    listeners.push({ callback, options });
    listeners.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));
    this.listeners.set(type, listeners);

    return () => this.unsubscribe(type, callback);
  }

  unsubscribe(type: string, callback: EventCallback) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      this.listeners.set(type, listeners.filter(l => l.callback !== callback));
    }
  }

  async publish(event: Partial<SynapseEvent>) {
    const fullEvent: SynapseEvent = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: event.type || 'unknown',
      category: event.category || 'system',
      source: event.source || 'renderer',
      payload: event.payload,
      timestamp: event.timestamp || Date.now(),
      priority: event.priority || 0,
      ...event
    };

    // Dispatch locally
    await this.dispatchLocal(fullEvent);

    // Forward to main process
    if ((window as any).electron?.ipcRenderer) {
      (window as any).electron.ipcRenderer.publish('event-bus:publish', fullEvent);
    }
  }

  private async dispatchLocal(event: SynapseEvent) {
    const listeners = this.listeners.get(event.type) || [];
    const promises = listeners.map(async listener => {
      try {
        await listener.callback(event);
        if (listener.options.once) {
          this.unsubscribe(event.type, listener.callback);
        }
      } catch (error) {
        console.error(`Error in renderer event listener for ${event.type}:`, error);
      }
    });

    await Promise.all(promises);
  }
}

export const eventBus = new RendererEventBus();
