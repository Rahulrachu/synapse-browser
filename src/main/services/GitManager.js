import * as child_process from "child_process";
import { promisify } from "util";

const execPromise = promisify(child_process.exec);
class GitManager {
  projectPath = "";
  setProjectPath(path2) {
    this.projectPath = path2;
  }
  async getStatus() {
    if (!this.projectPath) return null;
    try {
      const { stdout } = await execPromise("git status --porcelain", { cwd: this.projectPath });
      return stdout;
    } catch (e) {
      return null;
    }
  }
  async getCommitHistory(limit = 10) {
    if (!this.projectPath) return [];
    try {
      const { stdout } = await execPromise(`git log -n ${limit} --pretty=format:"%h - %s (%cr) <%an>"`, {
        cwd: this.projectPath,
      });
      return stdout.split("\n");
    } catch (e) {
      return [];
    }
  }
  async commit(message) {
    if (!this.projectPath) return false;
    try {
      await execPromise("git add .", { cwd: this.projectPath });
      await execPromise(`git commit -m "${message}"`, { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async push() {
    if (!this.projectPath) return false;
    try {
      await execPromise("git push", { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async pull() {
    if (!this.projectPath) return false;
    try {
      await execPromise("git pull", { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async createBranch(name) {
    if (!this.projectPath) return false;
    try {
      await execPromise(`git checkout -b ${name}`, { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async switchBranch(name) {
    if (!this.projectPath) return false;
    try {
      await execPromise(`git checkout ${name}`, { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }
  async getBranches() {
    if (!this.projectPath) return [];
    try {
      const { stdout } = await execPromise("git branch", { cwd: this.projectPath });
      return stdout.split("\n").map((b) => b.trim());
    } catch (e) {
      return [];
    }
  }
  async getDiff(filePath) {
    if (!this.projectPath) return "";
    try {
      const cmd = filePath ? `git diff ${filePath}` : "git diff";
      const { stdout } = await execPromise(cmd, { cwd: this.projectPath });
      return stdout;
    } catch (e) {
      return "";
    }
  }
}
export const gitManager = new GitManager();
