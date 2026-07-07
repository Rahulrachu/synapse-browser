
export type AgentId = string;
export type AgentName = string;

export interface AgentCapability {
  name: string;
  description: string;
  parameters?: any; // JSON schema for capability parameters
}

export interface AgentTask {
  id: string;
  agentId?: AgentId; // Optional: if task is assigned to a specific agent
  goal: string;
  instructions: string[];
  context?: any; // Context relevant to the task
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: AgentResult;
  parentId?: string;
  dependencies?: string[]; // IDs of tasks that must be completed before this one
  priority?: number;
  estimatedDuration?: number;
}

export interface AgentResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime?: number;
}

export interface AgentMessage {
  senderId: AgentId;
  recipientId: AgentId | 'broadcast';
  type: string; // e.g., 'task_assigned', 'status_update', 'data_exchange'
  payload: any;
  timestamp: number;
}

export interface AgentContext {
  currentTask?: AgentTask;
  sharedData: Map<string, any>;
  // References to existing systems
  contextEngineState: import("../engine/ContextEngine").ContextState; // From ContextEngine.ts
  memorySystemState: import("../engine/MemorySystem").MemoryEntry[]; // From MemorySystem.ts
  planningEngineState: import("../engine/PlanningEngine").Plan | null; // From PlanningEngine.ts
  browserAutomationState: any; // Placeholder for BrowserAutomation state if needed
  toolRuntimeState: import("../tools/ToolRuntime").ToolDefinition[]; // From ToolRuntime.ts
}
