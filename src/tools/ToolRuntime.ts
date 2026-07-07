export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  capabilities: string[]; // New field: what the tool can achieve (e.g., 'web_browsing', 'file_editing')
  inputSchema: any;
  outputSchema: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export interface ToolExecutionOptions {
  timeout?: number;
  cancellation?: AbortSignal;
  retryCount?: number;
}

export abstract class Tool {
  abstract definition: ToolDefinition;
  abstract execute(input: any, options?: ToolExecutionOptions): Promise<ToolResult>;
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private executionHistory: any[] = [];

  register(tool: Tool) {
    this.tools.set(tool.definition.id, tool);
    console.log(`Tool registered: ${tool.definition.name} (${tool.definition.id})`);
  }

  getTool(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  findToolsByCapability(capability: string): ToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.definition.capabilities.includes(capability))
      .map(tool => tool.definition);
  }

  async invoke(id: string, input: any, options: ToolExecutionOptions = {}): Promise<ToolResult> {
    const tool = this.getTool(id);
    if (!tool) {
      return { success: false, error: `Tool not found: ${id}`, executionTime: 0 };
    }

    const startTime = Date.now();
    try {
      // Basic timeout implementation
      const timeout = options.timeout || 30000;
      const timeoutPromise = new Promise<ToolResult>((_, reject) => 
        setTimeout(() => reject(new Error('Tool execution timed out')), timeout)
      );

      const result = await Promise.race([
        tool.execute(input, options),
        timeoutPromise
      ]);

      const executionTime = Date.now() - startTime;
      const finalResult = { ...result, executionTime };
      
      this.logExecution(id, input, finalResult);
      return finalResult;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorResult = { success: false, error: error.message, executionTime };
      this.logExecution(id, input, errorResult);
      return errorResult;
    }
  }

  private logExecution(toolId: string, input: any, result: ToolResult) {
    this.executionHistory.push({
      toolId,
      input,
      result,
      timestamp: Date.now()
    });
    // Keep history manageable
    if (this.executionHistory.length > 100) {
      this.executionHistory.shift();
    }
  }

  getHistory() {
    return this.executionHistory;
  }
}

export default new ToolRegistry();
