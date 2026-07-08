import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification, NotificationType } from '../types/notification';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (params: {
    type: NotificationType;
    title: string;
    message: string;
    autoDismiss?: boolean;
    dismissAfter?: number;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  togglePin: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (params) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          id,
          type: params.type,
          title: params.title,
          message: params.message,
          timestamp: Date.now(),
          isRead: false,
          isPinned: false,
          autoDismiss: params.autoDismiss,
          dismissAfter: params.dismissAfter || 5000,
          actionUrl: params.actionUrl,
          metadata: params.metadata,
        };

        set((state) => {
          const newNotifications = [newNotification, ...state.notifications];
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.isRead).length,
          };
        });

        if (params.autoDismiss) {
          setTimeout(() => {
            get().clearNotification(id);
          }, params.dismissAfter || 5000);
        }

        return id;
      },

      markAsRead: (id) => {
        set((state) => {
          const newNotifications = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.isRead).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => {
          const newNotifications = state.notifications.map((n) => ({ ...n, isRead: true }));
          return {
            notifications: newNotifications,
            unreadCount: 0,
          };
        });
      },

      clearNotification: (id) => {
        set((state) => {
          const newNotifications = state.notifications.filter((n) => n.id !== id || n.isPinned);
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.isRead).length,
          };
        });
      },

      clearAll: () => {
        set((state) => {
          const newNotifications = state.notifications.filter((n) => n.isPinned);
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.isRead).length,
          };
        });
      },

      togglePin: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n
          ),
        }));
      },
    }),
    {
      name: 'synapse-notifications',
      version: 1,
    }
  )
);
