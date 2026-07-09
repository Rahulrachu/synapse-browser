import { ipcMain, dialog, BrowserWindow } from 'electron';
import { Permission, PermissionRequest, PermissionState, PermissionHistoryEntry } from '../common/types/permission.js';
import Storage from './Storage.js';

class PermissionManager {
  private permissions: Map<string, Permission> = new Map();
  private pendingRequests: Map<string, PermissionRequest> = new Map();
  private history: PermissionHistoryEntry[] = [];
  private STORAGE_KEY = 'permissions';

  constructor() {
    this.loadPermissions();
    this.setupIPCHandlers();
  }

  private async loadPermissions() {
    const saved = await Storage.get(this.STORAGE_KEY) || [];
    saved.forEach((p: Permission) => this.permissions.set(`${p.scope}:${p.resource}`, p));
  }

  private setupIPCHandlers() {
    ipcMain.handle('permission:get-all', () => Array.from(this.permissions.values()));
    ipcMain.handle('permission:get-history', () => this.history);
    ipcMain.handle('permission:update', (_, permission: Permission) => this.updatePermission(permission));
    ipcMain.handle('permission:request', (_, request: PermissionRequest) => this.requestPermission(request));
  }

  async checkPermission(scope: string, resource: string): Promise<boolean> {
    const key = `${scope}:${resource}`;
    const permission = this.permissions.get(key);

    if (!permission || permission.state === 'ask') {
      // In a real app, this would trigger a UI prompt
      return false;
    }

    if (permission.state === 'temporary' && permission.expiresAt && Date.now() > permission.expiresAt) {
      this.permissions.delete(key);
      await this.savePermissions();
      return false;
    }

    return permission.state === 'granted' || permission.state === 'temporary';
  }

  async requestPermission(request: PermissionRequest): Promise<boolean> {
    console.log(`[PermissionManager] Requesting ${request.resource} for ${request.scope}: ${request.reason}`);
    
    // Check if already decided
    const key = `${request.scope}:${request.resource}`;
    const existing = this.permissions.get(key);
    if (existing && existing.state !== 'ask') {
      return existing.state === 'granted' || existing.state === 'temporary';
    }

    this.pendingRequests.set(request.id, request);
    this.logHistory(request.scope, request.resource, 'requested');

    // For this implementation, we'll simulate a user prompt via a dialog
    // In a full implementation, this would open a custom Electron window or notify the renderer
    const decision = await this.showPrompt(request);
    
    if (decision) {
      await this.updatePermission({
        id: `perm-${Date.now()}`,
        scope: request.scope,
        resource: request.resource,
        state: decision
      });
    }

    this.pendingRequests.delete(request.id);
    return decision === 'granted' || decision === 'temporary';
  }

  private async showPrompt(request: PermissionRequest): Promise<PermissionState | null> {
    // Simulated prompt logic
    return 'granted'; // Defaulting to granted for now to allow flow
  }

  async updatePermission(permission: Permission) {
    const key = `${permission.scope}:${permission.resource}`;
    this.permissions.set(key, { ...permission, grantedAt: Date.now() });
    this.logHistory(permission.scope, permission.resource, permission.state === 'granted' ? 'granted' : 'denied');
    await this.savePermissions();
  }

  private async savePermissions() {
    await Storage.set(this.STORAGE_KEY, Array.from(this.permissions.values()));
  }

  private logHistory(scope: string, resource: string, action: any) {
    this.history.unshift({
      id: `hist-${Date.now()}`,
      scope,
      resource,
      action,
      timestamp: Date.now()
    });
    if (this.history.length > 100) this.history.pop();
  }
}

export default new PermissionManager();
