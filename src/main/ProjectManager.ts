import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

export class ProjectManager {
  private projects: any[] = [];

  async addProject(rootPath: string, name?: string) {
    const project = {
      id: nanoid(),
      name: name || path.basename(rootPath),
      path: rootPath,
      lastOpened: new Date().toISOString()
    };
    this.projects.push(project);
    return project;
  }

  async getProjects() {
    return this.projects;
  }

  async getProject(id: string) {
    return this.projects.find(p => p.id === id);
  }

  async updateProjectLastOpened(id: string) {
    const project = this.projects.find(p => p.id === id);
    if (project) {
      project.lastOpened = new Date().toISOString();
    }
    return project;
  }

  async deleteProject(id: string) {
    this.projects = this.projects.filter(p => p.id !== id);
    return true;
  }

  async renameProject(id: string, newName: string) {
    const project = this.projects.find(p => p.id === id);
    if (project) {
      project.name = newName;
    }
    return project;
  }

  async getProjectFiles(projectId: string, relativePath: string = '') {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');
    
    const fullPath = path.join(project.path, relativePath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(relativePath, entry.name)
    }));
  }

  async readFile(projectId: string, filePath: string) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');
    return fs.readFile(path.join(project.path, filePath), 'utf-8');
  }

  async writeFile(projectId: string, filePath: string, content: string) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');
    await fs.writeFile(path.join(project.path, filePath), content);
    return true;
  }

  async deleteFile(projectId: string, filePath: string) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');
    await fs.unlink(path.join(project.path, filePath));
    return true;
  }

  async createFile(projectId: string, filePath: string) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');
    await fs.writeFile(path.join(project.path, filePath), '');
    return true;
  }

  async createDirectory(projectId: string, dirPath: string) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');
    await fs.mkdir(path.join(project.path, dirPath), { recursive: true });
    return true;
  }
}

export default new ProjectManager();
