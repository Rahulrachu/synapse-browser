import { BrowserWindow } from 'electron';
import { NotificationType } from '../renderer/types/notification.js';

interface ShowNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  autoDismiss?: boolean;
  dismissAfter?: number; // ms
  actionUrl?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  showNotification(options: ShowNotificationOptions) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('notification:show', options);
    } else {
      console.warn('MainWindow not set for NotificationService. Cannot show notification:', options);
    }
  }
}

export default new NotificationService();
