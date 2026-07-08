export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'Browser' | 'Files' | 'System' | 'AI' | 'Plugin' | 'Workflow';
  version: string;
  author: string;
  enabled: boolean;
  parameters: Record<string, any>;
  permissions: string[];
  capabilities: string[];
  documentation?: string;
  examples?: string[];
  source: 'builtin' | 'plugin' | 'workflow';
}

export interface SkillSearchOptions {
  query?: string;
  category?: string;
  capability?: string;
}
