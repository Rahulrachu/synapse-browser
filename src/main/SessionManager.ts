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

/**
 * Manages user sessions, including saving, loading, updating, and deleting session data.
 * Sessions store information about open tabs and are persisted to a JSON file.
 */
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

  /**
   * Retrieves all saved user sessions.
   * @returns An array of `Session` objects.
   */
  getSessions(): Session[] {
    try {
      const data = fs.readFileSync(this.sessionsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read sessions:', error);
      return [];
    }
  }

  /**
   * Retrieves a specific session by its ID.
   * @param id The unique identifier of the session.
   * @returns The `Session` object if found, otherwise `undefined`.
   */
  getSession(id: string): Session | undefined {
    const sessions = this.getSessions();
    return sessions.find((s) => s.id === id);
  }

  /**
   * Creates and saves a new user session.
   * @param name The name of the new session.
   * @param tabs An array of `SessionTab` objects to be included in the session.
   * @returns The newly created `Session` object.
   */
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

  /**
   * Updates an existing session with new tab data and updates its `lastUsed` timestamp.
   * @param id The unique identifier of the session to update.
   * @param tabs An array of `SessionTab` objects to replace the existing tabs in the session.
   * @returns `true` if the session was updated successfully, `false` otherwise.
   */
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

  /**
   * Deletes a session by its ID.
   * @param id The unique identifier of the session to delete.
   * @returns `true` if the session was deleted successfully, `false` otherwise.
   */
  deleteSession(id: string): boolean {
    const sessions = this.getSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length < sessions.length) {
      this.saveSessions(filtered);
      return true;
    }
    return false;
  }

  /**
   * Renames an existing session.
   * @param id The unique identifier of the session to rename.
   * @param newName The new name for the session.
   * @returns `true` if the session was renamed successfully, `false` otherwise.
   */
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

  /**
   * Persists the current list of sessions to the sessions JSON file.
   * This method is called internally after any modification to the sessions.
   * @param sessions The array of `Session` objects to save.
   */
  private saveSessions(sessions: Session[]): void {
    try {
      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }
}

export default new SessionManager();
