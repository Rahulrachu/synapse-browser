import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RepositoryAnalysis {
  architecture: ArchitectureDiagram;
  folderStructure: FolderExplanation;
  dependencyGraph: DependencyGraph;
  importantFiles: ImportantFile[];
  entryPoints: EntryPoint[];
  apiMap: APIEndpoint[];
  databaseStructure: DatabaseSchema[];
  todoList: TodoItem[];
  riskAnalysis: RiskItem[];
}

export interface ArchitectureDiagram {
  mermaidCode: string;
  description: string;
}

export interface FolderExplanation {
  [folderPath: string]: string;
}

export interface DependencyGraph {
  nodes: { id: string; label: string; type: string }[];
  edges: { source: string; target: string }[];
}

export interface ImportantFile {
  path: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium';
}

export interface EntryPoint {
  file: string;
  type: 'main' | 'server' | 'client' | 'build';
  description: string;
}

export interface APIEndpoint {
  method: string;
  path: string;
  handler: string;
  description?: string;
}

export interface DatabaseSchema {
  table: string;
  columns: { name: string; type: string }[];
  relations: string[];
}

export interface TodoItem {
  file: string;
  line: number;
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RiskItem {
  type: 'security' | 'performance' | 'maintainability';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: string;
  suggestion: string;
}

export class RepositoryAnalysisService {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async analyzeRepository(): Promise<RepositoryAnalysis> {
    const [
      architecture,
      folderStructure,
      dependencyGraph,
      importantFiles,
      entryPoints,
      apiMap,
      databaseStructure,
      todoList,
      riskAnalysis,
    ] = await Promise.all([
      this.generateArchitectureDiagram(),
      this.analyzeFolderStructure(),
      this.buildDependencyGraph(),
      this.identifyImportantFiles(),
      this.findEntryPoints(),
      this.mapAPIEndpoints(),
      this.analyzeDatabaseStructure(),
      this.extractTodoItems(),
      this.performRiskAnalysis(),
    ]);

    return {
      architecture,
      folderStructure,
      dependencyGraph,
      importantFiles,
      entryPoints,
      apiMap,
      databaseStructure,
      todoList,
      riskAnalysis,
    };
  }

  private async generateArchitectureDiagram(): Promise<ArchitectureDiagram> {
    const dirs = this.getTopLevelDirectories();
    const mermaidCode = `graph TB
${dirs.map((dir) => `    ${dir}["📁 ${dir}"]`).join('\n')}
`;

    return {
      mermaidCode,
      description: 'High-level project structure showing main directories and their relationships.',
    };
  }

  private async analyzeFolderStructure(): Promise<FolderExplanation> {
    const explanation: FolderExplanation = {};

    const commonFolders: Record<string, string> = {
      src: 'Source code directory containing application logic',
      public: 'Static assets served directly to clients',
      pages: 'Next.js pages directory for routing',
      components: 'Reusable React components',
      lib: 'Utility functions and helpers',
      api: 'Backend API routes and handlers',
      styles: 'CSS and styling files',
      tests: 'Unit and integration tests',
      docs: 'Documentation files',
      config: 'Configuration files',
      scripts: 'Build and utility scripts',
      node_modules: 'Installed npm dependencies',
      dist: 'Compiled/built output',
      build: 'Production build output',
    };

    const dirs = this.getTopLevelDirectories();
    dirs.forEach((dir) => {
      explanation[dir] = commonFolders[dir] || `Directory: ${dir}`;
    });

    return explanation;
  }

  private async buildDependencyGraph(): Promise<DependencyGraph> {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    let dependencies: Record<string, string> = {};

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
    }

    const nodes = Object.keys(dependencies).map((dep) => ({
      id: dep,
      label: dep,
      type: 'dependency',
    }));

    // Add main app node
    nodes.unshift({
      id: 'app',
      label: 'Application',
      type: 'app',
    });

    // Create edges from app to main dependencies
    const edges = Object.keys(dependencies)
      .slice(0, 10) // Limit to first 10 for clarity
      .map((dep) => ({
        source: 'app',
        target: dep,
      }));

    return { nodes, edges };
  }

  private async identifyImportantFiles(): Promise<ImportantFile[]> {
    const importantFiles: ImportantFile[] = [];

    const criticalPatterns = [
      { pattern: /package\.json/, reason: 'Project manifest and dependencies', priority: 'critical' as const },
      { pattern: /tsconfig\.json/, reason: 'TypeScript configuration', priority: 'critical' as const },
      { pattern: /\.env/, reason: 'Environment variables', priority: 'critical' as const },
      { pattern: /README\.md/, reason: 'Project documentation', priority: 'high' as const },
      { pattern: /docker-compose\.yml/, reason: 'Docker configuration', priority: 'high' as const },
      { pattern: /(index|main|app)\.(ts|tsx|js|jsx)/, reason: 'Application entry point', priority: 'high' as const },
    ];

    const files = this.getAllFiles();
    files.forEach((file) => {
      criticalPatterns.forEach(({ pattern, reason, priority }) => {
        if (pattern.test(file)) {
          importantFiles.push({
            path: file,
            reason,
            priority,
          });
        }
      });
    });

    return importantFiles.slice(0, 10);
  }

