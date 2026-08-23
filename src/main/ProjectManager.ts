import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

export interface ProjectRecord {
  id: string;
  name: string;
  path: string;
  lastOpened: string;
}

function confinedPath(root: string, relativePath: string): string {
  if (typeof relativePath !== 'string' || path.isAbsolute(relativePath)) {
    throw new Error('A relative project path is required');
  }
  const rootResolved = path.resolve(root);
  const candidate = path.resolve(rootResolved, relativePath);
  if (candidate !== rootResolved && !candidate.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error('Project path escapes the project root');
  }
  return candidate;
}

export class ProjectManager {
  private projects: ProjectRecord[] = [];

  async addProject(rootPath: string, name?: string): Promise<ProjectRecord> {
    const resolvedRoot = path.resolve(rootPath);
    const stat = await fs.stat(resolvedRoot);
    if (!stat.isDirectory()) throw new Error('Project root must be a directory');
    const project: ProjectRecord = {
      id: nanoid(),
      name: name?.trim() || path.basename(resolvedRoot),
      path: resolvedRoot,
      lastOpened: new Date().toISOString(),
    };
    this.projects.push(project);
    return project;
  }

  async getProjects(): Promise<ProjectRecord[]> { return [...this.projects]; }
  async getProject(id: string): Promise<ProjectRecord | undefined> { return this.projects.find((project) => project.id === id); }

  async updateProjectLastOpened(id: string): Promise<ProjectRecord | undefined> {
    const project = await this.getProject(id);
    if (project) project.lastOpened = new Date().toISOString();
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    const previousLength = this.projects.length;
    this.projects = this.projects.filter((project) => project.id !== id);
    return this.projects.length !== previousLength;
  }

  async renameProject(id: string, newName: string): Promise<ProjectRecord | undefined> {
    const project = await this.getProject(id);
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.includes(path.sep) || trimmedName.includes(path.posix.sep)) {
      throw new Error('Project name must be a non-empty name');
    }
    if (project) project.name = trimmedName;
    return project;
  }

  private async getConfinedPath(projectId: string, relativePath: string): Promise<string> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');
    const candidate = confinedPath(project.path, relativePath);
    const realRoot = await fs.realpath(project.path);
    try {
      const realCandidate = await fs.realpath(candidate);
      if (realCandidate !== realRoot && !realCandidate.startsWith(`${realRoot}${path.sep}`)) {
        throw new Error('Project path escapes the project root');
      }
    } catch (error) {
      const code = error as NodeJS.ErrnoException;
      if (code.code !== 'ENOENT') throw error;
    }
    return candidate;
  }

  async getProjectFiles(projectId: string, relativePath = '') {
    const fullPath = await this.getConfinedPath(projectId, relativePath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(relativePath, entry.name),
    }));
  }

  async readFile(projectId: string, filePath: string): Promise<string> {
    return fs.readFile(await this.getConfinedPath(projectId, filePath), 'utf-8');
  }

  async writeFile(projectId: string, filePath: string, content: string): Promise<boolean> {
    const target = await this.getConfinedPath(projectId, filePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf-8');
    return true;
  }

  async deleteFile(projectId: string, filePath: string): Promise<boolean> {
    await fs.unlink(await this.getConfinedPath(projectId, filePath));
    return true;
  }

  async createFile(projectId: string, filePath: string): Promise<boolean> {
    const target = await this.getConfinedPath(projectId, filePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, '', { flag: 'wx' });
    return true;
  }

  async createDirectory(projectId: string, dirPath: string): Promise<boolean> {
    await fs.mkdir(await this.getConfinedPath(projectId, dirPath), { recursive: true });
    return true;
  }
}

export default new ProjectManager();
