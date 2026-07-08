export type RecentItemType = 'file' | 'project';

export interface RecentItem {
  id: string;
  type: RecentItemType;
  name: string;
  path: string;
  lastOpened: number;
  isPinned: boolean;
  metadata?: Record<string, any>;
}

export interface RecentState {
  items: RecentItem[];
}
