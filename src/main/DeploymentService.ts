import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type DeploymentTarget = 'vercel' | 'netlify' | 'github' | 'docker' | 'railway' | 'cloudflare';

export interface DeploymentConfig {
  target: DeploymentTarget;
  projectName: string;
  environment?: Record<string, string>;
  buildCommand?: string;
  startCommand?: string;
  framework?: string;
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  deploymentId?: string;
  message: string;
  logs: string[];
}

/**
 * Manages the deployment of projects to various platforms like Vercel, Netlify, GitHub Pages, Docker, Railway, and Cloudflare.
 * It handles project validation, building, and platform-specific deployment configurations.
 */
export class DeploymentService {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Initiates the deployment process for a project to a specified target.
   * Performs project validation, builds the project, and then calls the appropriate platform-specific deployment method.
   * @param config The `DeploymentConfig` object containing deployment target and other configurations.
   * @returns A promise that resolves to a `DeploymentResult` object detailing the outcome of the deployment.
   */
  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const result: DeploymentResult = {
      success: false,
      message: '',
      logs: [],
    };

    try {
      // Validate project
      await this.validateProject();
      result.logs.push('✓ Project validation passed');

      // Build project
      await this.buildProject(config);
      result.logs.push('✓ Project built successfully');

      // Deploy based on target
      switch (config.target) {
        case 'vercel':
          return await this.deployToVercel(config, result);
        case 'netlify':
          return await this.deployToNetlify(config, result);
        case 'github':
          return await this.deployToGitHub(config, result);
        case 'docker':
          return await this.deployToDocker(config, result);
        case 'railway':
          return await this.deployToRailway(config, result);
        case 'cloudflare':
          return await this.deployToCloudflare(config, result);
        default:
          throw new Error(`Unknown deployment target: ${config.target}`);
      }
    } catch (err) {
      result.success = false;
      result.message = err instanceof Error ? err.message : 'Deployment failed';
      result.logs.push(`✗ Error: ${result.message}`);
      return result;
    }
  }

  /**
   * Validates the project structure, ensuring essential files like `package.json` exist.
   * @returns A promise that resolves if validation passes, or rejects with an error if it fails.
   */
  private async validateProject(): Promise<void> {
    const packageJsonPath = path.join(this.projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (!packageJson.name) {
      throw new Error('Project name not defined in package.json');
    }
  }

  /**
   * Builds the project using the specified build command or a default (`npm run build`).
   * @param config The `DeploymentConfig` object, used to retrieve the build command.
   * @returns A promise that resolves when the project build is complete.
   */
  private async buildProject(config: DeploymentConfig): Promise<void> {
    const buildCommand = config.buildCommand || 'npm run build';

    await execAsync(buildCommand, { cwd: this.projectPath });
  }

  /**
   * Deploys the project to Vercel.
   * Installs Vercel CLI if not present and uses it for deployment.
   * @param config The `DeploymentConfig` object.
   * @param result The `DeploymentResult` object to update with Vercel-specific logs and status.
   * @returns A promise that resolves to the updated `DeploymentResult` object.
   */
  private async deployToVercel(
    config: DeploymentConfig,
    result: DeploymentResult
  ): Promise<DeploymentResult> {
    try {
      // Check if Vercel CLI is installed
      await execAsync('vercel --version', { cwd: this.projectPath });
    } catch {
      result.logs.push('Installing Vercel CLI...');
      await execAsync('npm install -g vercel', { cwd: this.projectPath });
    }

    result.logs.push('Deploying to Vercel...');

    const { stdout } = await execAsync('vercel --prod --token $VERCEL_TOKEN', {
      cwd: this.projectPath,
      env: { ...process.env, VERCEL_TOKEN: process.env.VERCEL_TOKEN || '' },
    });

    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      result.url = urlMatch[0];
      result.success = true;
      result.message = `Successfully deployed to Vercel: ${result.url}`;
    }

    return result;
  }

  /**
   * Deploys the project to Netlify.
   * Installs Netlify CLI if not present and uses it for deployment.
   * @param config The `DeploymentConfig` object.
   * @param result The `DeploymentResult` object to update with Netlify-specific logs and status.
   * @returns A promise that resolves to the updated `DeploymentResult` object.
   */
  private async deployToNetlify(
    config: DeploymentConfig,
    result: DeploymentResult
  ): Promise<DeploymentResult> {
    try {
      await execAsync('netlify --version', { cwd: this.projectPath });
    } catch {
      result.logs.push('Installing Netlify CLI...');
      await execAsync('npm install -g netlify-cli', { cwd: this.projectPath });
    }

    result.logs.push('Deploying to Netlify...');

    const { stdout } = await execAsync('netlify deploy --prod --dir=dist', {
      cwd: this.projectPath,
      env: { ...process.env, NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN || '' },
    });

    const urlMatch = stdout.match(/https:\/\/[^\s]+/);
    if (urlMatch) {
      result.url = urlMatch[0];
      result.success = true;
      result.message = `Successfully deployed to Netlify: ${result.url}`;
    }

    return result;
  }

  /**
   * Configures GitHub Pages deployment by creating a GitHub Actions workflow file.
   * @param config The `DeploymentConfig` object.
   * @param result The `DeploymentResult` object to update with GitHub-specific logs and status.
   * @returns A promise that resolves to the updated `DeploymentResult` object.
   */
  private async deployToGitHub(
    config: DeploymentConfig,
    result: DeploymentResult
  ): Promise<DeploymentResult> {
    result.logs.push('Setting up GitHub Pages deployment...');

    // Create GitHub Actions workflow
    const workflowDir = path.join(this.projectPath, '.github', 'workflows');
    fs.mkdirSync(workflowDir, { recursive: true });

    const workflowContent = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
`;

    fs.writeFileSync(path.join(workflowDir, 'deploy.yml'), workflowContent);
    result.logs.push('✓ GitHub Actions workflow created');

    result.success = true;
    result.message = 'GitHub Pages deployment configured. Push to main/master to deploy.';

    return result;
  }

  /**
   * Configures Docker deployment by creating `Dockerfile` and `docker-compose.yml`.
   * @param config The `DeploymentConfig` object.
   * @param result The `DeploymentResult` object to update with Docker-specific logs and status.
   * @returns A promise that resolves to the updated `DeploymentResult` object.
   */
  private async deployToDocker(
    config: DeploymentConfig,
    result: DeploymentResult
  ): Promise<DeploymentResult> {
    result.logs.push('Creating Docker configuration...');

    // Create Dockerfile
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
`;

    fs.writeFileSync(path.join(this.projectPath, 'Dockerfile'), dockerfile);
    result.logs.push('✓ Dockerfile created');

    // Create docker-compose.yml
    const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
`;

    fs.writeFileSync(path.join(this.projectPath, 'docker-compose.yml'), dockerCompose);
    result.logs.push('✓ docker-compose.yml created');

    result.success = true;
    result.message = 'Docker configuration created. Run: docker-compose up';

    return result;
  }

  /**
   * Configures Railway deployment by creating a `railway.json` file.
   * @param config The `DeploymentConfig` object.
   * @param result The `DeploymentResult` object to update with Railway-specific logs and status.
   * @returns A promise that resolves to the updated `DeploymentResult` object.
   */
  private async deployToRailway(
    config: DeploymentConfig,
    result: DeploymentResult
  ): Promise<DeploymentResult> {
    result.logs.push('Configuring Railway deployment...');

    // Create railway.json
    const railwayConfig = {
      '$schema': 'https://railway.app/railway.schema.json',
      'build': {
        'builder': 'nixpacks',
      },
      'deploy': {
        'startCommand': config.startCommand || 'npm start',
        'restartPolicyType': 'on_failure',
        'restartPolicyMaxRetries': 5,
      },
    };

    fs.writeFileSync(
      path.join(this.projectPath, 'railway.json'),
      JSON.stringify(railwayConfig, null, 2)
    );
    result.logs.push('✓ railway.json created');

    result.success = true;
    result.message = 'Railway deployment configured. Connect your GitHub repo to Railway.';

    return result;
  }

  /**
   * Configures Cloudflare Workers deployment by creating a `wrangler.toml` file.
   * @param config The `DeploymentConfig` object.
   * @param result The `DeploymentResult` object to update with Cloudflare-specific logs and status.
   * @returns A promise that resolves to the updated `DeploymentResult` object.
   */
  private async deployToCloudflare(
    config: DeploymentConfig,
    result: DeploymentResult
  ): Promise<DeploymentResult> {
    result.logs.push('Configuring Cloudflare deployment...');

    // Create wrangler.toml
    const wranglerConfig = `name = "${config.projectName}"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "example.com/*", zone_name = "example.com" }
]
`;

    fs.writeFileSync(path.join(this.projectPath, 'wrangler.toml'), wranglerConfig);
    result.logs.push('✓ wrangler.toml created');

    result.success = true;
    result.message = 'Cloudflare Workers deployment configured. Run: wrangler deploy';

    return result;
  }

  /**
   * Retrieves the status of a specific deployment.
   * (Note: This is a placeholder and would require integration with each platform's API for a real implementation).
   * @param target The `DeploymentTarget` of the deployment.
   * @param deploymentId The unique ID of the deployment.
   * @returns A promise that resolves to a record containing deployment status information.
   */
  async getDeploymentStatus(target: DeploymentTarget, deploymentId: string): Promise<Record<string, any>> {
    // Implementation would depend on each platform's API
    return {
      target,
      deploymentId,
      status: 'active',
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Rolls back a specific deployment.
   * (Note: This is a placeholder and would require integration with each platform's API for a real implementation).
   * @param target The `DeploymentTarget` of the deployment to roll back.
   * @param deploymentId The unique ID of the deployment to roll back.
   * @returns A promise that resolves to `true` if the rollback was successful, `false` otherwise.
   */
  async rollbackDeployment(target: DeploymentTarget, deploymentId: string): Promise<boolean> {
    // Implementation would depend on each platform's API
    console.log(`Rolling back ${target} deployment ${deploymentId}`);
    return true;
  }
}
