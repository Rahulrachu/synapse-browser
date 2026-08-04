/**
 * ContextEngineV2 - Enhanced context engine with typed state management.
 */

export interface ContextState {
  currentProject?: string;
  activeTab?: { id: string; title: string; url: string; isActive: boolean };
  openFiles?: string[];
  searchQuery?: string;
  [key: string]: any;
}

export class ContextEngineV2 {
  private static instance: ContextEngineV2 | null = null;
  private state: ContextState = {};

  private constructor() {}

  static getInstance(): ContextEngineV2 {
    if (!ContextEngineV2.instance) {
      ContextEngineV2.instance = new ContextEngineV2();
    }
    return ContextEngineV2.instance;
  }

  updateContext(updates: Partial<ContextState>): void {
    this.state = { ...this.state, ...updates };
  }

  getContext(): ContextState {
    return { ...this.state };
  }

  getContextSummary(): string {
    const parts: string[] = [];
    if (this.state.currentProject) parts.push(`Project: ${this.state.currentProject}`);
    if (this.state.activeTab) parts.push(`Active Tab: ${this.state.activeTab.title}`);
    if (this.state.openFiles) parts.push(`Open Files: ${this.state.openFiles.length}`);
    if (this.state.searchQuery) parts.push(`Search: ${this.state.searchQuery}`);
    return parts.join(' | ') || 'No context';
  }

  getState(): ContextState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {};
  }
}

const contextEngineInstance = ContextEngineV2.getInstance();
export default contextEngineInstance;
