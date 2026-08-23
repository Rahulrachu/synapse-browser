export interface ExtensionMetadata {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  category: string;
  rating: number;
  downloadCount: number;
  lastUpdated: string;
  requiredPermissions: string[];
  minBrowserVersion: string;
  iconUrl?: string;
  manifestUrl: string;
  downloadUrl: string;
}

export interface MarketplaceSearchOptions {
  query?: string;
  category?: string;
  sortBy?: 'rating' | 'downloads' | 'updated';
}

export interface ExtensionUpdateInfo {
  id: string;
  currentVersion: string;
  newVersion: string;
  releaseNotes?: string;
}
