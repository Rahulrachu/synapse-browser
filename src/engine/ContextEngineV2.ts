

export interface ContextState {
  activeTab: {
    id: string;
    title: string;
    url: string;
  } | null;
  openTabs: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  currentFile: {
    path: string;
    content: string;
    language: string;
  } | null;
  cursorLocation: {
    line: number;
    column: number;
  } | null;
  gitStatus: {
    branch: string;
    uncommittedChanges: number;
    unstagedChanges: number;
  } | null;
  terminalOutput: string[];
  clipboard: string | null;
  activeProject: {
    id: string;
    name: string;
    rootPath: string;
  } | null;
  previousTasks: Array<{
    id: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    timestamp: number;
  }>;
  recentActions: Array<{
    type: string;
    description: string;
    timestamp: number;
  }>;
}

export class ContextEngineV2 {
  private static instance: ContextEngineV2;
  private state: ContextState;
  private listeners: Set<(state: ContextState) => void> = new Set();

  private constructor() {
    this.state = {
      activeTab: null,
      openTabs: [],
      currentFile: null,
      cursorLocation: null,
      gitStatus: null,
      terminalOutput: [],
      clipboard: null,
      activeProject: null,
      previousTasks: [],
      recentActions: [],
    };
  }

  static getInstance(): ContextEngineV2 {
    if (!ContextEngineV2.instance) {
      ContextEngineV2.instance = new ContextEngineV2();
    }
    return ContextEngineV2.instance;
  }

  // Update context state
  updateContext(updates: Partial<ContextState>) {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.notifyListeners();
    console.log('Context updated:', this.state);
  }

  // Backward compatibility
  getContext(): ContextState {
    return this.state;
  }

  // Backward compatibility
  getContextSummary(): string {
    return this.generateContextSummary();
  }

  // Update active tab
  setActiveTab(tab: ContextState['activeTab']) {
    this.state.activeTab = tab;
    if (tab && !this.state.openTabs.find((t) => t.id === tab.id)) {
      this.state.openTabs.push(tab);
    }
    this.notifyListeners();
  }

  // Update open tabs
  setOpenTabs(tabs: ContextState['openTabs']) {
    this.state.openTabs = tabs;
    this.notifyListeners();
  }

  // Update current file
  setCurrentFile(file: ContextState['currentFile']) {
    this.state.currentFile = file;
    this.notifyListeners();
  }

  // Update cursor location
  setCursorLocation(location: ContextState['cursorLocation']) {
    this.state.cursorLocation = location;
    this.notifyListeners();
  }

  // Update git status
  setGitStatus(status: ContextState['gitStatus']) {
    this.state.gitStatus = status;
    this.notifyListeners();
  }

  // Add terminal output
  addTerminalOutput(output: string) {
    this.state.terminalOutput.push(output);
    // Keep only last 100 lines
    if (this.state.terminalOutput.length > 100) {
      this.state.terminalOutput = this.state.terminalOutput.slice(-100);
    }
    this.notifyListeners();
  }

  // Clear terminal output
  clearTerminalOutput() {
    this.state.terminalOutput = [];
    this.notifyListeners();
  }

  // Update clipboard
  setClipboard(content: string | null) {
    this.state.clipboard = content;
    this.notifyListeners();
  }

  // Set active project
  setActiveProject(project: ContextState['activeProject']) {
    this.state.activeProject = project;
    this.notifyListeners();
  }

  // Add previous task
  addPreviousTask(task: ContextState['previousTasks'][0]) {
    this.state.previousTasks.push(task);
    // Keep only last 50 tasks
    if (this.state.previousTasks.length > 50) {
      this.state.previousTasks = this.state.previousTasks.slice(-50);
    }
    this.notifyListeners();
  }

  // Update task status
  updateTaskStatus(
    taskId: string,
    status: ContextState['previousTasks'][0]['status']
  ) {
    const task = this.state.previousTasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      this.notifyListeners();
    }
  }

  // Add recent action
  addRecentAction(action: ContextState['recentActions'][0]) {
    this.state.recentActions.push(action);
    // Keep only last 100 actions
    if (this.state.recentActions.length > 100) {
      this.state.recentActions = this.state.recentActions.slice(-100);
    }
    this.notifyListeners();
  }

  // Get current state
  getState(): ContextState {
    return { ...this.state };
  }

  // Generate context summary for AI
  generateContextSummary(): string {
    const parts: string[] = [];

    if (this.state.activeProject) {
      parts.push(
        `Active Project: ${this.state.activeProject.name} (${this.state.activeProject.rootPath})`
      );
    }

    if (this.state.activeTab) {
      parts.push(`Current Tab: ${this.state.activeTab.title} (${this.state.activeTab.url})`);
    }

    if (this.state.openTabs.length > 0) {
      parts.push(
        `Open Tabs: ${this.state.openTabs.map((t) => t.title).join(', ')}`
      );
    }

    if (this.state.currentFile) {
      parts.push(
        `Current File: ${this.state.currentFile.path} (${this.state.currentFile.language})`
      );
      if (this.state.cursorLocation) {
        parts.push(
          `Cursor Location: Line ${this.state.cursorLocation.line}, Column ${this.state.cursorLocation.column}`
        );
      }
    }

    if (this.state.gitStatus) {
      parts.push(
        `Git Status: Branch ${this.state.gitStatus.branch}, ${this.state.gitStatus.uncommittedChanges} uncommitted changes`
      );
    }

    if (this.state.terminalOutput.length > 0) {
      const lastOutput = this.state.terminalOutput.slice(-5).join('\n');
      parts.push(`Recent Terminal Output:\n${lastOutput}`);
    }

    if (this.state.previousTasks.length > 0) {
      const recentTasks = this.state.previousTasks
        .slice(-5)
        .map((t) => `${t.description} (${t.status})`)
        .join(', ');
      parts.push(`Recent Tasks: ${recentTasks}`);
    }

    return parts.join('\n\n');
  }

  // Get context for specific agent type
  getContextForAgent(agentType: string): Record<string, any> {
    const baseContext = {
      timestamp: Date.now(),
      state: this.state,
    };

    switch (agentType) {
      case 'browser':
        return {
          ...baseContext,
          focus: {
            activeTab: this.state.activeTab,
            openTabs: this.state.openTabs,
          },
        };

      case 'coding':
        return {
          ...baseContext,
          focus: {
            currentFile: this.state.currentFile,
            cursorLocation: this.state.cursorLocation,
            gitStatus: this.state.gitStatus,
          },
        };

      case 'research':
        return {
          ...baseContext,
          focus: {
            openTabs: this.state.openTabs,
            recentActions: this.state.recentActions,
          },
        };

      case 'planner':
        return {
          ...baseContext,
          focus: {
            previousTasks: this.state.previousTasks,
            activeProject: this.state.activeProject,
          },
        };

      default:
        return baseContext;
    }
  }

  // Subscribe to context changes
  subscribe(listener: (state: ContextState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener({ ...this.state });
    });
  }

  // Export context for serialization
  exportContext(): string {
    return JSON.stringify(this.state, null, 2);
  }

  // Import context from serialization
  importContext(json: string) {
    try {
      const imported = JSON.parse(json);
      this.state = {
        ...this.state,
        ...imported,
      };
      this.notifyListeners();
    } catch (err) {
      console.error('Error importing context:', err);
    }
  }
}

export default ContextEngineV2;
