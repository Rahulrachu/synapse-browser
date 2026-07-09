import { MemorySystem } from './MemorySystem.js';

export interface ProjectMemory {
  projectId: string;
  projectName: string;
  projectPath: string;
  summary: string;
  architecture: string;
  designDecisions: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: number;
  }>;
  todos: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    timestamp: number;
  }>;
  frequentlyUsedCommands: Array<{
    command: string;
    description: string;
    frequency: number;
  }>;
  conversations: Array<{
    id: string;
    title: string;
    summary: string;
    timestamp: number;
  }>;
  codeSnippets: Array<{
    id: string;
    title: string;
    code: string;
    language: string;
    timestamp: number;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    timestamp: number;
  }>;
}

export class ProjectMemoryService {
  private memorySystem: MemorySystem;
  private projectMemories: Map<string, ProjectMemory> = new Map();

  constructor(memorySystem: MemorySystem) {
    this.memorySystem = memorySystem;
  }

  // Create or update project memory
  async saveProjectMemory(memory: ProjectMemory): Promise<void> {
    this.projectMemories.set(memory.projectId, memory);

    // Store in memory system
    await this.memorySystem.addMemory(
      'project',
      JSON.stringify(memory),
      {
        projectId: memory.projectId,
        projectName: memory.projectName,
        category: 'project',
      }
    );
  }

  // Get project memory
  async getProjectMemory(projectId: string): Promise<ProjectMemory | null> {
    if (this.projectMemories.has(projectId)) {
      return this.projectMemories.get(projectId) || null;
    }

    // Try to retrieve from memory system
    const memories = await this.memorySystem.searchMemories(projectId, 5);
    if (memories.length > 0) {
      try {
        const memory = JSON.parse(memories[0].content);
        this.projectMemories.set(projectId, memory);
        return memory;
      } catch (err) {
        console.error('Error parsing project memory:', err);
      }
    }

    return null;
  }

  // Add design decision
  async addDesignDecision(
    projectId: string,
    title: string,
    description: string
  ): Promise<void> {
    let memory = await this.getProjectMemory(projectId);
    if (!memory) {
      memory = this.createEmptyProjectMemory(projectId);
    }

    memory.designDecisions.push({
      id: Date.now().toString(),
      title,
      description,
      timestamp: Date.now(),
    });

    await this.saveProjectMemory(memory);
  }

  // Add TODO
  async addTodo(
    projectId: string,
    title: string,
    description: string
  ): Promise<void> {
    let memory = await this.getProjectMemory(projectId);
    if (!memory) {
      memory = this.createEmptyProjectMemory(projectId);
    }

    memory.todos.push({
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      timestamp: Date.now(),
    });

    await this.saveProjectMemory(memory);
  }

  // Mark TODO as completed
  async completeTodo(projectId: string, todoId: string): Promise<void> {
    const memory = await this.getProjectMemory(projectId);
    if (memory) {
      const todo = memory.todos.find((t) => t.id === todoId);
      if (todo) {
        todo.completed = true;
        await this.saveProjectMemory(memory);
      }
    }
  }

  // Record frequently used command
  async recordCommand(projectId: string, command: string, description: string): Promise<void> {
    let memory = await this.getProjectMemory(projectId);
    if (!memory) {
      memory = this.createEmptyProjectMemory(projectId);
    }

    const existing = memory.frequentlyUsedCommands.find((c) => c.command === command);
    if (existing) {
      existing.frequency++;
    } else {
      memory.frequentlyUsedCommands.push({
        command,
        description,
        frequency: 1,
      });
    }

    // Sort by frequency
    memory.frequentlyUsedCommands.sort((a, b) => b.frequency - a.frequency);

    await this.saveProjectMemory(memory);
  }

  // Add conversation
  async addConversation(
    projectId: string,
    title: string,
    summary: string
  ): Promise<string> {
    let memory = await this.getProjectMemory(projectId);
    if (!memory) {
      memory = this.createEmptyProjectMemory(projectId);
    }

    const conversationId = Date.now().toString();
    memory.conversations.push({
      id: conversationId,
      title,
      summary,
      timestamp: Date.now(),
    });

    await this.saveProjectMemory(memory);
    return conversationId;
  }

  // Add code snippet
  async addCodeSnippet(
    projectId: string,
    title: string,
    code: string,
    language: string
  ): Promise<void> {
    let memory = await this.getProjectMemory(projectId);
    if (!memory) {
      memory = this.createEmptyProjectMemory(projectId);
    }

    memory.codeSnippets.push({
      id: Date.now().toString(),
      title,
      code,
      language,
      timestamp: Date.now(),
    });

    await this.saveProjectMemory(memory);
  }

  // Add note
  async addNote(projectId: string, title: string, content: string): Promise<void> {
    let memory = await this.getProjectMemory(projectId);
    if (!memory) {
      memory = this.createEmptyProjectMemory(projectId);
    }

    memory.notes.push({
      id: Date.now().toString(),
      title,
      content,
      timestamp: Date.now(),
    });

    await this.saveProjectMemory(memory);
  }

  // Get all TODOs for project
  async getProjectTodos(projectId: string): Promise<ProjectMemory['todos']> {
    const memory = await this.getProjectMemory(projectId);
    return memory?.todos || [];
  }

  // Get all design decisions for project
  async getDesignDecisions(projectId: string): Promise<ProjectMemory['designDecisions']> {
    const memory = await this.getProjectMemory(projectId);
    return memory?.designDecisions || [];
  }

  // Get frequently used commands for project
  async getFrequentCommands(projectId: string): Promise<ProjectMemory['frequentlyUsedCommands']> {
    const memory = await this.getProjectMemory(projectId);
    return memory?.frequentlyUsedCommands || [];
  }

  // Get project summary
  async getProjectSummary(projectId: string): Promise<string> {
    const memory = await this.getProjectMemory(projectId);
    return memory?.summary || '';
  }

  // Update project summary
  async updateProjectSummary(projectId: string, summary: string): Promise<void> {
    let memory = await this.getProjectMemory(projectId);
    if (!memory) {
      memory = this.createEmptyProjectMemory(projectId);
    }

    memory.summary = summary;
    await this.saveProjectMemory(memory);
  }

  // Search project memories
  async searchProjectMemories(projectId: string, query: string): Promise<any[]> {
    const memory = await this.getProjectMemory(projectId);
    if (!memory) return [];

    const results: any[] = [];

    // Search in design decisions
    results.push(
      ...memory.designDecisions.filter(
        (d) =>
          d.title.toLowerCase().includes(query.toLowerCase()) ||
          d.description.toLowerCase().includes(query.toLowerCase())
      )
    );

    // Search in TODOs
    results.push(
      ...memory.todos.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase())
      )
    );

    // Search in code snippets
    results.push(
      ...memory.codeSnippets.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.code.toLowerCase().includes(query.toLowerCase())
      )
    );

    // Search in notes
    results.push(
      ...memory.notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.content.toLowerCase().includes(query.toLowerCase())
      )
    );

    return results;
  }

  // Create empty project memory
  private createEmptyProjectMemory(projectId: string): ProjectMemory {
    return {
      projectId,
      projectName: projectId,
      projectPath: '',
      summary: '',
      architecture: '',
      designDecisions: [],
      todos: [],
      frequentlyUsedCommands: [],
      conversations: [],
      codeSnippets: [],
      notes: [],
    };
  }

  // Clear project memory
  async clearProjectMemory(projectId: string): Promise<void> {
    this.projectMemories.delete(projectId);
    // Note: MemorySystem doesn't have a delete method, so we'll just clear locally
  }
}
