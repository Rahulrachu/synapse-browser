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
    // Register Memory & Knowledge Engine skills
    this.registerSkill({
      id: 'memory:add',
      name: 'Add Memory',
      description: 'Store a piece of information in the long-term or short-term memory.',
      category: 'AI',
      version: '1.0.0',
      author: 'Synapse Team',
      enabled: true,
      parameters: {
        content: { type: 'string', description: 'The information to remember' },
        type: { type: 'string', enum: ['short_term', 'long_term', 'workspace', 'project', 'conversation'], default: 'short_term' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      permissions: ['memory:write'],
      capabilities: ['memory', 'knowledge'],
      source: 'builtin'
    });

    this.registerSkill({
      id: 'memory:search',
      name: 'Search Memories',
      description: 'Search through stored memories using semantic or keyword search.',
      category: 'AI',
      version: '1.0.0',
      author: 'Synapse Team',
      enabled: true,
      parameters: {
        query: { type: 'string', description: 'The search query' },
        k: { type: 'number', description: 'Number of results to return', default: 5 }
      },
      permissions: ['memory:read'],
      capabilities: ['memory', 'search'],
      source: 'builtin'
    });

    // Register Task Queue skills
    this.registerSkill({
      id: 'task-queue:enqueue',
      name: 'Enqueue Job',
      description: 'Adds a new job to the background task queue.',
      category: 'System',
      version: '1.0.0',
      author: 'Synapse Team',
      enabled: true,
      parameters: {
        name: { type: 'string', description: 'Name of the job' },
        type: { type: 'string', description: 'Type of the job (e.g., workflow-execution, ai-task)' },
        payload: { type: 'object', description: 'Data required for job execution' },
        priority: { type: 'number', description: 'Job priority (higher is more urgent)', default: 0 },
        isPersistent: { type: 'boolean', description: 'Whether the job should persist across restarts', default: true },
        maxRetries: { type: 'number', description: 'Maximum number of retries for the job', default: 3 },
        retryDelay: { type: 'number', description: 'Initial delay in ms before retrying', default: 5000 },
        metadata: { type: 'object', description: 'Additional job metadata' },
      },
      permissions: ['task-queue:write'],
      capabilities: ['background-processing', 'automation'],
      source: 'builtin'
    });

    this.registerSkill({
      id: 'task-queue:get-status',
      name: 'Get Job Status',
      description: 'Retrieves the current status of a specific job or all jobs.',
      category: 'System',
      version: '1.0.0',
      author: 'Synapse Team',
      enabled: true,
      parameters: {
        id: { type: 'string', description: 'Optional: ID of a specific job to retrieve' },
        status: { type: 'string', enum: ['queued', 'running', 'completed', 'failed', 'cancelled', 'paused'], description: 'Optional: Filter jobs by status' },
        type: { type: 'string', description: 'Optional: Filter jobs by type' },
      },
      permissions: ['task-queue:read'],
      capabilities: ['background-processing', 'monitoring'],
      source: 'builtin'
    });

    this.registerSkill({
      id: 'task-queue:cancel-job',
      name: 'Cancel Job',
      description: 'Cancels a running or queued job.',
      category: 'System',
      version: '1.0.0',
      author: 'Synapse Team',
      enabled: true,
      parameters: {
        id: { type: 'string', description: 'ID of the job to cancel' },
      },
      permissions: ['task-queue:write'],
      capabilities: ['background-processing', 'control'],
      source: 'builtin'
    });

    this.registerSkill({
      id: 'task-queue:pause-job',
      name: 'Pause Job',
      description: 'Pauses a running or queued job.',
      category: 'System',
      version: '1.0.0',
      author: 'Synapse Team',
      enabled: true,
      parameters: {
        id: { type: 'string', description: 'ID of the job to pause' },
      },
      permissions: ['task-queue:write'],
      capabilities: ['background-processing', 'control'],
      source: 'builtin'
    });

    this.registerSkill({
      id: 'task-queue:resume-job',
      name: 'Resume Job',
      description: 'Resumes a paused job.',
      category: 'System',
      version: '1.0.0',
      author: 'Synapse Team',
      enabled: true,
      parameters: {
        id: { type: 'string', description: 'ID of the job to resume' },
      },
      permissions: ['task-queue:write'],
      capabilities: ['background-processing', 'control'],
      source: 'builtin'
    });

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
