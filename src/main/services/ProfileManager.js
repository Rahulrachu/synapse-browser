import * as electron from "electron";
import * as path from "path";
import * as fs from "fs";
import * as nodeCrypto from "crypto";

class ProfileManager {
  file;
  constructor() {
    const dir = path.join(electron.app.getPath("userData"), "data");
    fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "profiles.json");
    if (!fs.existsSync(this.file)) {
      const now = Date.now();
      fs.writeFileSync(
        this.file,
        JSON.stringify([{ id: "default", name: "Default", createdAt: now, updatedAt: now }], null, 2),
      );
    }
  }
  read() {
    try {
      return JSON.parse(fs.readFileSync(this.file, "utf8"));
    } catch {
      return [];
    }
  }
  write(profiles) {
    fs.writeFileSync(this.file, JSON.stringify(profiles, null, 2));
  }
  getProfiles() {
    return this.read().sort((a, b) => a.createdAt - b.createdAt);
  }
  getProfile(id) {
    return this.read().find((profile) => profile.id === id) || null;
  }
  createProfile(name, avatar) {
    const profiles = this.read();
    const now = Date.now();
    const profile = {
      id: nodeCrypto.randomUUID(),
      name: name.trim() || `Profile ${profiles.length + 1}`,
      avatar,
      createdAt: now,
      updatedAt: now,
    };
    profiles.push(profile);
    this.write(profiles);
    return profile;
  }
  updateProfile(id, patch) {
    const profiles = this.read();
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return null;
    if (patch.name !== void 0) profile.name = patch.name.trim() || profile.name;
    if (patch.avatar !== void 0) profile.avatar = patch.avatar;
    profile.updatedAt = Date.now();
    this.write(profiles);
    return profile;
  }
  deleteProfile(id) {
    if (id === "default") return false;
    const profiles = this.read();
    const remaining = profiles.filter((profile) => profile.id !== id);
    if (remaining.length === profiles.length) return false;
    this.write(remaining);
    return true;
  }
}
export const profileManager = new ProfileManager();