  private async findEntryPoints(): Promise<EntryPoint[]> {
    const entryPoints: EntryPoint[] = [];

    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (packageJson.main) {
        entryPoints.push({
          file: packageJson.main,
          type: 'main',
          description: 'Primary entry point',
        });
      }

      if (packageJson.scripts?.dev) {
        entryPoints.push({
          file: 'npm run dev',
          type: 'build',
          description: 'Development server',
        });
      }
    }

    // Check for common entry points
    const commonEntries = [
      { file: 'src/index.ts', type: 'main' as const },
      { file: 'src/index.tsx', type: 'client' as const },
      { file: 'src/server.ts', type: 'server' as const },
      { file: 'pages/index.tsx', type: 'client' as const },
    ];

    commonEntries.forEach(({ file, type }) => {
      if (fs.existsSync(path.join(this.projectPath, file))) {
        entryPoints.push({
          file,
          type,
          description: `${type} entry point`,
        });
      }
    });

    return entryPoints;
  }

  private async mapAPIEndpoints(): Promise<APIEndpoint[]> {
    const endpoints: APIEndpoint[] = [];

    // Scan for API route files
    const apiDir = path.join(this.projectPath, 'src', 'api');
    if (fs.existsSync(apiDir)) {
      const files = this.getAllFilesInDirectory(apiDir);
      files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');

        // Extract Express routes
        const expressRoutes = content.match(/router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g) || [];
        expressRoutes.forEach((route) => {
          const match = route.match(/router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/);
          if (match) {
            endpoints.push({
              method: match[1].toUpperCase(),
              path: match[2],
              handler: file,
            });
          }
        });
      });
    }

    return endpoints;
  }

  private async analyzeDatabaseStructure(): Promise<DatabaseSchema[]> {
    const schemas: DatabaseSchema[] = [];

    // Check for Prisma schema
    const prismaSchemaPath = path.join(this.projectPath, 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaSchemaPath)) {
      const content = fs.readFileSync(prismaSchemaPath, 'utf-8');

      // Parse Prisma models
      const modelMatches = content.match(/model\s+(\w+)\s*{([^}]+)}/g) || [];
      modelMatches.forEach((modelBlock) => {
        const nameMatch = modelBlock.match(/model\s+(\w+)/);
        if (nameMatch) {
          schemas.push({
            table: nameMatch[1],
            columns: [],
            relations: [],
          });
        }
      });
    }

    return schemas;
  }

  private async extractTodoItems(): Promise<TodoItem[]> {
    const todos: TodoItem[] = [];

    const files = this.getAllFiles();
    files.forEach((file) => {
      if (file.match(/\.(ts|tsx|js|jsx|py|go|java)$/)) {
        const content = fs.readFileSync(path.join(this.projectPath, file), 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const todoMatch = line.match(/TODO|FIXME|HACK|BUG/i);
          if (todoMatch) {
            todos.push({
              file,
              line: index + 1,
              text: line.trim(),
              priority: line.includes('CRITICAL') ? 'high' : line.includes('FIXME') ? 'high' : 'medium',
            });
          }
        });
      }
    });

    return todos.slice(0, 20);
  }

  private async performRiskAnalysis(): Promise<RiskItem[]> {
    const risks: RiskItem[] = [];

    // Check for security issues
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for outdated or vulnerable packages
      if (deps['lodash'] && !deps['lodash-es']) {
        risks.push({
          type: 'performance',
          severity: 'medium',
          description: 'Using full lodash library instead of lodash-es',
          suggestion: 'Replace lodash with lodash-es for better tree-shaking',
        });
      }
    }

    // Check for hardcoded secrets
    const files = this.getAllFiles();
    files.forEach((file) => {
      if (file.match(/\.(ts|tsx|js|jsx)$/) && !file.includes('node_modules')) {
        const content = fs.readFileSync(path.join(this.projectPath, file), 'utf-8');

        if (content.match(/api[_-]?key|secret|password/i) && !content.includes('process.env')) {
          risks.push({
            type: 'security',
            severity: 'critical',
            description: 'Potential hardcoded secrets detected',
            location: file,
            suggestion: 'Use environment variables for sensitive data',
          });
        }
      }
    });

    return risks;
  }

  private getTopLevelDirectories(): string[] {
    const entries = fs.readdirSync(this.projectPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .slice(0, 10);
  }

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
        } else {
          files.push(relativePath);
        }
      });
    };

    walk(this.projectPath);
    return files;
  }

  private getAllFilesInDirectory(dir: string): string[] {
    const files: string[] = [];

    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      entries.forEach((entry) => {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          files.push(fullPath);
        }
      });
    };

    walk(dir);
    return files;
  }
}
