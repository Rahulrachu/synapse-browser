import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export class GitManager {
  private projectPath: string = '';

  setProjectPath(path: string) {
    this.projectPath = path;
  }

  async getStatus() {
    if (!this.projectPath) return null;
    try {
      const { stdout } = await execPromise('git status --porcelain', { cwd: this.projectPath });
      return stdout;
    } catch (e) {
      return null;
    }
  }

  async getCommitHistory(limit: number = 10) {
    if (!this.projectPath) return [];
    try {
      const { stdout } = await execPromise(`git log -n ${limit} --pretty=format:"%h - %s (%cr) <%an>"`, { cwd: this.projectPath });
      return stdout.split('\n');
    } catch (e) {
      return [];
    }
  }

  async commit(message: string) {
    if (!this.projectPath) return false;
    try {
      await execPromise('git add .', { cwd: this.projectPath });
      await execPromise(`git commit -m "${message}"`, { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }

  async push() {
    if (!this.projectPath) return false;
    try {
      await execPromise('git push', { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }

  async pull() {
    if (!this.projectPath) return false;
    try {
      await execPromise('git pull', { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }

  async createBranch(name: string) {
    if (!this.projectPath) return false;
    try {
      await execPromise(`git checkout -b ${name}`, { cwd: this.projectPath });
      return true;
    } catch (e) {
      return false;
    }
  }

  async switchBranch(name: string) {
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
      const { stdout } = await execPromise('git branch', { cwd: this.projectPath });
      return stdout.split('\n').map(b => b.trim());
    } catch (e) {
      return [];
    }
  }

  async getDiff(filePath?: string) {
    if (!this.projectPath) return '';
    try {
      const cmd = filePath ? `git diff ${filePath}` : 'git diff';
      const { stdout } = await execPromise(cmd, { cwd: this.projectPath });
      return stdout;
    } catch (e) {
      return '';
    }
  }
}

export default new GitManager();
