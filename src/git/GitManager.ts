import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitStatus {
  branch: string;
  isDirty: boolean;
  uncommittedChanges: number;
  unstagedChanges: number;
}

export interface GitCommit {
  hash: string;
  author: string;
  message: string;
  date: number;
}

export class GitManager {
  private repositoryPath: string = '';

  setRepositoryPath(path: string): void {
    this.repositoryPath = path;
  }

  getRepositoryPath(): string {
    return this.repositoryPath;
  }

  private async runGitCommand(command: string): Promise<string> {
    if (!this.repositoryPath) {
      throw new Error('Repository path not set');
    }
    const { stdout } = await execAsync(`git -C ${this.repositoryPath} ${command}`);
    return stdout.trim();
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const branch = await this.runGitCommand('rev-parse --abbrev-ref HEAD');
      const status = await this.runGitCommand('status --porcelain');
      const changes = status ? status.split('\n').length : 0;
      
      return {
        branch,
        isDirty: changes > 0,
        uncommittedChanges: changes,
        unstagedChanges: changes, // Simplified for now
      };
    } catch (error) {
      return {
        branch: 'unknown',
        isDirty: false,
        uncommittedChanges: 0,
        unstagedChanges: 0,
      };
    }
  }

  async getCommitHistory(limit: number = 10): Promise<GitCommit[]> {
    try {
      const log = await this.runGitCommand(`log -n ${limit} --pretty=format:"%H|%an|%s|%ct"`);
      return log.split('\n').map(line => {
        const [hash, author, message, date] = line.split('|');
        return {
          hash,
          author,
          message,
          date: parseInt(date) * 1000,
        };
      });
    } catch (error) {
      return [];
    }
  }

  async getBranches(): Promise<string[]> {
    try {
      const branches = await this.runGitCommand('branch --format="%(refname:short)"');
      return branches.split('\n');
    } catch (error) {
      return [];
    }
  }

  async switchBranch(branchName: string): Promise<void> {
    await this.runGitCommand(`checkout ${branchName}`);
  }

  async createBranch(branchName: string): Promise<void> {
    await this.runGitCommand(`checkout -b ${branchName}`);
  }

  async commit(message: string): Promise<void> {
    await this.runGitCommand('add .');
    await this.runGitCommand(`commit -m "${message.replace(/"/g, '\\"')}"`);
  }

  async push(): Promise<void> {
    await this.runGitCommand('push');
  }

  async pull(): Promise<void> {
    await this.runGitCommand('pull');
  }

  async stash(): Promise<void> {
    await this.runGitCommand('stash');
  }

  async unstash(): Promise<void> {
    await this.runGitCommand('stash pop');
  }
}

export default new GitManager();
