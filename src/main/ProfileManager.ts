import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { app } from 'electron';

export interface BrowserProfile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: number;
  updatedAt: number;
}

class ProfileManager {
  private readonly file: string;

  constructor() {
    const dir = path.join(app.getPath('userData'), 'data');
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, 'profiles.json');
    if (!fs.existsSync(this.file)) {
      const now = Date.now();
      fs.writeFileSync(this.file, JSON.stringify([{ id: 'default', name: 'Default', createdAt: now, updatedAt: now }], null, 2));
    }
  }

  private read(): BrowserProfile[] {
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8')) as BrowserProfile[];
    } catch {
      return [];
    }
  }

  private write(profiles: BrowserProfile[]): void {
    fs.writeFileSync(this.file, JSON.stringify(profiles, null, 2));
  }

  getProfiles(): BrowserProfile[] {
    return this.read().sort((a, b) => a.createdAt - b.createdAt);
  }

  getProfile(id: string): BrowserProfile | null {
    return this.read().find((profile) => profile.id === id) || null;
  }

  createProfile(name: string, avatar?: string): BrowserProfile {
    const profiles = this.read();
    const now = Date.now();
    const profile: BrowserProfile = {
      id: randomUUID(),
      name: name.trim() || `Profile ${profiles.length + 1}`,
      avatar,
      createdAt: now,
      updatedAt: now,
    };
    profiles.push(profile);
    this.write(profiles);
    return profile;
  }

  updateProfile(id: string, patch: Partial<Pick<BrowserProfile, 'name' | 'avatar'>>): BrowserProfile | null {
    const profiles = this.read();
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return null;
    if (patch.name !== undefined) profile.name = patch.name.trim() || profile.name;
    if (patch.avatar !== undefined) profile.avatar = patch.avatar;
    profile.updatedAt = Date.now();
    this.write(profiles);
    return profile;
  }

  deleteProfile(id: string): boolean {
    if (id === 'default') return false;
    const profiles = this.read();
    const remaining = profiles.filter((profile) => profile.id !== id);
    if (remaining.length === profiles.length) return false;
    this.write(remaining);
    return true;
  }
}

export default new ProfileManager();
