class ContextEngine {
  context = {
    currentPage: null,
    selectedText: "",
    openTabs: [],
    activeWorkspace: null,
    files: [],
    editor: null,
    terminal: null,
    git: null,
    previousSteps: [],
  };
  async updateContext(updates) {
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
      currentUrl: this.context.currentPage?.url,
    };
  }
}
export const contextEngine = new ContextEngine();
