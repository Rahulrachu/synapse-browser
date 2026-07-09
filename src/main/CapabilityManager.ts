import PermissionManager from './PermissionManager.js';

class CapabilityManager {
  private capabilityMap: Map<string, string[]> = new Map([
    ['web_browsing', ['network', 'browser_tabs']],
    ['file_management', ['filesystem']],
    ['automation', ['process', 'storage']],
    ['communication', ['notifications', 'network']],
    ['development', ['terminal', 'git', 'filesystem']]
  ]);

  async checkCapability(scope: string, capability: string): Promise<boolean> {
    const requiredPermissions = this.capabilityMap.get(capability);
    if (!requiredPermissions) return false;

    for (const resource of requiredPermissions) {
      const hasPermission = await PermissionManager.checkPermission(scope, resource);
      if (!hasPermission) return false;
    }

    return true;
  }

  getRequiredPermissions(capability: string): string[] {
    return this.capabilityMap.get(capability) || [];
  }

  getAllCapabilities(): string[] {
    return Array.from(this.capabilityMap.keys());
  }
}

export default new CapabilityManager();
