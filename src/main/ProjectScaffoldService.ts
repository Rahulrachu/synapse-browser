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

/**
 * Manages the scaffolding and creation of new projects based on predefined templates.
 * It handles project initialization, dependency installation, and basic configuration.
 * It also includes functionality to detect and attempt to fix common build errors.
 */
export class ProjectScaffoldService {
  private templates: Map<string, ProjectTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initializes the available project templates.
   * Each template defines the project type, command to create it, description, dependencies, and scripts.
   */
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

  /**
   * Creates a new project based on the provided request and template.
   * It goes through several stages: initializing, scaffolding, installing dependencies, and configuring.
   * Progress updates are reported via the `onProgress` callback.
   * @param request The `ProjectCreationRequest` object containing details for the new project.
   * @param onProgress A callback function to report the progress of the project creation.
   * @returns A promise that resolves to the path of the newly created project.
   * @throws An error if the project type is unknown or creation fails at any stage.
   */
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

  /**
   * Executes a shell command asynchronously.
   * @param command The command string to execute (e.g., 'npm install').
   * @param cwd The current working directory for the command.
   * @param args An array of arguments to pass to the command.
   * @returns A promise that resolves when the command completes successfully, or rejects if it fails.
   */
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

  /**
   * Scaffolds additional project files and directories after initial creation.
   * This includes creating common directories (src, public, docs, tests, config), README.md, .gitignore, and .env.example.
   * @param projectPath The root path of the newly created project.
   * @param request The `ProjectCreationRequest` object.
   */
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

  /**
   * Installs production and development dependencies for the project using npm.
   * @param projectPath The root path of the project.
   * @param template The `ProjectTemplate` containing dependency lists.
   */
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

  /**
   * Configures the newly created project, including updating `package.json` scripts and description,
   * and creating a `tsconfig.json` if TypeScript is used.
   * @param projectPath The root path of the project.
   * @param request The `ProjectCreationRequest` object.
   * @param template The `ProjectTemplate` used for creation.
   */
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

  /**
   * Retrieves a list of all available project templates.
   * @returns A promise that resolves to an array of `ProjectTemplate` objects.
   */
  async getAvailableTemplates(): Promise<ProjectTemplate[]> {
    return Array.from(this.templates.values());
  }

  /**
   * Starts the development server for a given project.
   * It assumes common `npm run dev` scripts and attempts to detect the port.
   * @param projectPath The root path of the project.
   * @returns A promise that resolves to an object containing the port number and process ID of the dev server.
   */
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

  /**
   * Automatically attempts to fix common build errors in a project.
   */
  async autoFixBuildErrors(projectPath: string): Promise<string[]> {
    const appliedFixes: string[] = [];
    const MAX_RETRIES = 2;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // Run build and capture errors
        const { stdout, stderr } = await execAsync('npm run build', { cwd: projectPath });
        if (!stderr.includes('error')) break; // Success
      } catch (err: any) {
        const output = err.stdout + err.stderr;

        if (output.includes('Cannot find module')) {
          const moduleMatch = output.match(/Cannot find module '([^']+)'/);
          const moduleName = moduleMatch ? moduleMatch[1] : null;
          
          if (moduleName) {
            appliedFixes.push(`Missing dependency detected: ${moduleName}. Installing...`);
            await execAsync(`npm install ${moduleName}`, { cwd: projectPath });
          } else {
            appliedFixes.push('Missing dependencies detected. Running full npm install...');
            await execAsync('npm install', { cwd: projectPath });
          }
          continue;
        }

        if (output.includes('TS2307') || output.includes('Cannot find module')) {
           appliedFixes.push('TypeScript module resolution error. Checking @types...');
           // Try to install missing @types
           const typesMatch = output.match(/module '([^']+)'/);
           if (typesMatch) {
             await execAsync(`npm install --save-dev @types/${typesMatch[1]}`, { cwd: projectPath }).catch(() => {});
           }
        }

        if (output.includes('Port already in use')) {
          appliedFixes.push('Port conflict detected. Suggesting environment variable override.');
          // Logic to update .env or suggest a new port
        }
        
        // If we reach here and haven't fixed it, break to avoid loops
        break;
      }
    }

    return appliedFixes;
  }
}
