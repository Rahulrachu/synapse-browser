import { TabData, WorkspaceLayout } from '@/common/utils';

export interface WorkspaceSession {
  id: string;
  name: string;
  tabs: TabData[];
  layout: WorkspaceLayout | null;
  activeTabId: string | null;
  createdAt: number;
  updatedAt: number;
}

export class SessionManager {
  private sessions: Map<string, WorkspaceSession> = new Map();
  private currentSessionId: string | null = null;

  createSession(name: string, tabs: TabData[], layout: WorkspaceLayout | null, activeTabId: string | null): WorkspaceSession {
    const session: WorkspaceSession = {
      id: Date.now().toString(),
      name,
      tabs,
      layout,
      activeTabId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;

    return session;
  }

  getSession(sessionId: string): WorkspaceSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): WorkspaceSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  updateSession(sessionId: string, updates: Partial<WorkspaceSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.set(sessionId, {
        ...session,
        ...updates,
        updatedAt: Date.now(),
      });
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = this.sessions.keys().next().value || null;
    }
  }

  setCurrentSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      this.currentSessionId = sessionId;
    }
  }

  getCurrentSession(): WorkspaceSession | null {
    return this.currentSessionId ? this.sessions.get(this.currentSessionId) || null : null;
  }

  renameSession(sessionId: string, newName: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.name = newName;
      session.updatedAt = Date.now();
    }
  }

  duplicateSession(sessionId: string, newName: string): WorkspaceSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const newSession: WorkspaceSession = {
      id: Date.now().toString(),
      name: newName,
      tabs: [...session.tabs],
      layout: session.layout ? { ...session.layout } : null,
      activeTabId: session.activeTabId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  exportSession(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) return '';
    return JSON.stringify(session, null, 2);
  }

  importSession(jsonString: string): WorkspaceSession | undefined {
    try {
      const session = JSON.parse(jsonString) as WorkspaceSession;
      session.id = Date.now().toString();
      session.createdAt = Date.now();
      session.updatedAt = Date.now();
      this.sessions.set(session.id, session);
      return session;
    } catch (error) {
      console.error('Failed to import session:', error);
      return undefined;
    }
  }
}

export default new SessionManager();
