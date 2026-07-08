import { ipcMain } from 'electron';
import { Skill, SkillSearchOptions } from '../common/types/skill';
import Storage from './Storage';
import toolRegistry from '../tools/ToolRuntime';

class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private STORAGE_KEY = 'skill-states';

  constructor() {
    this.initializeBuiltinSkills();
    this.setupIPCHandlers();
  }

  private async initializeBuiltinSkills() {
    // Bridge existing tools to skills
    const tools = toolRegistry.getAllTools();
    for (const tool of tools) {
      this.registerSkill({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: 'Browser',
        version: '1.0.0',
        author: 'Synapse Team',
        enabled: true,
        parameters: tool.inputSchema,
        permissions: tool.permissions,
        capabilities: tool.capabilities || [],
        source: 'builtin'
      });
    }

    // Load enabled states from storage
    const states = await Storage.get(this.STORAGE_KEY) || {};
    for (const [id, enabled] of Object.entries(states)) {
      const skill = this.skills.get(id);
      if (skill) {
        skill.enabled = enabled as boolean;
      }
    }
  }

  private setupIPCHandlers() {
    ipcMain.handle('skill:get-all', () => this.getAllSkills());
    ipcMain.handle('skill:search', (_, options: SkillSearchOptions) => this.searchSkills(options));
    ipcMain.handle('skill:toggle', (_, id: string, enabled: boolean) => this.toggleSkill(id, enabled));
  }

  registerSkill(skill: Skill) {
    this.skills.set(skill.id, skill);
    console.log(`Skill registered: ${skill.name} (${skill.id})`);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  async searchSkills(options: SkillSearchOptions): Promise<Skill[]> {
    let results = this.getAllSkills();

    if (options.query) {
      const query = options.query.toLowerCase();
      results = results.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.description.toLowerCase().includes(query)
      );
    }

    if (options.category && options.category !== 'All') {
      results = results.filter(s => s.category === options.category);
    }

    if (options.capability) {
      results = results.filter(s => s.capabilities.includes(options.capability!));
    }

    return results;
  }

  async toggleSkill(id: string, enabled: boolean) {
    const skill = this.skills.get(id);
    if (skill) {
      skill.enabled = enabled;
      const states = await Storage.get(this.STORAGE_KEY) || {};
      states[id] = enabled;
      await Storage.set(this.STORAGE_KEY, states);
    }
  }
}

export default new SkillRegistry();
