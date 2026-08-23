export interface WorkflowAction {
  id: string;
  type: string; // e.g., 'open-url', 'wait', 'plugin-action', 'trigger-event', 'add-memory', 'search-memory', 'enqueue-job'
  params: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  actions: WorkflowAction[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowExecutionResult {
  success: boolean;
  error?: string;
  completedActions: number;
  totalActions: number;
}
