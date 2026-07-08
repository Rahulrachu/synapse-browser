import { app, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ExtensionMetadata, MarketplaceSearchOptions, ExtensionUpdateInfo } from '../common/types/marketplace';
import PluginManager from './PluginManager';
import PermissionManager from './PermissionManager';

class ExtensionRepositoryService {
  private mockExtensions: ExtensionMetadata[] = [
    {
      id: 'com.synapse.adblock',
      name: 'Synapse AdBlock',
      author: 'Synapse Team',
      version: '1.2.0',
      description: 'Block annoying ads and trackers for a faster browsing experience.',
      category: 'Productivity',
      rating: 4.8,
      downloadCount: 15000,
      lastUpdated: '2026-06-15',
      requiredPermissions: ['network'],
      minBrowserVersion: '1.0.0',
      manifestUrl: '',
      downloadUrl: ''
    },
    {
      id: 'com.synapse.darkmode',
      name: 'Universal Dark Mode',
      author: 'DarkSide Devs',
      version: '2.0.1',
      description: 'Enable dark mode on every website you visit.',
      category: 'UI/UX',
      rating: 4.5,
      downloadCount: 8000,
      lastUpdated: '2026-07-01',
      requiredPermissions: ['storage'],
      minBrowserVersion: '1.0.0',
      manifestUrl: '',
      downloadUrl: ''
    },
    {
      id: 'com.synapse.translator',
      name: 'Synapse Translator',
      author: 'Global Tech',
      version: '0.9.5',
      description: 'Translate web pages instantly into over 100 languages.',
      category: 'Tools',
      rating: 4.2,
      downloadCount: 5000,
      lastUpdated: '2026-05-20',
      requiredPermissions: ['network', 'storage'],
      minBrowserVersion: '1.1.0',
      manifestUrl: '',
      downloadUrl: ''
    }
  ];

  constructor() {
    this.setupIPCHandlers();
  }

  private setupIPCHandlers() {
    ipcMain.handle('marketplace:search', (_, options: MarketplaceSearchOptions) => this.searchExtensions(options));
    ipcMain.handle('marketplace:get-details', (_, id: string) => this.getExtensionDetails(id));
    ipcMain.handle('marketplace:install', (_, id: string) => this.installExtension(id));
    ipcMain.handle('marketplace:uninstall', (_, id: string) => this.uninstallExtension(id));
    ipcMain.handle('marketplace:check-updates', () => this.checkUpdates());
  }

  async searchExtensions(options: MarketplaceSearchOptions): Promise<ExtensionMetadata[]> {
    let results = [...this.mockExtensions];

    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(ext => 
        ext.name.toLowerCase().includes(query) || 
        ext.description.toLowerCase().includes(query)
      );
    }

    if (options.category && options.category !== 'All') {
      results = results.filter(ext => ext.category === options.category);
    }

    if (options.sortBy) {
      results.sort((a, b) => {
        if (options.sortBy === 'rating') return b.rating - a.rating;
        if (options.sortBy === 'downloads') return b.downloadCount - a.downloadCount;
        if (options.sortBy === 'updated') return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        return 0;
      });
    }

    return results;
  }

  async getExtensionDetails(id: string): Promise<ExtensionMetadata | undefined> {
    return this.mockExtensions.find(ext => ext.id === id);
  }

  async installExtension(id: string): Promise<boolean> {
    const ext = await this.getExtensionDetails(id);
    if (!ext) throw new Error('Extension not found');

    // Check for 'marketplace:install' permission
    const hasPermission = await PermissionManager.checkPermission('marketplace', 'install');
    if (!hasPermission) {
      const granted = await PermissionManager.requestPermission({
        id: `req-${Date.now()}`,
        scope: 'marketplace',
        resource: 'install',
        reason: `Install extension: ${ext.name}`,
        timestamp: Date.now()
      });
      if (!granted) throw new Error(`Permission denied for installing extension: ${ext.name}`);
    }

    // Verify compatibility
    const currentVersion = app.getVersion();
    if (this.compareVersions(currentVersion, ext.minBrowserVersion) < 0) {
      throw new Error(`Extension requires Synapse Browser v${ext.minBrowserVersion} or higher.`);
    }

    // In a real implementation, we would download the extension here.
    // For this mock, we'll create a dummy manifest in the plugins folder.
    const pluginsPath = path.join(app.getPath('userData'), 'plugins');
    const extPath = path.join(pluginsPath, id);
    
    if (!fs.existsSync(extPath)) {
      fs.mkdirSync(extPath, { recursive: true });
    }

    const manifest = {
      id: ext.id,
      name: ext.name,
      version: ext.version,
      description: ext.description,
      author: ext.author,
      main: 'index.js',
      permissions: ext.requiredPermissions
    };

    fs.writeFileSync(path.join(extPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    // Notify PluginManager to discover and load
    await PluginManager.discoverPlugins();
    return true;
  }

  async uninstallExtension(id: string): Promise<boolean> {
    const pluginsPath = path.join(app.getPath('userData'), 'plugins');
    const extPath = path.join(pluginsPath, id);

    if (fs.existsSync(extPath)) {
      // First disable and unload
      await PluginManager.disablePlugin(id);
      
      // Then remove files (recursively)
      fs.rmSync(extPath, { recursive: true, force: true });
      
      // Refresh PluginManager
      await PluginManager.discoverPlugins();
      return true;
    }
    return false;
  }

  async checkUpdates(): Promise<ExtensionUpdateInfo[]> {
    const installedPlugins = PluginManager.getAllPlugins();
    const updates: ExtensionUpdateInfo[] = [];

    for (const plugin of installedPlugins) {
      const remoteExt = this.mockExtensions.find(ext => ext.id === plugin.manifest.id);
      if (remoteExt && this.compareVersions(remoteExt.version, plugin.manifest.version) > 0) {
        updates.push({
          id: plugin.manifest.id,
          currentVersion: plugin.manifest.version,
          newVersion: remoteExt.version,
          releaseNotes: `Updated to version ${remoteExt.version}`
        });
      }
    }

    return updates;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }
}

export default new ExtensionRepositoryService();
