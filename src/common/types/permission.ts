export type PermissionState = 'granted' | 'denied' | 'ask' | 'temporary';

export interface Permission {
  id: string;
  scope: string;
  resource: string;
  state: PermissionState;
  grantedAt?: number;
  expiresAt?: number;
}

export interface PermissionRequest {
  id: string;
  scope: string;
  resource: string;
  reason: string;
  timestamp: number;
}

export interface PermissionHistoryEntry {
  id: string;
  scope: string;
  resource: string;
  action: 'granted' | 'denied' | 'revoked' | 'requested';
  timestamp: number;
}
