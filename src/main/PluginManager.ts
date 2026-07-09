import * as fs from 'fs';
import * as path from 'path';
import { app, ipcMain } from 'electron';
import { PluginInfo, PluginManifest } from '../common/types/plugin.js';
import { PluginAPI } from './PluginAPI.js';
import Storage from './Storage.js';

/**
 * Manages the lifecycle and state of plugins in the Synapse Browser.
 * Responsible for discovery, loading, enabling/disabling, and reloading plugins.
 */
class PluginManager {
  private plugins: Map<string, PluginInfo> = new Map();
  private pluginAPIs: Map<string, PluginAPI> = new Map();
  private pluginsPath: string;

  constructor() {
    this.pluginsPath = path.join(app.getPath('userData'), 'plugins');
    if (!fs.existsSync(this.pluginsPath)) {
      fs.mkdirSync(this.pluginsPath, { recursive: true });
    }
    this.setupIPCHandlers();
  }

  private setupIPCHandlers() {
    ipcMain.handle('plugin:get-all', () => this.getAllPlugins());
    ipcMain.handle('plugin:enable', (_, id: string) => this.enablePlugin(id));
    ipcMain.handle('plugin:disable', (_, id: string) => this.disablePlugin(id));
    ipcMain.handle('plugin:reload', (_, id: string) => this.reloadPlugin(id));
    ipcMain.handle('plugin:install-local', (_, folderPath: string) => this.installLocalPlugin(folderPath));
  }

  /**
   * Scans the plugins directory for valid manifests and initializes the plugin list.
   */
  async discoverPlugins() {
    const entries = fs.readdirSync(this.pluginsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(this.pluginsPath, entry.name);
        const manifestPath = path.join(pluginPath, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            const enabled = await this.isPluginEnabled(manifest.id);
            this.plugins.set(manifest.id, {
              manifest,
              path: pluginPath,
              enabled,
              loaded: false,
            });

            if (enabled) {
              await this.loadPlugin(manifest.id);
            }
          } catch (error) {
            console.error(`Failed to load manifest for plugin at ${pluginPath}:`, error);
          }
        }
      }
    }
  }

  private async isPluginEnabled(id: string): Promise<boolean> {
    const states = (await Storage.get('plugin-states')) || {};
    return states[id] !== false; // Default to true if not specified
  }

  private async setPluginEnabled(id: string, enabled: boolean) {
    const states = (await Storage.get('plugin-states')) || {};
    states[id] = enabled;
    await Storage.set('plugin-states', states);
  }

  async loadPlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (!plugin || plugin.loaded) return;

    try {
      console.log(`Loading plugin: ${plugin.manifest.name} (${id})`);
      const api = new PluginAPI(id);
      this.pluginAPIs.set(id, api);

      // In a real implementation, we would require(plugin.path/main) here
      // and call an entry point like `export function activate(api)`.
      // For this framework, we'll simulate the load.
      
      plugin.loaded = true;
      console.log(`Plugin ${id} loaded successfully.`);
    } catch (error) {
      console.error(`Error loading plugin ${id}:`, error);
    }
  }

  async unloadPlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (!plugin || !plugin.loaded) return;

    try {
      console.log(`Unloading plugin: ${id}`);
      // Cleanup logic would go here
      this.pluginAPIs.delete(id);
      plugin.loaded = false;
    } catch (error) {
      console.error(`Error unloading plugin ${id}:`, error);
    }
  }

  async enablePlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (!plugin) return;

    await this.setPluginEnabled(id, true);
    plugin.enabled = true;
    await this.loadPlugin(id);
  }

  async disablePlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (!plugin) return;

    await this.setPluginEnabled(id, false);
    plugin.enabled = false;
    await this.unloadPlugin(id);
  }

  async reloadPlugin(id: string) {
    await this.unloadPlugin(id);
    await this.loadPlugin(id);
  }

  async installLocalPlugin(folderPath: string) {
    const manifestPath = path.join(folderPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('No manifest.json found in the selected folder.');
    }

    const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const destPath = path.join(this.pluginsPath, manifest.id);
    
    // Simple copy simulation (in real app, use fs-extra or recursive copy)
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    fs.copyFileSync(manifestPath, path.join(destPath, 'manifest.json'));
    
    // Add to discovered plugins
    this.plugins.set(manifest.id, {
      manifest,
      path: destPath,
      enabled: true,
      loaded: false,
    });
    
    await this.enablePlugin(manifest.id);
    return this.plugins.get(manifest.id);
  }

  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }
}

export default new PluginManager();
