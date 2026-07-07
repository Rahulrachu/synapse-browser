import * as fs from 'fs';
import * as path from 'path';

interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
}

interface ProjectAnalysis {
  languages: string[];
  frameworks: string[];
  dependencies: DependencyInfo[];
  devDependencies: DependencyInfo[];
  buildScripts: string[];
  testFramework: string | null;
  entryPoints: string[];
  architectureMap: ArchitectureNode;
  summary: string;
  analyzedAt: number;
}

interface ArchitectureNode {
  name: string;
  type: 'directory' | 'file';
  children?: ArchitectureNode[];
  imports?: string[];
}

export class ProjectIntelligenceService {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async analyze(): Promise<ProjectAnalysis> {
    const languages = this.detectLanguages();
    const frameworks = this.detectFrameworks();
    const { dependencies, devDependencies } = this.parseDependencies();
    const buildScripts = this.findBuildScripts();
    const testFramework = this.detectTestFramework();
    const entryPoints = this.findEntryPoints();
    const architectureMap = this.generateArchitectureMap();
    const summary = this.generateSummary(
      languages,
      frameworks,
      buildScripts,
      testFramework
    );

    return {
      languages,
      frameworks,
      dependencies,
      devDependencies,
      buildScripts,
      testFramework,
      entryPoints,
      architectureMap,
      summary,
      analyzedAt: Date.now(),
    };
  }

  private detectLanguages(): string[] {
    const languages = new Set<string>();
    const extensions: { [key: string]: string } = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
    };

    this.walkDirectory(this.projectPath, (filePath) => {
      const ext = path.extname(filePath);
      if (extensions[ext]) {
        languages.add(extensions[ext]);
      }
    });

    return Array.from(languages);
  }

  private detectFrameworks(): string[] {
    const frameworks = new Set<string>();

    // Check package.json for framework dependencies
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const frameworkMap: { [key: string]: string } = {
          react: 'React',
          vue: 'Vue',
          angular: 'Angular',
          svelte: 'Svelte',
          'next.js': 'Next.js',
          nuxt: 'Nuxt',
          express: 'Express',
          fastapi: 'FastAPI',
          django: 'Django',
          flask: 'Flask',
          rails: 'Rails',
          electron: 'Electron',
          tauri: 'Tauri',
        };

        for (const [dep, framework] of Object.entries(frameworkMap)) {
          if (allDeps[dep]) {
            frameworks.add(framework);
          }
        }
      } catch (err) {
        console.error('Error reading package.json:', err);
      }
    }

    return Array.from(frameworks);
  }

  private parseDependencies(): {
    dependencies: DependencyInfo[];
    devDependencies: DependencyInfo[];
  } {
    const dependencies: DependencyInfo[] = [];
    const devDependencies: DependencyInfo[] = [];

    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );

        if (packageJson.dependencies) {
          for (const [name, version] of Object.entries(
            packageJson.dependencies
          )) {
            dependencies.push({
              name,
              version: version as string,
              type: 'production',
            });
          }
        }

        if (packageJson.devDependencies) {
          for (const [name, version] of Object.entries(
            packageJson.devDependencies
          )) {
            devDependencies.push({
              name,
              version: version as string,
              type: 'development',
            });
          }
        }
      } catch (err) {
        console.error('Error parsing dependencies:', err);
      }
    }

    return { dependencies, devDependencies };
  }

  private findBuildScripts(): string[] {
    const scripts: string[] = [];

    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );

        if (packageJson.scripts) {
          scripts.push(...Object.keys(packageJson.scripts));
        }
      } catch (err) {
        console.error('Error reading build scripts:', err);
      }
    }

    return scripts;
  }

  private detectTestFramework(): string | null {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8')
        );
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        const testFrameworks: { [key: string]: string } = {
          jest: 'Jest',
          mocha: 'Mocha',
          vitest: 'Vitest',
          jasmine: 'Jasmine',
          karma: 'Karma',
          pytest: 'Pytest',
          unittest: 'Unittest',
          rspec: 'RSpec',
        };

        for (const [dep, framework] of Object.entries(testFrameworks)) {
          if (allDeps[dep]) {
            return framework;
          }
        }
      } catch (err) {
        console.error('Error detecting test framework:', err);
      }
    }

    return null;
  }

  private findEntryPoints(): string[] {
    const entryPoints: string[] = [];

    // Common entry point patterns
    const patterns = [
      'src/main.ts',
      'src/main.tsx',
      'src/index.ts',
      'src/index.tsx',
      'src/App.tsx',
      'index.js',
      'main.js',
      'app.js',
      'server.js',
      'src/server.ts',
    ];

    for (const pattern of patterns) {
      const fullPath = path.join(this.projectPath, pattern);
      if (fs.existsSync(fullPath)) {
        entryPoints.push(pattern);
      }
    }

    return entryPoints;
  }

  private generateArchitectureMap(): ArchitectureNode {
    const root: ArchitectureNode = {
      name: path.basename(this.projectPath),
      type: 'directory',
      children: [],
    };

    const maxDepth = 3;
    this.buildArchitectureTree(this.projectPath, root, 0, maxDepth);

    return root;
  }

  private buildArchitectureTree(
    dirPath: string,
    node: ArchitectureNode,
    depth: number,
    maxDepth: number
  ) {
    if (depth >= maxDepth) return;

    try {
      const entries = fs.readdirSync(dirPath);

      for (const entry of entries) {
        // Skip common directories
        if (
          [
            'node_modules',
            '.git',
            'dist',
            'build',
            '.next',
            'out',
            '__pycache__',
          ].includes(entry)
        ) {
          continue;
        }

        const fullPath = path.join(dirPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const childNode: ArchitectureNode = {
            name: entry,
            type: 'directory',
            children: [],
          };
          node.children?.push(childNode);
          this.buildArchitectureTree(fullPath, childNode, depth + 1, maxDepth);
        } else if (
          ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go'].includes(
            path.extname(entry)
          )
        ) {
          const childNode: ArchitectureNode = {
            name: entry,
            type: 'file',
          };
          node.children?.push(childNode);
        }
      }
    } catch (err) {
      console.error('Error building architecture tree:', err);
    }
  }

  private generateSummary(
    languages: string[],
    frameworks: string[],
    buildScripts: string[],
    testFramework: string | null
  ): string {
    const parts: string[] = [];

    if (languages.length > 0) {
      parts.push(`Languages: ${languages.join(', ')}`);
    }

    if (frameworks.length > 0) {
      parts.push(`Frameworks: ${frameworks.join(', ')}`);
    }

    if (buildScripts.length > 0) {
      parts.push(`Build Scripts: ${buildScripts.join(', ')}`);
    }

    if (testFramework) {
      parts.push(`Test Framework: ${testFramework}`);
    }

    return parts.join('. ') + '.';
  }

  private walkDirectory(dirPath: string, callback: (filePath: string) => void) {
    try {
      const entries = fs.readdirSync(dirPath);

      for (const entry of entries) {
        if (
          [
            'node_modules',
            '.git',
            'dist',
            'build',
            '.next',
            'out',
            '__pycache__',
          ].includes(entry)
        ) {
          continue;
        }

        const fullPath = path.join(dirPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          this.walkDirectory(fullPath, callback);
        } else {
          callback(fullPath);
        }
      }
    } catch (err) {
      console.error('Error walking directory:', err);
    }
  }
}
