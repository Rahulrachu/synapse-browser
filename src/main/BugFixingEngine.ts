import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BugReport {
  id: string;
  file: string;
  line: number;
  type: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  stackTrace?: string;
}

export interface BugFix {
  bugId: string;
  description: string;
  changes: CodeChange[];
  testResults: TestResult[];
  success: boolean;
}

export interface CodeChange {
  file: string;
  before: string;
  after: string;
  lineRange: [number, number];
}

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

/**
 * The BugFixingEngine is responsible for detecting and automatically fixing bugs in a given project.
 * It integrates with testing, linting, and type-checking tools, and can apply heuristic fixes.
 */
export class BugFixingEngine {
  private projectPath: string;
  private maxAttempts = 3;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Detects various types of bugs in the project by running tests, linters, and type checkers.
   * @returns A promise that resolves to an array of `BugReport` objects.
   */
  async detectBugs(): Promise<BugReport[]> {
    const bugs: BugReport[] = [];

    try {
      // Run tests and capture failures
      const testBugs = await this.detectTestFailures();
      bugs.push(...testBugs);

      // Run linter
      const lintBugs = await this.detectLintErrors();
      bugs.push(...lintBugs);

      // Run type checker
      const typeBugs = await this.detectTypeErrors();
      bugs.push(...typeBugs);
    } catch (err) {
      console.error('Error detecting bugs:', err);
    }

    return bugs;
  }

