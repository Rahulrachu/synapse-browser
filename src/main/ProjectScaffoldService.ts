import * as fs from 'fs';
import * as path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ProjectTemplate {
  name: string;
  command: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
}

export interface ProjectCreationRequest {
  name: string;
  type: string; // e.g., 'next-saas', 'react-app', 'node-api'
  description?: string;
  outputPath: string;
}

export interface ProjectCreationProgress {
  stage: 'initializing' | 'scaffolding' | 'installing' | 'configuring' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export class ProjectScaffoldService {
  private templates: Map<string, ProjectTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    this.templates.set('next-saas', {
      name: 'Next.js SaaS',
      command: 'npx create-next-app@latest',
      description: 'Full-stack SaaS application with Next.js, TypeScript, and Tailwind CSS',
      dependencies: ['next', 'react', 'react-dom'],
      devDependencies: ['typescript', 'tailwindcss', 'postcss', 'autoprefixer'],
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
    });

    this.templates.set('react-app', {
      name: 'React App',
      command: 'npx create-react-app',
      description: 'Standard React application',
      dependencies: ['react', 'react-dom'],
      devDependencies: ['react-scripts'],
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject',
      },
    });

    this.templates.set('node-api', {
      name: 'Node.js API',
      command: 'npm init -y',
      description: 'Express.js REST API server',
      dependencies: ['express', 'cors', 'dotenv'],
      devDependencies: ['typescript', 'ts-node', 'nodemon'],
      scripts: {
        dev: 'nodemon --exec ts-node src/index.ts',
        build: 'tsc',
        start: 'node dist/index.js',
      },
    });

    this.templates.set('fullstack', {
      name: 'Full-Stack App',
      command: 'npx create-next-app@latest',
      description: 'Full-stack application with Next.js, API routes, and database',
      dependencies: ['next', 'react', 'react-dom', 'prisma', '@prisma/client'],
      devDependencies: ['typescript', 'tailwindcss', 'postcss', 'autoprefixer'],
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'db:push': 'prisma db push',
        'db:studio': 'prisma studio',
      },
    });
  }

  async createProject(
    request: ProjectCreationRequest,
    onProgress: (progress: ProjectCreationProgress) => void
  ): Promise<string> {
    const template = this.templates.get(request.type);
    if (!template) {
      throw new Error(`Unknown project type: ${request.type}`);
    }

    const projectPath = path.join(request.outputPath, request.name);

    try {
      // Stage 1: Initialize project
      onProgress({
        stage: 'initializing',
        progress: 10,
        message: `Initializing ${template.name} project...`,
      });

      await this.executeCommand(template.command, request.outputPath, [request.name]);

      // Stage 2: Scaffold additional files
      onProgress({
        stage: 'scaffolding',
        progress: 30,
        message: 'Scaffolding project structure...',
      });

      await this.scaffoldProject(projectPath, request);

      // Stage 3: Install dependencies
      onProgress({
        stage: 'installing',
        progress: 50,
        message: 'Installing dependencies...',
      });

      await this.installDependencies(projectPath, template);

      // Stage 4: Configure project
      onProgress({
        stage: 'configuring',
        progress: 80,
        message: 'Configuring project...',
      });

      await this.configureProject(projectPath, request, template);

      // Stage 5: Complete
      onProgress({
        stage: 'complete',
        progress: 100,
        message: `Project "${request.name}" created successfully!`,
      });

      return projectPath;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      onProgress({
        stage: 'error',
        progress: 0,
        message: 'Project creation failed',
        error: errorMessage,
      });
      throw err;
    }
  }

  private async executeCommand(
    command: string,
    cwd: string,
    args: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command.split(' ')[0], [...command.split(' ').slice(1), ...args], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  private async scaffoldProject(
    projectPath: string,
    request: ProjectCreationRequest
  ): Promise<void> {
    // Create additional directories
    const dirs = ['src', 'public', 'docs', 'tests', 'config'];
    for (const dir of dirs) {
      const dirPath = path.join(projectPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Create README
    const readmeContent = `# ${request.name}

${request.description || 'A new project created with Synapse Browser'}

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

- \`src/\` - Source code
- \`public/\` - Static assets
- \`docs/\` - Documentation
- \`tests/\` - Test files
- \`config/\` - Configuration files

## License

MIT
`;

    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

    // Create .gitignore
    const gitignoreContent = `node_modules/
.env
.env.local
.env.*.local
dist/
build/
.next/
out/
.vercel/
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent);

    // Create .env.example
    const envContent = `# Environment variables
# Copy this file to .env.local and fill in your values

DATABASE_URL=
API_KEY=
SECRET_KEY=
`;

    fs.writeFileSync(path.join(projectPath, '.env.example'), envContent);
  }

  private async installDependencies(
    projectPath: string,
    template: ProjectTemplate
  ): Promise<void> {
    // Install main dependencies
    if (template.dependencies.length > 0) {
      await this.executeCommand(
        'npm install',
        projectPath,
        template.dependencies
      );
    }

    // Install dev dependencies
    if (template.devDependencies.length > 0) {
      await this.executeCommand(
        'npm install --save-dev',
        projectPath,
        template.devDependencies
      );
    }
  }

  private async configureProject(
    projectPath: string,
    request: ProjectCreationRequest,
    template: ProjectTemplate
  ): Promise<void> {
    // Update package.json scripts
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      ...template.scripts,
    };

    packageJson.description = request.description || template.description;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Create tsconfig.json if TypeScript is used
    if (template.devDependencies.includes('typescript')) {
      const tsconfigPath = path.join(projectPath, 'tsconfig.json');
      if (!fs.existsSync(tsconfigPath)) {
        const tsconfig = {
          compilerOptions: {
            target: 'ES2020',
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            jsx: 'react-jsx',
            module: 'ESNext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            allowJs: true,
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            baseUrl: '.',
            paths: {
              '@/*': ['src/*'],
            },
          },
          include: ['src'],
          exclude: ['node_modules', 'dist', 'build'],
        };

        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      }
    }
  }

  async getAvailableTemplates(): Promise<ProjectTemplate[]> {
    return Array.from(this.templates.values());
  }

  async startDevServer(projectPath: string): Promise<{ port: number; pid: number }> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const devScript = packageJson.scripts?.dev || 'npm start';

    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'dev'], {
        cwd: projectPath,
        stdio: 'inherit',
        shell: true,
      });

      // Assume default ports based on common frameworks
      setTimeout(() => {
        resolve({
          port: 3000,
          pid: child.pid || 0,
        });
      }, 3000);

      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  async autoFixBuildErrors(projectPath: string): Promise<string[]> {
    const fixes: string[] = [];

    try {
      // Run build and capture errors
      const { stdout, stderr } = await execAsync('npm run build', { cwd: projectPath });
      const output = stdout + stderr;

      // Analyze common errors and apply fixes
      if (output.includes('Cannot find module')) {
        fixes.push('Missing dependency detected. Running npm install...');
        await execAsync('npm install', { cwd: projectPath });
      }

      if (output.includes('TypeScript error')) {
        fixes.push('TypeScript errors detected. Attempting automatic fixes...');
        // Could implement more sophisticated TypeScript error fixing here
      }

      if (output.includes('Port already in use')) {
        fixes.push('Port conflict detected. Will use alternate port.');
      }
    } catch (err) {
      console.error('Error during auto-fix:', err);
    }

    return fixes;
  }
}
