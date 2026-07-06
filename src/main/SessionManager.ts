import path from 'path';
import { app } from 'electron';
import fs from 'fs';

interface SessionTab {
  url: string;
  title: string;
}

interface Session {
  id: string;
  name: string;
  tabs: SessionTab[];
  createdAt: number;
  lastUsed: number;
}

class SessionManager {
  private dataDir: string;
  private sessionsFile: string;

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Initialize sessions file if it doesn't exist
    if (!fs.existsSync(this.sessionsFile)) {
      fs.writeFileSync(this.sessionsFile, JSON.stringify([]));
    }
  }

  getSessions(): Session[] {
    try {
      const data = fs.readFileSync(this.sessionsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read sessions:', error);
      return [];
    }
  }

  getSession(id: string): Session | undefined {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id);
  }

  saveSession(name: string, tabs: SessionTab[]): Session {
    const sessions = this.getSessions();
    const session: Session = {
      id: Date.now().toString(),
      name,
      tabs,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };
    sessions.push(session);
    this.saveSessions(sessions);
    return session;
  }

  updateSession(id: string, tabs: SessionTab[]): boolean {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === id);
    if (session) {
      session.tabs = tabs;
      session.lastUsed = Date.now();
      this.saveSessions(sessions);
      return true;
    }
    return false;
  }

  deleteSession(id: string): boolean {
    const sessions = this.getSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length < sessions.length) {
      this.saveSessions(filtered);
      return true;
    }
    return false;
  }

  renameSession(id: string, newName: string): boolean {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === id);
    if (session) {
      session.name = newName;
      this.saveSessions(sessions);
      return true;
    }
    return false;
  }

  private saveSessions(sessions: Session[]): void {
    try {
      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }
}

export default new SessionManager();
