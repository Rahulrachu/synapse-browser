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

/**
 * Manages Git operations for a given project path.
 * Provides functionalities to get repository status, commit history, commit changes, push, pull,
 * create branches, switch branches, list branches, and get file differences.
 */
class GitManager {
  private projectPath: string = '';

  /**
   * Sets the project path for Git operations.
   * @param projectPath The absolute path to the Git repository.
   */
  setProjectPath(projectPath: string): void {
    this.projectPath = projectPath;
  }

  /**
   * Retrieves the current Git status of the repository.
   * @returns A `GitStatus` object if successful, otherwise `null`.
   */
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

  /**
   * Retrieves a list of recent commit history.
   * @param limit The maximum number of commits to retrieve. Defaults to 10.
   * @returns An array of `GitCommit` objects.
   */
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

  /**
   * Stages all changes and commits them with the given message.
   * @param message The commit message.
   * @returns `true` if the commit was successful, `false` otherwise.
   */
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

  /**
   * Pushes committed changes to the remote repository.
   * @returns `true` if the push was successful, `false` otherwise.
   */
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

  /**
   * Pulls changes from the remote repository.
   * @returns `true` if the pull was successful, `false` otherwise.
   */
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

  /**
   * Creates a new Git branch and switches to it.
   * @param branchName The name of the new branch.
   * @returns `true` if the branch was created and switched to successfully, `false` otherwise.
   */
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

  /**
   * Switches to an existing Git branch.
   * @param branchName The name of the branch to switch to.
   * @returns `true` if the branch was switched to successfully, `false` otherwise.
   */
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

  /**
   * Retrieves a list of all local and remote Git branches.
   * @returns An array of branch names.
   */
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

  /**
   * Retrieves the Git diff for the entire repository or a specific file.
   * @param filePath Optional. The path to a specific file to get the diff for.
   * @returns The diff as a string.
   */
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
