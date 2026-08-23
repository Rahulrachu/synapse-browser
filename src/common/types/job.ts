export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface Job {
  id: string;
  name: string;
  type: string; // e.g., 'workflow-execution', 'file-processing', 'ai-task'
  status: JobStatus;
  progress: number; // 0-100
  payload: Record<string, any>; // Data needed for job execution
  result?: Record<string, any>; // Result of job execution
  error?: string; // Error message if job failed
  
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  failedAt?: number;
  cancelledAt?: number;
  
  duration?: number; // in ms
  
  retries: number;
  maxRetries: number;
  retryDelay: number; // in ms, for exponential backoff
  
  priority: number; // Higher number means higher priority
  isPersistent: boolean; // Whether to persist across application restarts
  
  metadata: Record<string, any>; // Additional metadata
}

export interface JobFilterOptions {
  status?: JobStatus;
  type?: string;
  name?: string;
  isPersistent?: boolean;
  dateRange?: { start: number; end: number };
}

export interface JobUpdatePayload {
  status?: JobStatus;
  progress?: number;
  result?: Record<string, any>;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  failedAt?: number;
  cancelledAt?: number;
  retries?: number;
  duration?: number;
}
