import React, { useEffect, useState } from 'react';
import { useEventBus } from '../hooks/useEventBus';
import { useIPC } from '../hooks/useIPC';
import './AgentMonitorPanel.css';

interface Agent {
  id: string;
  name: string;
  capabilities: any[];
}

interface AgentTask {
  id: string;
  agentId: string;
  goal: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'paused';
  progress?: number;
  startedAt?: number;
  completedAt?: number;
}

interface ExecutionRecord {
  taskId: string;
  agentId: string;
  goal: string;
  status: string;
  duration: number;
  timestamp: number;
}

export const AgentMonitorPanel: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeTasks, setActiveTasks] = useState<Map<string, AgentTask>>(new Map());
  const [history, setHistory] = useState<ExecutionRecord[]>([]);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [resourceUsage, setResourceUsage] = useState<any>({});

  const { invoke } = useIPC();
  const { subscribe } = useEventBus();

  useEffect(() => {
    loadAgents();
    loadHistory();
    subscribeToEvents();
  }, []);

  const loadAgents = async () => {
    try {
      const agentList = await invoke('agent-list');
      setAgents(agentList);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const executionHistory = await invoke('agent:get-history');
      const records: ExecutionRecord[] = executionHistory.map((job: any) => ({
        taskId: job.id,
        agentId: job.metadata?.agentId || 'unknown',
        goal: job.payload?.goal || job.name,
        status: job.status,
        duration: job.duration || 0,
        timestamp: job.createdAt
      }));
      setHistory(records);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const subscribeToEvents = () => {
    subscribe('agent:task-started', (event: any) => {
      const { taskId } = event.payload;
      setActiveTasks(prev => new Map(prev).set(taskId, {
        id: taskId,
        agentId: 'unknown',
        goal: 'Loading...',
        status: 'in-progress',
        progress: 0,
        startedAt: Date.now()
      }));
    });

    subscribe('agent:task-completed', (event: any) => {
      const { taskId, result } = event.payload;
      setActiveTasks(prev => {
        const updated = new Map(prev);
        const task = updated.get(taskId);
        if (task) {
          task.status = 'completed';
          task.completedAt = Date.now();
        }
        return updated;
      });
      loadHistory();
    });

    subscribe('agent:task-failed', (event: any) => {
      const { taskId } = event.payload;
      setActiveTasks(prev => {
        const updated = new Map(prev);
        const task = updated.get(taskId);
        if (task) {
          task.status = 'failed';
          task.completedAt = Date.now();
        }
        return updated;
      });
      loadHistory();
    });

    subscribe('agent:task-paused', (event: any) => {
      const { taskId } = event.payload;
      setActiveTasks(prev => {
        const updated = new Map(prev);
        const task = updated.get(taskId);
        if (task) {
          task.status = 'paused';
        }
        return updated;
      });
    });

    subscribe('agent:task-resumed', (event: any) => {
      const { taskId } = event.payload;
      setActiveTasks(prev => {
        const updated = new Map(prev);
        const task = updated.get(taskId);
        if (task) {
          task.status = 'in-progress';
        }
        return updated;
      });
    });
  };

  const handlePauseTask = async (taskId: string) => {
    try {
      await invoke('agent:pause-task', taskId);
    } catch (error) {
      console.error('Failed to pause task:', error);
    }
  };

  const handleResumeTask = async (taskId: string) => {
    try {
      await invoke('agent:resume-task', taskId);
    } catch (error) {
      console.error('Failed to resume task:', error);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await invoke('agent:cancel-task', taskId);
    } catch (error) {
      console.error('Failed to cancel task:', error);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      await invoke('agent:retry-task', taskId);
    } catch (error) {
      console.error('Failed to retry task:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in-progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'paused':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="agent-monitor-panel">
      <div className="panel-header">
        <h2>Agent Monitor</h2>
        <div className="agent-stats">
          <span className="stat">Active Agents: {agents.length}</span>
          <span className="stat">Running Tasks: {Array.from(activeTasks.values()).filter(t => t.status === 'in-progress').length}</span>
        </div>
      </div>

      <div className="panel-content">
        <div className="active-tasks-section">
          <h3>Active Tasks</h3>
          {Array.from(activeTasks.values()).length === 0 ? (
            <p className="empty-state">No active tasks</p>
          ) : (
            <div className="tasks-list">
              {Array.from(activeTasks.values()).map(task => (
                <div
                  key={task.id}
                  className="task-item"
                  onClick={() => setSelectedTask(task)}
                  style={{ borderLeftColor: getStatusColor(task.status) }}
                >
                  <div className="task-header">
                    <span className="task-id">{task.id}</span>
                    <span className={`task-status status-${task.status}`}>{task.status}</span>
                  </div>
                  <div className="task-goal">{task.goal}</div>
                  {task.progress !== undefined && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${task.progress}%` }}></div>
                    </div>
                  )}
                  <div className="task-actions">
                    {task.status === 'in-progress' && (
                      <>
                        <button onClick={() => handlePauseTask(task.id)} className="action-btn pause-btn">Pause</button>
                        <button onClick={() => handleCancelTask(task.id)} className="action-btn cancel-btn">Cancel</button>
                      </>
                    )}
                    {task.status === 'paused' && (
                      <button onClick={() => handleResumeTask(task.id)} className="action-btn resume-btn">Resume</button>
                    )}
                    {task.status === 'failed' && (
                      <button onClick={() => handleRetryTask(task.id)} className="action-btn retry-btn">Retry</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="execution-history-section">
          <h3>Execution History</h3>
          {history.length === 0 ? (
            <p className="empty-state">No execution history</p>
          ) : (
            <div className="history-list">
              {history.slice(-10).reverse().map(record => (
                <div key={record.taskId} className="history-item">
                  <div className="history-header">
                    <span className="history-goal">{record.goal}</span>
                    <span className={`history-status status-${record.status}`}>{record.status}</span>
                  </div>
                  <div className="history-meta">
                    <span className="meta-item">Agent: {record.agentId}</span>
                    <span className="meta-item">Duration: {formatDuration(record.duration)}</span>
                    <span className="meta-item">Time: {new Date(record.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <div className="task-detail-panel">
          <div className="detail-header">
            <h3>Task Details</h3>
            <button className="close-btn" onClick={() => setSelectedTask(null)}>×</button>
          </div>
          <div className="detail-content">
            <div className="detail-field">
              <label>Task ID:</label>
              <code>{selectedTask.id}</code>
            </div>
            <div className="detail-field">
              <label>Agent ID:</label>
              <code>{selectedTask.agentId}</code>
            </div>
            <div className="detail-field">
              <label>Goal:</label>
              <p>{selectedTask.goal}</p>
            </div>
            <div className="detail-field">
              <label>Status:</label>
              <span className={`status-badge status-${selectedTask.status}`}>{selectedTask.status}</span>
            </div>
            {selectedTask.progress !== undefined && (
              <div className="detail-field">
                <label>Progress:</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${selectedTask.progress}%` }}></div>
                </div>
                <span>{selectedTask.progress}%</span>
              </div>
            )}
            {selectedTask.startedAt && (
              <div className="detail-field">
                <label>Started:</label>
                <span>{new Date(selectedTask.startedAt).toLocaleString()}</span>
              </div>
            )}
            {selectedTask.completedAt && (
              <div className="detail-field">
                <label>Completed:</label>
                <span>{new Date(selectedTask.completedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentMonitorPanel;