  /**
   * Analyzes raw code for bugs without running external tools.
   * Useful for quick checks in agents.
   */
  async analyzeCode(code: string): Promise<{ bugs: BugReport[]; complexity: number; maintainability: number }> {
    const bugs: BugReport[] = [];
    const lines = code.split('\n');

    // Simple heuristic-based bug detection
    lines.forEach((line, index) => {
      // Undefined variables (very basic check)
      if (line.match(/\w+\s*=\s*\w+/) && !line.includes('const') && !line.includes('let') && !line.includes('var')) {
        // This is a weak check, but serves as a placeholder for real static analysis
      }

      // Placeholder detection (TODO/FIXME/HACK)
      const placeholderMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|BUG):?\s*(.*)/i);
      if (placeholderMatch) {
        bugs.push({
          id: `static-${index}`,
          file: 'memory',
          line: index + 1,
          type: 'placeholder',
          message: `${placeholderMatch[1]}: ${placeholderMatch[2] || 'Unfinished implementation'}`,
          severity: placeholderMatch[1].toUpperCase() === 'BUG' ? 'high' : 'low'
        });
      }
    });

    return {
      bugs,
      complexity: lines.length / 10, // Mock complexity
      maintainability: Math.max(0, 100 - bugs.length * 5)
    };
  }

  /**
   * Attempts to fix a list of detected bugs. It tries to fix each bug multiple times if necessary.
   * @param bugs An array of `BugReport` objects to fix.
   * @returns A promise that resolves to an array of `BugFix` objects, detailing the outcome of each fix attempt.
   */
  async fixBugs(bugs: BugReport[]): Promise<BugFix[]> {
    const fixes: BugFix[] = [];

    for (const bug of bugs) {
      let attempts = 0;
      let fixed = false;

      while (attempts < this.maxAttempts && !fixed) {
        try {
          const fix = await this.fixBug(bug);
          fixes.push(fix);
          fixed = fix.success;
        } catch (err) {
          console.error(`Error fixing bug ${bug.id}:`, err);
          attempts++;
        }
      }
    }

    return fixes;
  }

  /**
   * Applies a specific fix for a single bug based on its type.
   * After applying the fix, it runs tests to verify the fix and rolls back if tests fail.
   * @param bug The `BugReport` object representing the bug to fix.
   * @returns A promise that resolves to a `BugFix` object.
   */
  private async fixBug(bug: BugReport): Promise<BugFix> {
    const fix: BugFix = {
      bugId: bug.id,
      description: `Fixing: ${bug.message}`,
      changes: [],
      testResults: [],
      success: false,
    };

    try {
      const filePath = path.join(this.projectPath, bug.file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      let fixedContent = content;

      // Apply fix based on bug type
      switch (bug.type) {
        case 'undefined_variable':
          fixedContent = this.fixUndefinedVariable(content, bug);
          break;
        case 'null_reference':
          fixedContent = this.fixNullReference(content, bug);
          break;
        case 'type_mismatch':
          fixedContent = this.fixTypeMismatch(content, bug);
          break;
        case 'unused_variable':
          fixedContent = this.fixUnusedVariable(content, bug);
          break;
        case 'missing_return':
          fixedContent = this.fixMissingReturn(content, bug);
          break;
        case 'infinite_loop':
          fixedContent = this.fixInfiniteLoop(content, bug);
          break;
        default:
          fixedContent = this.applyGenericFix(content, bug);
      }

      // Apply the fix
      fs.writeFileSync(filePath, fixedContent);

      fix.changes.push({
        file: bug.file,
        before: content,
        after: fixedContent,
        lineRange: [Math.max(1, bug.line - 5), Math.min(lines.length, bug.line + 5)],
      });

      // Run tests to verify fix
      fix.testResults = await this.runTests();
      fix.success = fix.testResults.every((t) => t.passed);

      if (!fix.success) {
        // Rollback on test failure
        fs.writeFileSync(filePath, content);
      }

      return fix;
    } catch (err) {
      console.error('Error in fixBug:', err);
      return fix;
    }
  }

  /**
   * Applies a fix for an undefined variable bug.
   * @param content The file content as a string.
   * @param bug The `BugReport` for the undefined variable.
   * @returns The modified file content with the fix applied.
   */
  private fixUndefinedVariable(content: string, bug: BugReport): string {
    // Try to infer the variable from context
    const lines = content.split('\n');
    const bugLine = lines[bug.line - 1];

    // Simple fix: add variable declaration
    if (bugLine && !bugLine.includes('const ') && !bugLine.includes('let ')) {
      const varMatch = bugLine.match(/(\w+)/);
      if (varMatch) {
        const varName = varMatch[1];
        lines[bug.line - 1] = `const ${varName} = undefined; // Auto-fixed undefined variable\n${bugLine}`;
      }
    }

    return lines.join('\n');
  }

  /**
   * Applies a fix for a null reference bug by adding a null check.
   * @param content The file content as a string.
   * @param bug The `BugReport` for the null reference.
   * @returns The modified file content with the fix applied.
   */
  private fixNullReference(content: string, bug: BugReport): string {
    const lines = content.split('\n');
    const bugLine = lines[bug.line - 1];

    // Add null check
    if (bugLine) {
      const match = bugLine.match(/(\w+)\./);
      if (match) {
        const varName = match[1];
        lines[bug.line - 1] = `if (${varName}) { ${bugLine} }`;
      }
    }

    return lines.join('\n');
  }

  /**
   * Applies a fix for a type mismatch bug by adding a type assertion or conversion.
   * @param content The file content as a string.
   * @param bug The `BugReport` for the type mismatch.
   * @returns The modified file content with the fix applied.
   */
  private fixTypeMismatch(content: string, bug: BugReport): string {
    const lines = content.split('\n');
    const bugLine = lines[bug.line - 1];

    // Add type assertion or conversion
    if (bugLine) {
      lines[bug.line - 1] = bugLine.replace(/(\w+)/, 'String($1)');
    }

    return lines.join('\n');
  }

  /**
   * Applies a fix for an unused variable bug by removing the variable declaration.
   * @param content The file content as a string.
   * @param bug The `BugReport` for the unused variable.
   * @returns The modified file content with the fix applied.
   */
  private fixUnusedVariable(content: string, bug: BugReport): string {
    const lines = content.split('\n');
    const bugLine = lines[bug.line - 1];

    // Remove unused variable
    if (bugLine && bugLine.includes('const ')) {
      lines.splice(bug.line - 1, 1);
    }

    return lines.join('\n');
  }

  /**
   * Applies a fix for a missing return statement bug by adding a default return.
   * @param content The file content as a string.
   * @param bug The `BugReport` for the missing return.
   * @returns The modified file content with the fix applied.
   */
  private fixMissingReturn(content: string, bug: BugReport): string {
    const lines = content.split('\n');

    // Find the function and add return statement
    for (let i = bug.line - 1; i >= 0; i--) {
      if (lines[i].includes('function') || lines[i].includes('=>')) {
        // Find the closing brace
        let braceCount = 0;
        for (let j = i; j < lines.length; j++) {
          braceCount += (lines[j].match(/{/g) || []).length;
          braceCount -= (lines[j].match(/}/g) || []).length;

          if (braceCount === 0 && j > i) {
            lines.splice(j, 0, '  return;');
            break;
          }
        }
        break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Applies a fix for an infinite loop bug by adding a safety break condition.
   * @param content The file content as a string.
   * @param bug The `BugReport` for the infinite loop.
   * @returns The modified file content with the fix applied.
   */
  private fixInfiniteLoop(content: string, bug: BugReport): string {
    const lines = content.split('\n');
    const bugLine = lines[bug.line - 1];

    // Try to add a break condition
    if (bugLine && bugLine.includes('while')) {
      lines[bug.line - 1] = bugLine.replace(/while\s*\(\s*true\s*\)/, 'let loopCount = 0; while (loopCount++ < 1000) { // Safety break added');
    }

    return lines.join('\n');
  }

  /**
   * Applies a generic fix by adding a comment indicating the issue.
   * @param content The file content as a string.
   * @param bug The `BugReport` for which to apply a generic fix.
   * @returns The modified file content with the generic fix applied.
   */
  private applyGenericFix(content: string, bug: BugReport): string {
    // Generic fix: add a comment indicating the issue
    const lines = content.split('\n');
    lines[bug.line - 1] = `// TODO: Fix - ${bug.message}\n${lines[bug.line - 1]}`;
    return lines.join('\n');
  }

  /**
   * Detects test failures by running `npm test`.
   * @returns A promise that resolves to an array of `BugReport` objects for test failures.
   */
  private async detectTestFailures(): Promise<BugReport[]> {
    const bugs: BugReport[] = [];

    try {
      const { stdout, stderr } = await execAsync('npm test 2>&1', {
        cwd: this.projectPath,
      });

      const output = stdout + stderr;
      const lines = output.split('\n');

      let bugId = 1;
      for (const line of lines) {
        if (line.includes('FAIL') || line.includes('Error')) {
          const fileMatch = line.match(/at\s+([^:]+):(\d+)/);
          if (fileMatch) {
            bugs.push({
              id: `test-${bugId++}`,
              file: fileMatch[1],
              line: parseInt(fileMatch[2]),
              type: 'test_failure',
              message: line.trim(),
              severity: 'high',
              stackTrace: output,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error detecting test failures:', err);
    }

    return bugs;
  }

  /**
   * Detects linting errors by running `npm run lint`.
   * @returns A promise that resolves to an array of `BugReport` objects for linting errors.
   */
  private async detectLintErrors(): Promise<BugReport[]> {
    const bugs: BugReport[] = [];

    try {
      const { stdout } = await execAsync('npm run lint 2>&1', {
        cwd: this.projectPath,
      });

      const lines = stdout.split('\n');
      let bugId = 1;

      for (const line of lines) {
        const match = line.match(/([^:]+):(\d+):(\d+):\s*(.+)/);
        if (match) {
          bugs.push({
            id: `lint-${bugId++}`,
            file: match[1],
            line: parseInt(match[2]),
            type: 'lint_error',
            message: match[4],
            severity: 'medium',
          });
        }
      }
    } catch (err) {
      console.error('Error detecting lint errors:', err);
    }

    return bugs;
  }

  /**
   * Detects type errors by running `npx tsc --noEmit`.
   * @returns A promise that resolves to an array of `BugReport` objects for type errors.
   */
  private async detectTypeErrors(): Promise<BugReport[]> {
    const bugs: BugReport[] = [];

    try {
      const { stdout } = await execAsync('npx tsc --noEmit 2>&1', {
        cwd: this.projectPath,
      });

      const lines = stdout.split('\n');
      let bugId = 1;

      for (const line of lines) {
        const match = line.match(/([^(]+)\((\d+),(\d+)\):\s*error\s*TS\d+:\s*(.+)/);
        if (match) {
          bugs.push({
            id: `type-${bugId++}`,
            file: match[1],
            line: parseInt(match[2]),
            type: 'type_error',
            message: match[4],
            severity: 'high',
          });
        }
      }
    } catch (err) {
      console.error('Error detecting type errors:', err);
    }

    return bugs;
  }

  /**
   * Runs the project's tests and returns the results.
   * @returns A promise that resolves to an array of `TestResult` objects.
   */
  private async runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      const { stdout } = await execAsync('npm test 2>&1', {
        cwd: this.projectPath,
      });

      const passedMatch = stdout.match(/(\d+)\s+passed/);
      const failedMatch = stdout.match(/(\d+)\s+failed/);

      results.push({
        name: 'all_tests',
        passed: !failedMatch || parseInt(failedMatch[1]) === 0,
      });
    } catch (err) {
      results.push({
        name: 'all_tests',
        passed: false,
        message: err instanceof Error ? err.message : 'Test execution failed',
      });
    }

    return results;
  }
}
