import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RefactoringRequest {
  scope: 'file' | 'module' | 'project';
  target: string; // file path or module name
  operation: 'rename' | 'extract' | 'inline' | 'move' | 'simplify' | 'modernize';
  parameters?: Record<string, any>;
}

export interface RefactoringPlan {
  steps: RefactoringStep[];
  estimatedImpact: string[];
  risks: string[];
}

export interface RefactoringStep {
  description: string;
  files: string[];
  changes: CodeChange[];
}

export interface CodeChange {
  file: string;
  before: string;
  after: string;
  lineRange: [number, number];
}

export interface RefactoringResult {
  success: boolean;
  filesModified: string[];
  changes: CodeChange[];
  testResults: TestResult[];
  rollbackAvailable: boolean;
}

export interface TestResult {
  file: string;
  passed: number;
  failed: number;
  errors: string[];
}

/**
 * The CodeRefactoringEngine provides functionalities for planning and executing code refactoring operations.
 * It supports various refactoring types like renaming, extracting, inlining, moving, simplifying, and modernizing code.
 * The engine also includes mechanisms for impact analysis, risk identification, and automatic rollback on test failures.
 */
export class CodeRefactoringEngine {
  private projectPath: string;
  private backupPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.backupPath = path.join(projectPath, '.refactoring-backup');
  }

  /**
   * Plans a refactoring operation based on the given request.
   * This method analyzes the potential changes, estimates impact, and identifies risks without modifying the code.
   * @param request The `RefactoringRequest` object detailing the desired refactoring.
   * @returns A promise that resolves to a `RefactoringPlan` object.
   */
  async planRefactoring(request: RefactoringRequest): Promise<RefactoringPlan> {
    const plan: RefactoringPlan = {
      steps: [],
      estimatedImpact: [],
      risks: [],
    };

    switch (request.operation) {
      case 'rename':
        plan.steps.push(await this.planRename(request));
        break;
      case 'extract':
        plan.steps.push(await this.planExtract(request));
        break;
      case 'inline':
        plan.steps.push(await this.planInline(request));
        break;
      case 'move':
        plan.steps.push(await this.planMove(request));
        break;
      case 'simplify':
        plan.steps.push(await this.planSimplify(request));
        break;
      case 'modernize':
        plan.steps.push(await this.planModernize(request));
        break;
    }

    // Analyze dependencies
    plan.estimatedImpact = await this.analyzeImpact(request);
    plan.risks = await this.identifyRisks(request);

    return plan;
  }

  /**
   * Executes a planned refactoring operation.
   * It creates a backup, applies changes, runs tests, and rolls back if tests fail.
   * @param request The `RefactoringRequest` object for the refactoring to execute.
   * @returns A promise that resolves to a `RefactoringResult` object.
   */
  async executeRefactoring(request: RefactoringRequest): Promise<RefactoringResult> {
    // Create backup
    await this.createBackup();

    const result: RefactoringResult = {
      success: false,
      filesModified: [],
      changes: [],
      testResults: [],
      rollbackAvailable: true,
    };

    try {
      const plan = await this.planRefactoring(request);

      // Execute each step
      for (const step of plan.steps) {
        for (const change of step.changes) {
          await this.applyChange(change);
          result.changes.push(change);
          result.filesModified.push(change.file);
        }
      }

      // Run tests
      result.testResults = await this.runTests();

      // Check if all tests passed
      const allTestsPassed = result.testResults.every((t) => t.failed === 0);

      if (!allTestsPassed) {
        // Rollback on test failure
        await this.rollback();
        result.success = false;
        return result;
      }

      result.success = true;
      return result;
    } catch (err) {
      // Rollback on error
      await this.rollback();
      throw err;
    }
  }

  /**
   * Refactors raw code based on a goal without modifying files.
   * Useful for quick transformations in agents.
   */
  async refactorCode(code: string, goal: string): Promise<string> {
    let refactored = code;

    // Apply basic transformations based on goal keywords
    if (goal.toLowerCase().includes('simplify')) {
      // Simplify arrow functions with single return
      refactored = refactored.replace(
        /const\s+(\w+)\s*=\s*\(\s*([^)]*)\s*\)\s*=>\s*{\s*return\s+([^;]+);\s*}/g,
        'const $1 = ($2) => $3'
      );
      // Simplify boolean returns
      refactored = refactored.replace(
        /if\s*\(([^)]+)\)\s*{\s*return\s+true;\s*}\s*else\s*{\s*return\s+false;\s*}/g,
        'return Boolean($1);'
      );
    }

    if (goal.toLowerCase().includes('modernize')) {
      refactored = refactored.replace(/\bvar\s+/g, 'const ');
      refactored = refactored.replace(
        /function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
        'const $1 = ($2) => {'
      );
    }

    return refactored;
  }

  /**
   * Plans a rename refactoring operation.
   * @param request The `RefactoringRequest` for renaming.
   * @returns A promise that resolves to a `RefactoringStep` for the rename operation.
   */
  private async planRename(request: RefactoringRequest): Promise<RefactoringStep> {
    const { target, parameters } = request;
    const newName = parameters?.newName;

    if (!newName) {
      throw new Error('newName parameter required for rename operation');
    }

    const filePath = path.join(this.projectPath, target);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find all occurrences of the old name
    const oldName = path.basename(target, path.extname(target));
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');

    return {
      description: `Rename ${oldName} to ${newName}`,
      files: [target],
      changes: [
        {
          file: target,
          before: content,
          after: content.replace(regex, newName),
          lineRange: [1, content.split('\n').length],
        },
      ],
    };
  }

  /**
   * Plans an extract refactoring operation (e.g., extracting code into a new function).
   * @param request The `RefactoringRequest` for extraction.
   * @returns A promise that resolves to a `RefactoringStep` for the extract operation.
   */
  private async planExtract(request: RefactoringRequest): Promise<RefactoringStep> {
    const { target, parameters } = request;
    const { startLine, endLine, functionName } = parameters || {};

    if (!startLine || !endLine || !functionName) {
      throw new Error('startLine, endLine, and functionName parameters required');
    }

    const filePath = path.join(this.projectPath, target);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const extractedCode = lines.slice(startLine - 1, endLine).join('\n');
    const newFunction = `function ${functionName}() {\n${extractedCode}\n}\n`;

    return {
      description: `Extract lines ${startLine}-${endLine} into function ${functionName}`,
      files: [target],
      changes: [
        {
          file: target,
          before: content,
          after: newFunction + content,
          lineRange: [1, lines.length],
        },
      ],
    };
  }

  /**
   * Plans an inline refactoring operation (e.g., inlining a function call).
   * @param request The `RefactoringRequest` for inlining.
   * @returns A promise that resolves to a `RefactoringStep` for the inline operation.
   */
  private async planInline(request: RefactoringRequest): Promise<RefactoringStep> {
    const { target, parameters } = request;
    const { functionName } = parameters || {};

    if (!functionName) {
      throw new Error('functionName parameter required');
    }

    const filePath = path.join(this.projectPath, target);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find function definition and inline calls
    const functionRegex = new RegExp(
      `function ${functionName}\\([^)]*\\)\\s*{[^}]*}`,
      'g'
    );

    return {
      description: `Inline function ${functionName}`,
      files: [target],
      changes: [
        {
          file: target,
          before: content,
          after: content.replace(functionRegex, ''),
          lineRange: [1, content.split('\n').length],
        },
      ],
    };
  }

  /**
   * Plans a move refactoring operation (e.g., moving a file or module).
   * @param request The `RefactoringRequest` for moving.
   * @returns A promise that resolves to a `RefactoringStep` for the move operation.
   */
  private async planMove(request: RefactoringRequest): Promise<RefactoringStep> {
    const { target, parameters } = request;
    const { newPath } = parameters || {};

    if (!newPath) {
      throw new Error('newPath parameter required');
    }

    return {
      description: `Move ${target} to ${newPath}`,
      files: [target, newPath],
      changes: [],
    };
  }

  /**
   * Plans a simplify refactoring operation (e.g., simplifying code structure or expressions).
   * @param request The `RefactoringRequest` for simplification.
   * @returns A promise that resolves to a `RefactoringStep` for the simplify operation.
   */
  private async planSimplify(request: RefactoringRequest): Promise<RefactoringStep> {
    const { target } = request;
    const filePath = path.join(this.projectPath, target);
    const content = fs.readFileSync(filePath, 'utf-8');

    let simplified = content;

    // Simplify code structure by removing excessive whitespace
    simplified = simplified.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Simplify arrow functions
    simplified = simplified.replace(
      /const\s+(\w+)\s*=\s*\(\s*([^)]*)\s*\)\s*=>\s*{\s*return\s+([^;]+);\s*}/g,
      'const $1 = ($2) => $3'
    );

    return {
      description: 'Simplify code structure',
      files: [target],
      changes: [
        {
          file: target,
          before: content,
          after: simplified,
          lineRange: [1, content.split('\n').length],
        },
      ],
    };
  }

  /**
   * Plans a modernize refactoring operation (e.g., updating to newer language features).
   * @param request The `RefactoringRequest` for modernization.
   * @returns A promise that resolves to a `RefactoringStep` for the modernize operation.
   */
  private async planModernize(request: RefactoringRequest): Promise<RefactoringStep> {
    const { target } = request;
    const filePath = path.join(this.projectPath, target);
    const content = fs.readFileSync(filePath, 'utf-8');

    let modernized = content;

    // Convert var to const/let
    modernized = modernized.replace(/\bvar\s+/g, 'const ');

    // Convert function declarations to arrow functions
    modernized = modernized.replace(
      /function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
      'const $1 = ($2) => {'
    );

    return {
      description: 'Modernize code to ES6+ standards',
      files: [target],
      changes: [
        {
          file: target,
          before: content,
          after: modernized,
          lineRange: [1, content.split('\n').length],
        },
      ],
    };
  }

  /**
   * Analyzes the potential impact of a refactoring request.
   * @param request The `RefactoringRequest` to analyze.
   * @returns A promise that resolves to an array of strings describing the estimated impact.
   */
  private async analyzeImpact(request: RefactoringRequest): Promise<string[]> {
    const impact: string[] = [];

    // Find all files that import/reference the target
    const files = this.getAllFiles();
    const targetName = path.basename(request.target, path.extname(request.target));

    for (const file of files) {
      const filePath = path.join(this.projectPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      if (content.includes(targetName)) {
        impact.push(`${file} imports or references ${targetName}`);
      }
    }

    return impact;
  }

  /**
   * Identifies potential risks associated with a refactoring request.
   * @param request The `RefactoringRequest` to assess for risks.
   * @returns A promise that resolves to an array of strings describing the identified risks.
   */
  private async identifyRisks(request: RefactoringRequest): Promise<string[]> {
    const risks: string[] = [];

    if (request.scope === 'project') {
      risks.push('Large-scale refactoring may introduce unexpected side effects');
    }

    if (request.operation === 'rename') {
      risks.push('Renaming may break external references or dependencies');
    }

    if (request.operation === 'extract') {
      risks.push('Extracted function may have unintended closure behavior');
    }

    return risks;
  }

  /**
   * Applies a single code change to a file.
   * @param change The `CodeChange` object to apply.
   * @returns A promise that resolves when the change is applied.
   */
  private async applyChange(change: CodeChange): Promise<void> {
    const filePath = path.join(this.projectPath, change.file);
    fs.writeFileSync(filePath, change.after);
  }

  /**
   * Runs the project's tests to verify the correctness of refactoring changes.
   * @returns A promise that resolves to an array of `TestResult` objects.
   */
  private async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      const { stdout, stderr } = await execAsync('npm test', {
        cwd: this.projectPath,
      });

      // Parse test output (simplified)
      const passedMatch = stdout.match(/(\d+)\s+passed/);
      const failedMatch = stdout.match(/(\d+)\s+failed/);

      results.push({
        file: 'all',
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        errors: stderr ? [stderr] : [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test execution failed';
      results.push({
        file: 'all',
        passed: 0,
        failed: 1,
        errors: [errorMessage],
      });
    }

    return results;
  }

  /**
   * Creates a backup of the project files before applying refactoring changes.
   * This allows for rollback in case of issues.
   * @returns A promise that resolves when the backup is created.
   */
  private async createBackup(): Promise<void> {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }

    // Copy all source files to backup
    const files = this.getAllFiles();
    for (const file of files) {
      const source = path.join(this.projectPath, file);
      const dest = path.join(this.backupPath, file);

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(source, dest);
    }
  }

  /**
   * Rolls back the project files to the state before the refactoring operation.
   * This is typically called if tests fail after refactoring.
   * @returns A promise that resolves when the rollback is complete.
   */
  private async rollback(): Promise<void> {
    if (!fs.existsSync(this.backupPath)) {
      throw new Error('Backup not available for rollback');
    }

    // Restore all files from backup
    const files = this.getAllFiles();
    for (const file of files) {
      const source = path.join(this.backupPath, file);
      const dest = path.join(this.projectPath, file);

      if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
      }
    }

    // Clean up backup
    fs.rmSync(this.backupPath, { recursive: true });
  }

  /**
   * Recursively gets all relevant code files within the project directory.
   * Excludes dotfiles and `node_modules`.
   * @returns An array of relative file paths.
   */
  private getAllFiles(): string[] {
    const files: string[] = [];

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.projectPath, fullPath);

        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walk(fullPath);
          }
        } else if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
          files.push(relativePath);
        }
      });
    };

    walk(this.projectPath);
    return files;
  }
}
