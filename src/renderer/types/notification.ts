export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'ai-task' 
  | 'download' 
  | 'git';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  isPinned: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number; // ms
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}
