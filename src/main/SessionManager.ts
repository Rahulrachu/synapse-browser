import { nanoid } from 'nanoid';

export class SessionManager {
  private sessions: any[] = [];

  async getSessions() {
    return this.sessions;
  }

  async getSession(id: string) {
    return this.sessions.find(s => s.id === id);
  }

  async saveSession(name: string, tabs: any[]) {
    const session = {
      id: nanoid(),
      name,
      tabs,
      createdAt: new Date().toISOString()
    };
    this.sessions.push(session);
    return session;
  }

  async updateSession(id: string, tabs: any[]) {
    const session = this.sessions.find(s => s.id === id);
    if (session) {
      session.tabs = tabs;
    }
    return session;
  }

  async deleteSession(id: string) {
    this.sessions = this.sessions.filter(s => s.id !== id);
    return true;
  }

  async renameSession(id: string, newName: string) {
    const session = this.sessions.find(s => s.id === id);
    if (session) {
      session.name = newName;
    }
    return session;
  }
}

export default new SessionManager();
