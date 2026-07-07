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

/**
 * Manages project-related operations, including creating, loading, updating, and deleting projects.
 * It also provides functionalities for file system interactions within a project, such as reading, writing, and deleting files and directories.
 */
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

  /**
   * Loads project configurations from the file system.
   * If the projects file does not exist or is invalid, it logs an error and initializes an empty set of projects.
   */
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

  /**
   * Adds a new project to the manager.
   * @param rootPath The root directory path of the project.
   * @param name Optional. The name of the project. If not provided, the base name of the root path is used.
   * @returns The newly created and saved `Project` object.
   */
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

  /**
   * Retrieves all managed projects, sorted by `lastOpened` in descending order.
   * @returns An array of `Project` objects.
   */
  getProjects(): Project[] {
    return Array.from(this.projects.values()).sort((a, b) => b.lastOpened - a.lastOpened);
  }

  /**
   * Retrieves a specific project by its ID.
   * @param id The unique identifier of the project.
   * @returns The `Project` object if found, otherwise `undefined`.
   */
  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  /**
   * Updates the `lastOpened` timestamp for a specific project.
   * @param id The unique identifier of the project to update.
   * @returns `true` if the project was updated successfully, `false` otherwise.
   */
  updateProjectLastOpened(id: string): boolean {
    const project = this.projects.get(id);
    if (project) {
      project.lastOpened = Date.now();
      this.saveProjects();
      return true;
    }
    return false;
  }

  /**
   * Deletes a project by its ID.
   * @param id The unique identifier of the project to delete.
   * @returns `true` if the project was deleted successfully, `false` otherwise.
   */
  deleteProject(id: string): boolean {
    if (this.projects.delete(id)) {
      this.saveProjects();
      return true;
    }
    return false;
  }

  /**
   * Renames an existing project.
   * @param id The unique identifier of the project to rename.
   * @param newName The new name for the project.
   * @returns `true` if the project was renamed successfully, `false` otherwise.
   */
  renameProject(id: string, newName: string): boolean {
    const project = this.projects.get(id);
    if (project) {
      project.name = newName;
      this.saveProjects();
      return true;
    }
    return false;
  }

  /**
   * Retrieves a list of files and directories within a project at a given relative path.
   * @param projectId The ID of the project.
   * @param relativePath Optional. The path relative to the project root. Defaults to the project root.
   * @returns An array of `ProjectFile` objects.
   */
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

  /**
   * Reads the content of a file within a project.
   * @param projectId The ID of the project.
   * @param filePath The path to the file relative to the project root.
   * @returns The content of the file as a string, or `null` if the file cannot be read or found.
   */
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

  /**
   * Writes content to a file within a project. Creates directories if they don't exist.
   * @param projectId The ID of the project.
   * @param filePath The path to the file relative to the project root.
   * @param content The string content to write to the file.
   * @returns `true` if the file was written successfully, `false` otherwise.
   */
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

  /**
   * Deletes a file or directory within a project.
   * @param projectId The ID of the project.
   * @param filePath The path to the file or directory relative to the project root.
   * @returns `true` if the file/directory was deleted successfully, `false` otherwise.
   */
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

  /**
   * Creates a new empty file within a project.
   * @param projectId The ID of the project.
   * @param filePath The path to the new file relative to the project root.
   * @returns `true` if the file was created successfully, `false` otherwise.
   */
  createFile(projectId: string, filePath: string): boolean {
    return this.writeFile(projectId, filePath, '');
  }

  /**
   * Creates a new directory within a project.
   * @param projectId The ID of the project.
   * @param dirPath The path to the new directory relative to the project root.
   * @returns `true` if the directory was created successfully, `false` otherwise.
   */
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

  /**
   * Saves the current state of project configurations to the file system.
   * This method is called internally after any modification to the projects.
   */
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
