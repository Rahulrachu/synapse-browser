
import { AgentId, AgentMessage } from './types';

export class AgentMessageBus {
  private subscribers: Map<AgentId | 'broadcast', ((message: AgentMessage) => Promise<void>)[]> = new Map();

  subscribe(recipientId: AgentId | 'broadcast', handler: (message: AgentMessage) => Promise<void>) {
    if (!this.subscribers.has(recipientId)) {
      this.subscribers.set(recipientId, []);
    }
    this.subscribers.get(recipientId)?.push(handler);
  }

  unsubscribe(recipientId: AgentId | 'broadcast', handler: (message: AgentMessage) => Promise<void>) {
    const handlers = this.subscribers.get(recipientId);
    if (handlers) {
      this.subscribers.set(recipientId, handlers.filter(h => h !== handler));
    }
  }

  async publish(message: AgentMessage) {
    // Publish to specific recipient
    const recipientHandlers = this.subscribers.get(message.recipientId);
    if (recipientHandlers) {
      await Promise.all(recipientHandlers.map(handler => handler(message)));
    }

    // Publish to broadcast subscribers
    const broadcastHandlers = this.subscribers.get('broadcast');
    if (broadcastHandlers && message.recipientId !== 'broadcast') {
      await Promise.all(broadcastHandlers.map(handler => handler(message)));
    }
  }
}
