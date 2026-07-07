
import { AgentId, AgentMessage, AgentTask, AgentResult } from './types';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface AgentLogEntry {
  timestamp: number;
  level: LogLevel;
  agentId?: AgentId;
  message: string;
  details?: any;
}

class AgentLogger {
  private logs: AgentLogEntry[] = [];
  private maxLogs: number = 1000;

  public log(level: LogLevel, message: string, agentId?: AgentId, details?: any) {
    const entry: AgentLogEntry = {
      timestamp: Date.now(),
      level,
      agentId,
      message,
      details
    };
    
    this.logs.push(entry);
    console.log(`[AgentRuntime][${level}]${agentId ? `[${agentId}]` : ''} ${message}`, details || '');

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  public debug(message: string, agentId?: AgentId, details?: any) {
    this.log(LogLevel.DEBUG, message, agentId, details);
  }

  public info(message: string, agentId?: AgentId, details?: any) {
    this.log(LogLevel.INFO, message, agentId, details);
  }

  public warn(message: string, agentId?: AgentId, details?: any) {
    this.log(LogLevel.WARN, message, agentId, details);
  }

  public error(message: string, agentId?: AgentId, details?: any) {
    this.log(LogLevel.ERROR, message, agentId, details);
  }

  public getLogs(filter?: { agentId?: AgentId; level?: LogLevel }): AgentLogEntry[] {
    return this.logs.filter(entry => {
      if (filter?.agentId && entry.agentId !== filter.agentId) return false;
      if (filter?.level && entry.level !== filter.level) return false;
      return true;
    });
  }

  public clearLogs() {
    this.logs = [];
  }
}

export default new AgentLogger();
