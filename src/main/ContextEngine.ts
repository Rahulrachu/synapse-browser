export class ContextEngine {
  private context: any = {
    currentPage: null,
    selectedText: '',
    openTabs: [],
    activeWorkspace: null,
    files: [],
    editor: null,
    terminal: null,
    git: null,
    previousSteps: []
  };

  async updateContext(updates: any) {
    this.context = { ...this.context, ...updates };
    return this.context;
  }

  async getContext() {
    return this.context;
  }

  async getContextSummary() {
    return {
      tabCount: this.context.openTabs.length,
      hasActiveWorkspace: !!this.context.activeWorkspace,
      currentUrl: this.context.currentPage?.url
    };
  }
}

export default new ContextEngine();
