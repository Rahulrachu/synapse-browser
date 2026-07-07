import { TabData, Note } from '../common/utils';
import { ProjectFile } from '../main/ProjectManager';

export interface ContextState {
  activeTab?: TabData;
  visibleTabs: TabData[];
  openFiles: string[];
  recentNotes: Note[];
  gitStatus?: any;
  currentProject?: string;
}

class ContextEngine {
  private state: ContextState = {
    visibleTabs: [],
    openFiles: [],
    recentNotes: [],
  };

  updateContext(updates: Partial<ContextState>) {
    this.state = { ...this.state, ...updates };
    console.log('Context updated:', this.state);
  }

  getContext(): ContextState {
    return this.state;
  }

  // Generate a summary string of the current context for AI prompts
  getContextSummary(): string {
    let summary = 'Current Context:\n';
    if (this.state.activeTab) {
      summary += `- Active Tab: ${this.state.activeTab.title} (${this.state.activeTab.url})\n`;
    }
    if (this.state.openFiles.length > 0) {
      summary += `- Open Files: ${this.state.openFiles.join(', ')}\n`;
    }
    if (this.state.currentProject) {
      summary += `- Project: ${this.state.currentProject}\n`;
    }
    return summary;
  }
}

export default new ContextEngine();
