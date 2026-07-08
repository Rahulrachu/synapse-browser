import { ipcMain, WebContents, webContents } from 'electron';
import { SynapseEvent, EventCallback, SubscriptionOptions } from '../common/types/event';

class EventBus {
  private listeners: Map<string, { callback: EventCallback; options: SubscriptionOptions }[]> = new Map();

  constructor() {
    this.setupIPCHandlers();
  }

  private setupIPCHandlers() {
    ipcMain.on('event-bus:publish', (event, synapseEvent: SynapseEvent) => {
      this.publish(synapseEvent, false); // Don't bounce back to sender
    });
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

  async publish(event: SynapseEvent, broadcastToRenderer = true) {
    console.log(`[EventBus] Publishing: ${event.type} from ${event.source}`);
    
    const listeners = this.listeners.get(event.type) || [];
    const promises = listeners.map(async listener => {
      try {
        await listener.callback(event);
        if (listener.options.once) {
          this.unsubscribe(event.type, listener.callback);
        }
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    });

    await Promise.all(promises);

    if (broadcastToRenderer) {
      this.broadcastToRenderer(event);
    }
  }

  private broadcastToRenderer(event: SynapseEvent) {
    const allWebContents = webContents.getAllWebContents();
    allWebContents.forEach(wc => {
      wc.send('event-bus:event', event);
    });
  }
}

export default new EventBus();
