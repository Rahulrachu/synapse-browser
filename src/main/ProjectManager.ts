import path from 'path';
import { app, dialog } from 'electron';
import fs from 'fs';

export interface ProjectFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: number;
}

export interface Project {
  id: string;
  name: string;
  rootPath: string;
  createdAt: number;
  lastOpened: number;
}

class ProjectManager {
  private dataDir: string;
  private projectsFile: string;
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    this.projectsFile = path.join(this.dataDir, 'projects.json');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.loadProjects();
  }

  private loadProjects(): void {
    try {
      if (fs.existsSync(this.projectsFile)) {
        const data = JSON.parse(fs.readFileSync(this.projectsFile, 'utf-8'));
        data.forEach((project: Project) => {
          this.projects.set(project.id, project);
        });
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  addProject(rootPath: string, name?: string): Project {
    const projectName = name || path.basename(rootPath);
    const project: Project = {
      id: Date.now().toString(),
      name: projectName,
      rootPath,
      createdAt: Date.now(),
      lastOpened: Date.now(),
    };
    this.projects.set(project.id, project);
    this.saveProjects();
    return project;
  }

  getProjects(): Project[] {
    return Array.from(this.projects.values()).sort((a, b) => b.lastOpened - a.lastOpened);
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  updateProjectLastOpened(id: string): boolean {
    const project = this.projects.get(id);
    if (project) {
      project.lastOpened = Date.now();
      this.saveProjects();
      return true;
    }
    return false;
  }

  deleteProject(id: string): boolean {
    if (this.projects.delete(id)) {
      this.saveProjects();
      return true;
    }
    return false;
  }

  renameProject(id: string, newName: string): boolean {
    const project = this.projects.get(id);
    if (project) {
      project.name = newName;
      this.saveProjects();
      return true;
    }
    return false;
  }

  getProjectFiles(projectId: string, relativePath: string = ''): ProjectFile[] {
    const project = this.projects.get(projectId);
    if (!project) return [];

    const fullPath = path.join(project.rootPath, relativePath);

    try {
      if (!fs.existsSync(fullPath)) return [];

      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      return entries
        .filter((entry) => !entry.name.startsWith('.'))
        .map((entry) => {
          const entryPath = path.join(fullPath, entry.name);
          const stats = fs.statSync(entryPath);
          return {
            path: path.relative(project.rootPath, entryPath),
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: entry.isFile() ? stats.size : undefined,
            modifiedAt: stats.mtime.getTime(),
          };
        });
    } catch (error) {
      console.error('Failed to read project files:', error);
      return [];
    }
  }

  readFile(projectId: string, filePath: string): string | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    try {
      const fullPath = path.join(project.rootPath, filePath);
      if (!fullPath.startsWith(project.rootPath)) return null;

      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf-8');
      }
    } catch (error) {
      console.error('Failed to read file:', error);
    }
    return null;
  }

  writeFile(projectId: string, filePath: string, content: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      const fullPath = path.join(project.rootPath, filePath);
      if (!fullPath.startsWith(project.rootPath)) return false;

      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to write file:', error);
    }
    return false;
  }

  deleteFile(projectId: string, filePath: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      const fullPath = path.join(project.rootPath, filePath);
      if (!fullPath.startsWith(project.rootPath)) return false;

      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        return true;
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
    return false;
  }

  createFile(projectId: string, filePath: string): boolean {
    return this.writeFile(projectId, filePath, '');
  }

  createDirectory(projectId: string, dirPath: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      const fullPath = path.join(project.rootPath, dirPath);
      if (!fullPath.startsWith(project.rootPath)) return false;

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        return true;
      }
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
    return false;
  }

  private saveProjects(): void {
    try {
      fs.writeFileSync(
        this.projectsFile,
        JSON.stringify(Array.from(this.projects.values()), null, 2)
      );
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  }
}

export default new ProjectManager();
