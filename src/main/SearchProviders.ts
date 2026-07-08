import { ISearchProvider } from './SearchEngine';
import { SearchQuery, SearchResult } from '../common/types/search';
import BrowserManager from './BrowserManager';
import Storage from './Storage';
import { Note } from '../common/utils';
import WorkflowManager from './WorkflowManager';
import SkillRegistry from './SkillRegistry';
import PluginManager from './PluginManager';
import ExtensionRepositoryService from './ExtensionRepositoryService';
import DownloadManager from './DownloadManager';
import MemoryManager from '../engine/MemoryManager';
import TaskQueueManager from './TaskQueueManager';
import ProjectManager from './ProjectManager';

// Helper for fuzzy matching (simplified)
function fuzzyMatch(text: string, query: string): number {
  if (!text || !query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return 1;
  
  // Very basic fuzzy: check if characters appear in order
  let score = 0;
  let lastIdx = -1;
  for (let i = 0; i < q.length; i++) {
    const idx = t.indexOf(q[i], lastIdx + 1);
    if (idx === -1) return 0;
    lastIdx = idx;
    score++;
  }
  return score / t.length;
}

export class BrowserTabProvider implements ISearchProvider {
  id = 'tabs';
  name = 'Browser Tabs';

  async index() {
    // Tabs are dynamic, no static index needed
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const tabs = BrowserManager.getAllTabs();
    const results: SearchResult[] = [];
    for (const tab of tabs) {
      const titleScore = fuzzyMatch(tab.title, query.text);
      const urlScore = fuzzyMatch(tab.url, query.text);
      const score = Math.max(titleScore, urlScore);
      
      if (score > 0) {
        results.push({
          id: `tab-${tab.id}`,
          title: tab.title,
          description: tab.url,
          category: 'Tabs',
          icon: 'Globe',
          url: tab.url,
          score,
          metadata: { tabId: tab.id }
        });
      }
    }
    return results;
  }
}

export class NoteProvider implements ISearchProvider {
  id = 'notes';
  name = 'Notes';

  async index() {
    // Notes are in storage
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const notes: Note[] = await Storage.get('notes') || [];
    const results: SearchResult[] = [];
    for (const note of notes) {
      const titleScore = fuzzyMatch(note.title, query.text);
      const contentScore = fuzzyMatch(note.content, query.text);
      const score = Math.max(titleScore, contentScore);

      if (score > 0) {
        results.push({
          id: `note-${note.id}`,
          title: note.title,
          description: note.content.substring(0, 100),
          category: 'Notes',
          icon: 'FileText',
          score,
          metadata: { noteId: note.id }
        });
      }
    }
    return results;
  }
}

export class ProjectProvider implements ISearchProvider {
  id = 'projects';
  name = 'Projects';

  async index() {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const projects = await ProjectManager.getProjects();
    const results: SearchResult[] = [];
    for (const p of projects) {
      const score = fuzzyMatch(p.name, query.text);
      if (score > 0) {
        results.push({
          id: `project-${p.id}`,
          title: p.name,
          description: p.rootPath,
          category: 'Projects',
          icon: 'Folder',
          score,
          metadata: { projectId: p.id }
        });
      }
    }
    return results;
  }
}

export class WorkflowProvider implements ISearchProvider {
  id = 'workflows';
  name = 'Workflows';

  async index() {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const workflows = await WorkflowManager.getAllWorkflows();
    const results: SearchResult[] = [];
    for (const w of workflows) {
      const score = fuzzyMatch(w.name, query.text);
      if (score > 0) {
        results.push({
          id: `workflow-${w.id}`,
          title: w.name,
          description: w.description || 'No description',
          category: 'Workflows',
          icon: 'Play',
          score,
          metadata: { workflowId: w.id }
        });
      }
    }
    return results;
  }
}

export class SkillProvider implements ISearchProvider {
  id = 'skills';
  name = 'Skills';

  async index() {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const skills = await SkillRegistry.getAllSkills();
    const results: SearchResult[] = [];
    for (const s of skills) {
      const score = fuzzyMatch(s.name, query.text);
      if (score > 0) {
        results.push({
          id: `skill-${s.id}`,
          title: s.name,
          description: s.description,
          category: 'Skills',
          icon: 'Cpu',
          score,
          metadata: { skillId: s.id }
        });
      }
    }
    return results;
  }
}

export class PluginProvider implements ISearchProvider {
  id = 'plugins';
  name = 'Plugins';

  async index() {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const plugins = await PluginManager.getAllPlugins();
    const results: SearchResult[] = [];
    for (const p of plugins) {
      const score = fuzzyMatch(p.manifest.name, query.text);
      if (score > 0) {
        results.push({
          id: `plugin-${p.manifest.id}`,
          title: p.manifest.name,
          description: p.manifest.description,
          category: 'Plugins',
          icon: 'Zap',
          score,
          metadata: { pluginId: p.manifest.id }
        });
      }
    }
    return results;
  }
}

export class MarketplaceProvider implements ISearchProvider {
  id = 'marketplace';
  name = 'Marketplace';

  async index() {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const extensions = await ExtensionRepositoryService.searchExtensions({});
    const results: SearchResult[] = [];
    for (const e of extensions) {
      const score = fuzzyMatch(e.name, query.text);
      if (score > 0) {
        results.push({
          id: `ext-${e.id}`,
          title: e.name,
          description: e.description,
          category: 'Marketplace',
          icon: 'TrendingUp',
          score,
          metadata: { extensionId: e.id }
        });
      }
    }
    return results;
  }
}

export class DownloadProvider implements ISearchProvider {
  id = 'downloads';
  name = 'Downloads';

  async index() {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const downloads = DownloadManager.getDownloads();
    const results: SearchResult[] = [];
    for (const d of downloads) {
      const score = fuzzyMatch(d.filename, query.text);
      if (score > 0) {
        results.push({
          id: `download-${d.id}`,
          title: d.filename,
          description: d.url,
          category: 'Downloads',
          icon: 'Download',
          score,
          metadata: { downloadId: d.id }
        });
      }
    }
    return results;
  }
}

export class MemoryProvider implements ISearchProvider {
  id = 'memories';
  name = 'Memories';

  async index() {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const memories = await MemoryManager.searchMemories(query.text, { k: 20 });
    return memories.map(m => ({
      id: `memory-${m.id}`,
      title: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : ''),
      description: m.content,
      category: 'Memories',
      icon: 'Brain',
      score: 1.0, // Memory search returns relevant results
      metadata: { memoryId: m.id }
    }));
  }
}

