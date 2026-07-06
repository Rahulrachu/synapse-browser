import { execSync } from 'child_process';
import path from 'path';

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

class GitManager {
  private projectPath: string = '';

  setProjectPath(projectPath: string): void {
    this.projectPath = projectPath;
  }

  getStatus(): GitStatus | null {
    if (!this.projectPath) return null;

    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectPath,
        encoding: 'utf-8',
      }).trim();

      const aheadBehind = execSync('git rev-list --left-right --count HEAD...@{u}', {
        cwd: this.projectPath,
        encoding: 'utf-8',
      })
        .trim()
        .split('\t');

      const status = execSync('git status --porcelain', {
        cwd: this.projectPath,
        encoding: 'utf-8',
      });

      const modified: string[] = [];
      const added: string[] = [];
      const deleted: string[] = [];
      const untracked: string[] = [];

      status.split('\n').forEach((line) => {
        if (!line) return;
        const file = line.substring(3);
        const code = line.substring(0, 2);

        if (code === 'M ') modified.push(file);
        else if (code === 'A ') added.push(file);
        else if (code === 'D ') deleted.push(file);
        else if (code === '??') untracked.push(file);
      });

      return {
        branch,
        ahead: parseInt(aheadBehind[0]) || 0,
        behind: parseInt(aheadBehind[1]) || 0,
        modified,
        added,
        deleted,
        untracked,
      };
    } catch (error) {
      console.error('Failed to get git status:', error);
      return null;
    }
  }

  getCommitHistory(limit: number = 10): GitCommit[] {
    if (!this.projectPath) return [];

    try {
      const output = execSync(
        `git log --oneline -${limit} --format="%H|%an|%ad|%s" --date=short`,
        {
          cwd: this.projectPath,
          encoding: 'utf-8',
        }
      );

      return output
        .trim()
        .split('\n')
        .map((line) => {
          const [hash, author, date, message] = line.split('|');
          return { hash, author, date, message };
        });
    } catch (error) {
      console.error('Failed to get commit history:', error);
      return [];
    }
  }

  commit(message: string): boolean {
    if (!this.projectPath) return false;

    try {
      execSync('git add -A', { cwd: this.projectPath });
      execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
        cwd: this.projectPath,
      });
      return true;
    } catch (error) {
      console.error('Failed to commit:', error);
      return false;
    }
  }

  push(): boolean {
    if (!this.projectPath) return false;

    try {
      execSync('git push', { cwd: this.projectPath });
      return true;
    } catch (error) {
      console.error('Failed to push:', error);
      return false;
    }
  }

  pull(): boolean {
    if (!this.projectPath) return false;

    try {
      execSync('git pull', { cwd: this.projectPath });
      return true;
    } catch (error) {
      console.error('Failed to pull:', error);
      return false;
    }
  }

  createBranch(branchName: string): boolean {
    if (!this.projectPath) return false;

    try {
      execSync(`git checkout -b ${branchName}`, { cwd: this.projectPath });
      return true;
    } catch (error) {
      console.error('Failed to create branch:', error);
      return false;
    }
  }

  switchBranch(branchName: string): boolean {
    if (!this.projectPath) return false;

    try {
      execSync(`git checkout ${branchName}`, { cwd: this.projectPath });
      return true;
    } catch (error) {
      console.error('Failed to switch branch:', error);
      return false;
    }
  }

  getBranches(): string[] {
    if (!this.projectPath) return [];

    try {
      const output = execSync('git branch -a', {
        cwd: this.projectPath,
        encoding: 'utf-8',
      });

      return output
        .trim()
        .split('\n')
        .map((line) => line.replace(/^\*?\s+/, ''));
    } catch (error) {
      console.error('Failed to get branches:', error);
      return [];
    }
  }

  getDiff(filePath?: string): string {
    if (!this.projectPath) return '';

    try {
      const cmd = filePath ? `git diff ${filePath}` : 'git diff';
      return execSync(cmd, {
        cwd: this.projectPath,
        encoding: 'utf-8',
      });
    } catch (error) {
      console.error('Failed to get diff:', error);
      return '';
    }
  }
}

export default new GitManager();
