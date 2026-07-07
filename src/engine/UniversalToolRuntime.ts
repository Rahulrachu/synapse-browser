import * as fs from 'fs';
import * as path from 'path';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  parameters: ToolParameter[];
  returns: ToolReturn;
  examples: string[];
  prerequisites?: string[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

export interface ToolReturn {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
}

export interface ToolUsageRecord {
  toolId: string;
  timestamp: number;
  success: boolean;
  executionTime: number;
  parameters: Record<string, any>;
  result?: any;
  error?: string;
}

export interface ToolRanking {
  toolId: string;
  score: number;
  successRate: number;
  avgExecutionTime: number;
  usageCount: number;
}

export class UniversalToolRuntime {
  private tools: Map<string, ToolDefinition> = new Map();
  private toolCache: Map<string, ToolDefinition> = new Map();
  private usageHistory: ToolUsageRecord[] = [];
  private toolRankings: Map<string, ToolRanking> = new Map();
  private storagePath: string;

  constructor(storagePath: string) {
    this.storagePath = storagePath;
    this.ensureStorageDirectory();
    this.loadToolMetadata();
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  /**
   * Discovers available tools in the system
   */
  async discoverTools(): Promise<ToolDefinition[]> {
    const toolsDir = path.join(this.storagePath, 'tools');

    if (!fs.existsSync(toolsDir)) {
      return Array.from(this.tools.values());
    }

    const files = fs.readdirSync(toolsDir);
    const discoveredTools: ToolDefinition[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(toolsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const tool = JSON.parse(content);

        this.tools.set(tool.id, tool);
        this.toolCache.set(tool.id, tool);
        discoveredTools.push(tool);
      }
    }

    return discoveredTools;
  }

  /**
   * Dynamically loads a tool
   */
  async loadTool(toolId: string): Promise<ToolDefinition | null> {
    // Check cache first
    if (this.toolCache.has(toolId)) {
      return this.toolCache.get(toolId) || null;
    }

    // Check if tool is registered
    if (this.tools.has(toolId)) {
      const tool = this.tools.get(toolId);
      if (tool) {
        this.toolCache.set(toolId, tool);
        return tool;
      }
    }

    // Try to load from file
    const filePath = path.join(this.storagePath, 'tools', `${toolId}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const tool = JSON.parse(content);

      this.tools.set(toolId, tool);
      this.toolCache.set(toolId, tool);
      return tool;
    }

    return null;
  }

  /**
   * Unloads a tool from cache
   */
  unloadTool(toolId: string): void {
    this.toolCache.delete(toolId);
  }

  /**
   * Registers a new tool
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
    this.toolCache.set(tool.id, tool);

    // Save to disk
    const filePath = path.join(this.storagePath, 'tools', `${tool.id}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(tool, null, 2));
  }

  /**
   * Ranks tools based on context and usage history
   */
  rankTools(context: Record<string, any>): ToolRanking[] {
    const rankings: ToolRanking[] = [];

    this.tools.forEach((tool) => {
      const ranking = this.calculateToolScore(tool.id, context);
      rankings.push(ranking);
    });

    return rankings.sort((a, b) => b.score - a.score);
  }

  private calculateToolScore(toolId: string, context: Record<string, any>): ToolRanking {
    const usage = this.usageHistory.filter((u) => u.toolId === toolId);

    const successCount = usage.filter((u) => u.success).length;
    const successRate = usage.length > 0 ? successCount / usage.length : 0.5;

    const avgExecutionTime =
      usage.length > 0 ? usage.reduce((sum, u) => sum + u.executionTime, 0) / usage.length : 0;

    let score = successRate * 100;

    // Bonus for faster execution
    if (avgExecutionTime < 1000) {
      score += 20;
    } else if (avgExecutionTime > 5000) {
      score -= 10;
    }

    // Bonus for frequently used tools
    score += Math.min(usage.length * 2, 30);

    return {
      toolId,
      score: Math.max(0, Math.min(100, score)),
      successRate,
      avgExecutionTime,
      usageCount: usage.length,
    };
  }

  /**
   * Selects the best tool for a given task
   */
  selectBestTool(taskDescription: string, context: Record<string, any>): ToolDefinition | null {
    const rankings = this.rankTools(context);

    // Find tools that match the task description
    const matchingTools = rankings.filter((ranking) => {
      const tool = this.tools.get(ranking.toolId);
      if (!tool) return false;

      const description = tool.description.toLowerCase();
      const taskLower = taskDescription.toLowerCase();

      return (
        description.includes(taskLower) ||
        tool.category.toLowerCase().includes(taskLower) ||
        tool.name.toLowerCase().includes(taskLower)
      );
    });

    if (matchingTools.length > 0) {
      return this.tools.get(matchingTools[0].toolId) || null;
    }

    // Fall back to highest-ranked tool
    if (rankings.length > 0) {
      return this.tools.get(rankings[0].toolId) || null;
    }

    return null;
  }

  /**
   * Records tool usage for learning and ranking
   */
  recordUsage(record: ToolUsageRecord): void {
    this.usageHistory.push(record);

    // Update rankings
    const existingRanking = this.toolRankings.get(record.toolId);
    if (existingRanking) {
      existingRanking.usageCount++;
      if (record.success) {
        existingRanking.successRate =
          (existingRanking.successRate * (existingRanking.usageCount - 1) + 1) /
          existingRanking.usageCount;
      }
      existingRanking.avgExecutionTime =
        (existingRanking.avgExecutionTime * (existingRanking.usageCount - 1) +
          record.executionTime) /
        existingRanking.usageCount;
    }

    // Save usage history
    this.saveUsageHistory();
  }

  /**
   * Handles tool execution failures and suggests alternatives
   */
  async handleToolFailure(
    toolId: string,
    error: string,
    context: Record<string, any>
  ): Promise<ToolDefinition | null> {
    // Mark tool as having failed
    const failureRecord: ToolUsageRecord = {
      toolId,
      timestamp: Date.now(),
      success: false,
      executionTime: 0,
      parameters: context,
      error,
    };

    this.recordUsage(failureRecord);

    // Find alternative tools
    const alternatives = this.rankTools(context).filter((r) => r.toolId !== toolId);

    if (alternatives.length > 0) {
      return this.tools.get(alternatives[0].toolId) || null;
    }

    return null;
  }

  /**
   * Gets tool usage history
   */
  getUsageHistory(toolId?: string, limit: number = 100): ToolUsageRecord[] {
    let history = this.usageHistory;

    if (toolId) {
      history = history.filter((h) => h.toolId === toolId);
    }

    return history.slice(-limit);
  }

  /**
   * Gets tool rankings
   */
  getToolRankings(): ToolRanking[] {
    return Array.from(this.toolRankings.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Loads tool metadata from storage
   */
  private loadToolMetadata(): void {
    const metadataPath = path.join(this.storagePath, 'tool-metadata.json');

    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);

      metadata.tools?.forEach((tool: ToolDefinition) => {
        this.tools.set(tool.id, tool);
      });

      metadata.usageHistory?.forEach((record: ToolUsageRecord) => {
        this.usageHistory.push(record);
      });
    }
  }

  /**
   * Saves usage history to storage
   */
  private saveUsageHistory(): void {
    const historyPath = path.join(this.storagePath, 'tool-usage-history.json');
    fs.writeFileSync(historyPath, JSON.stringify(this.usageHistory, null, 2));
  }

  /**
   * Clears cache to free memory
   */
  clearCache(): void {
    this.toolCache.clear();
  }

  /**
   * Gets all registered tools
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Gets a specific tool by ID
   */
  getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }
}
