export type EventCategory = 'browser' | 'workspace' | 'panel' | 'plugin' | 'workflow' | 'skill' | 'download' | 'notification' | 'system';

export interface SynapseEvent<T = any> {
  id: string;
  type: string;
  category: EventCategory;
  source: string;
  payload: T;
  timestamp: number;
  priority: number;
  duration?: number;
}

export type EventCallback<T = any> = (event: SynapseEvent<T>) => void | Promise<void>;

export interface SubscriptionOptions {
  priority?: number;
  once?: boolean;
}
