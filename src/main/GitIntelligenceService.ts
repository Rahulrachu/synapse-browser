import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
  summary: string;
}

export interface PRInfo {
  number: number;
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  filesChanged: number;
  additions: number;
  deletions: number;
}

export interface BranchAnalysis {
  name: string;
  ahead: number;
  behind: number;
  lastCommit: string;
  lastCommitDate: string;
}

export interface CodeReviewSuggestion {
  file: string;
  line: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
}

/**
 * Provides services for interacting with Git repositories to extract intelligence.
 * This includes fetching commit information, analyzing branches, detecting merge conflicts,
 * generating code review suggestions, retrieving repository statistics, generating release notes,
 * and analyzing code changes.
 */
export class GitIntelligenceService {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Retrieves the full commit message for a given commit hash.
   * @param hash The full or short hash of the commit.
   * @returns A promise that resolves to the commit message as a string.
   */
  async getCommitSummary(hash: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `git log -1 --format=%B ${hash}`,
        { cwd: this.projectPath }
      );
      return stdout.trim();
    } catch (err) {
      console.error('Error getting commit summary:', err);
      return '';
    }
  }

  /**
   * Retrieves a list of recent commits.
   * @param count The number of recent commits to retrieve. Defaults to 10.
   * @returns A promise that resolves to an array of `CommitInfo` objects.
   */
  async getRecentCommits(count: number = 10): Promise<CommitInfo[]> {
    try {
      const { stdout } = await execAsync(
        `git log -${count} --format=%H|%an|%ai|%s`,
        { cwd: this.projectPath }
      );

      return stdout
        .trim()
        .split('\n')
        .map((line) => {
          const [hash, author, date, message] = line.split('|');
          return {
            hash,
            author,
            date,
            message,
            summary: message.substring(0, 100),
          };
        });
    } catch (err) {
      console.error('Error getting recent commits:', err);
      return [];
    }
  }

  /**
   * Analyzes a specific Git branch, providing information on its divergence from the remote (ahead/behind).
   * @param branchName The name of the branch to analyze.
   * @returns A promise that resolves to a `BranchAnalysis` object.
   */
  async analyzeBranch(branchName: string): Promise<BranchAnalysis> {
    try {
      const { stdout: aheadBehind } = await execAsync(
        `git rev-list --left-right --count origin/${branchName}...${branchName}`,
        { cwd: this.projectPath }
      );

      const [behind, ahead] = aheadBehind.trim().split('\t').map(Number);

      const { stdout: lastCommit } = await execAsync(
        `git log -1 --format=%H ${branchName}`,
        { cwd: this.projectPath }
      );

      const { stdout: lastCommitDate } = await execAsync(
        `git log -1 --format=%ai ${branchName}`,
        { cwd: this.projectPath }
      );

      return {
        name: branchName,
        ahead,
        behind,
        lastCommit: lastCommit.trim(),
        lastCommitDate: lastCommitDate.trim(),
      };
    } catch (err) {
      console.error('Error analyzing branch:', err);
      return {
        name: branchName,
        ahead: 0,
        behind: 0,
        lastCommit: '',
        lastCommitDate: '',
      };
    }
  }

  /**
   * Detects potential merge conflicts between the current branch and a specified branch.
   * It performs a dry-run merge and then aborts it to avoid modifying the repository state.
   * @param branchName The name of the branch to check for conflicts against.
   * @returns A promise that resolves to an array of file paths that would have conflicts.
   */
  async detectMergeConflicts(branchName: string): Promise<string[]> {
    try {
      // Try to merge and check for conflicts
      const { stdout } = await execAsync(
        `git merge --no-commit --no-ff ${branchName} 2>&1 || true`,
        { cwd: this.projectPath }
      );

      // Get conflicted files
      const { stdout: conflictedFiles } = await execAsync(
        'git diff --name-only --diff-filter=U',
        { cwd: this.projectPath }
      );

      // Abort the merge
      await execAsync('git merge --abort', { cwd: this.projectPath }).catch(
        () => {}
      );

      return conflictedFiles
        .trim()
        .split('\n')
        .filter((f) => f.length > 0);
    } catch (err) {
      console.error('Error detecting merge conflicts:', err);
      return [];
    }
  }

  /**
   * Generates basic code review suggestions for a given file.
   * This includes checks for `console.log`, placeholder comments (TODO/FIXME/HACK/BUG), long lines, and high nesting levels.
   * @param filePath The path to the file to review.
   * @returns A promise that resolves to an array of `CodeReviewSuggestion` objects.
   */
  async generateCodeReviewSuggestions(
    filePath: string
  ): Promise<CodeReviewSuggestion[]> {
    const suggestions: CodeReviewSuggestion[] = [];

    try {
      const content = fs.readFileSync(
        path.join(this.projectPath, filePath),
        'utf-8'
      );
      const lines = content.split('\n');

      // Basic code review checks
      lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // Check for console.log statements
        if (line.includes('console.log')) {
          suggestions.push({
            file: filePath,
            line: lineNumber,
            severity: 'warning',
            message: 'console.log statement found in code',
            suggestion: 'Remove console.log or use proper logging library',
          });
        }

        // Check for placeholder comments
        const placeholderMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|BUG):?\s*(.*)/i);
        if (placeholderMatch) {
          suggestions.push({
            file: filePath,
            line: lineNumber,
            severity: placeholderMatch[1].toUpperCase() === 'BUG' ? 'warning' : 'info',
            message: `${placeholderMatch[1]} comment found`,
            suggestion: `Resolve this ${placeholderMatch[1]} or track it in the project management system.`,
          });
        }

        // Check for long lines
        if (line.length > 120) {
          suggestions.push({
            file: filePath,
            line: lineNumber,
            severity: 'info',
            message: 'Line is too long',
            suggestion: 'Consider breaking this line into multiple lines',
          });
        }

        // Check for multiple nested conditions
        const nestingLevel = (line.match(/\{/g) || []).length;
        if (nestingLevel > 4) {
          suggestions.push({
            file: filePath,
            line: lineNumber,
            severity: 'warning',
            message: 'High nesting level detected',
            suggestion: 'Consider refactoring to reduce nesting',
          });
        }
      });
    } catch (err) {
      console.error('Error generating code review suggestions:', err);
    }

    return suggestions;
  }

  /**
   * Retrieves various statistics about the Git repository, such as total commits, contributors, current branch, and total files.
   * @returns A promise that resolves to a record containing repository statistics.
   */
  async getRepositoryStats(): Promise<Record<string, any>> {
    try {
      const { stdout: totalCommits } = await execAsync(
        'git rev-list --count HEAD',
        { cwd: this.projectPath }
      );

      const { stdout: contributors } = await execAsync(
        'git shortlog -sn | wc -l',
        { cwd: this.projectPath }
      );

      const { stdout: currentBranch } = await execAsync(
        'git rev-parse --abbrev-ref HEAD',
        { cwd: this.projectPath }
      );

      const { stdout: totalFiles } = await execAsync(
        'git ls-files | wc -l',
        { cwd: this.projectPath }
      );

      return {
        totalCommits: parseInt(totalCommits.trim()),
        contributors: parseInt(contributors.trim()),
        currentBranch: currentBranch.trim(),
        totalFiles: parseInt(totalFiles.trim()),
      };
    } catch (err) {
      console.error('Error getting repository stats:', err);
      return {};
    }
  }

  /**
   * Generates release notes by summarizing commit messages between two Git tags or a tag and HEAD.
   * @param fromTag The starting Git tag (or commit hash) for the release notes.
   * @param toTag The ending Git tag (or commit hash) for the release notes. Defaults to 'HEAD'.
   * @returns A promise that resolves to the Markdown content of the release notes.
   */
  async generateReleaseNotes(
    fromTag: string,
    toTag: string = 'HEAD'
  ): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `git log ${fromTag}..${toTag} --oneline`,
        { cwd: this.projectPath }
      );

      const commits = stdout
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);

      const releaseNotes = [
        `# Release Notes: ${fromTag} → ${toTag}`,
        '',
        `## Changes (${commits.length} commits)`,
        '',
        ...commits.map((commit) => `- ${commit}`),
      ].join('\n');

      return releaseNotes;
    } catch (err) {
      console.error('Error generating release notes:', err);
      return '';
    }
  }

  /**
   * Analyzes code changes for a specific file between two commits.
   * It provides the number of additions, deletions, and the full diff.
   * @param filePath The path to the file to analyze.
   * @param fromCommit The starting commit hash for the comparison.
   * @param toCommit The ending commit hash for the comparison. Defaults to 'HEAD'.
   * @returns A promise that resolves to a record containing code change analysis.
   */
  async analyzeCodeChanges(
    filePath: string,
    fromCommit: string,
    toCommit: string = 'HEAD'
  ): Promise<Record<string, any>> {
    try {
      const { stdout: diff } = await execAsync(
        `git diff ${fromCommit}..${toCommit} -- ${filePath}`,
        { cwd: this.projectPath }
      );

      const additions = (diff.match(/^\+/gm) || []).length;
      const deletions = (diff.match(/^-/gm) || []).length;

      return {
        filePath,
        additions,
        deletions,
        totalChanges: additions + deletions,
        diff,
      };
    } catch (err) {
      console.error('Error analyzing code changes:', err);
      return {};
    }
  }

  /**
   * Retrieves Git blame information for a specific line in a file.
   * @param filePath The path to the file.
   * @param lineNumber The 1-indexed line number to get blame information for.
   * @returns A promise that resolves to a record containing blame information (commit, author, date).
   */
  async getBlameInfo(filePath: string, lineNumber: number): Promise<Record<string, any>> {
    try {
      const { stdout } = await execAsync(
        `git blame -L ${lineNumber},${lineNumber} ${filePath}`,
        { cwd: this.projectPath }
      );

      const [hash, author, date] = stdout.trim().split(/\s+/);

      return {
        filePath,
        lineNumber,
        commit: hash,
        author,
        date,
      };
    } catch (err) {
      console.error('Error getting blame info:', err);
      return {};
    }
  }
}
