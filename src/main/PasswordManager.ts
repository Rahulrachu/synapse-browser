import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  updatedAt: number;
}

class PasswordManager {
  private get filePath(): string {
    return path.join(app.getPath('userData'), 'passwords.enc');
  }

  private readEntries(): PasswordEntry[] {
    try {
      if (!fs.existsSync(this.filePath)) return [];
      const encrypted = fs.readFileSync(this.filePath, 'utf8');
      if (!safeStorage.isEncryptionAvailable()) return [];
      const decrypted = safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
      const entries = JSON.parse(decrypted);
      return Array.isArray(entries) ? entries : [];
    } catch {
      return [];
    }
  }

  private writeEntries(entries: PasswordEntry[]): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Windows secure storage is unavailable. Passwords were not saved.');
    }
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const encrypted = safeStorage.encryptString(JSON.stringify(entries));
    fs.writeFileSync(this.filePath, encrypted.toString('base64'), { mode: 0o600 });
  }

  list(): Array<Omit<PasswordEntry, 'password'>> {
    return this.readEntries().map(({ password: _password, ...entry }) => entry);
  }

  save(input: { id?: string; name: string; username: string; password: string; url?: string }): void {
    const entries = this.readEntries();
    const entry: PasswordEntry = {
      id: input.id || crypto.randomUUID(),
      name: input.name.trim(),
      username: input.username,
      password: input.password,
      url: input.url?.trim(),
      updatedAt: Date.now(),
    };
    const index = entries.findIndex(item => item.id === entry.id);
    if (index >= 0) entries[index] = entry;
    else entries.push(entry);
    this.writeEntries(entries);
  }

  remove(id: string): void {
    this.writeEntries(this.readEntries().filter(entry => entry.id !== id));
  }

  getForAutofill(id: string): Pick<PasswordEntry, 'username' | 'password' | 'url'> {
    const entry = this.readEntries().find(item => item.id === id);
    if (!entry) throw new Error('Password entry not found.');
    return { username: entry.username, password: entry.password, url: entry.url };
  }
}

export default new PasswordManager();
