export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  url?: string;
  metadata?: Record<string, any>;
  score?: number;
  matches?: Array<{
    key: string;
    indices: Array<[number, number]>;
  }>;
}

export interface SearchQuery {
  text: string;
  filters?: string[];
  limit?: number;
}

export interface SearchStats {
  totalItems: number;
  providerCount: number;
  lastIndexTime: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
}

export interface SearchProviderInfo {
  id: string;
  name: string;
  enabled: boolean;
}
