import { nanoid } from "nanoid";

class SessionManager {
  sessions = [];
  async getSessions() {
    return this.sessions;
  }
  async getSession(id) {
    return this.sessions.find((s) => s.id === id);
  }
  async saveSession(name, tabs) {
    const session = {
      id: nanoid(),
      name,
      tabs,
      createdAt: new Date().toISOString(),
    };
    this.sessions.push(session);
    return session;
  }
  async updateSession(id, tabs) {
    const session = this.sessions.find((s) => s.id === id);
    if (session) {
      session.tabs = tabs;
    }
    return session;
  }
  async deleteSession(id) {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    return true;
  }
  async renameSession(id, newName) {
    const session = this.sessions.find((s) => s.id === id);
    if (session) {
      session.name = newName;
    }
    return session;
  }
}
export const sessionManager = new SessionManager();
