import * as path from "path";
import * as fsp from "fs/promises";
import { nanoid } from "nanoid";

export function confinedPath(root, relativePath) {
  if (typeof relativePath !== "string" || path.isAbsolute(relativePath)) {
    throw new Error("A relative project path is required");
  }
  const rootResolved = path.resolve(root);
  const candidate = path.resolve(rootResolved, relativePath);
  if (candidate !== rootResolved && !candidate.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error("Project path escapes the project root");
  }
  return candidate;
}
class ProjectManager {
  projects = [];
  async addProject(rootPath, name) {
    const resolvedRoot = path.resolve(rootPath);
    const stat = await fsp.stat(resolvedRoot);
    if (!stat.isDirectory()) throw new Error("Project root must be a directory");
    const project = {
      id: nanoid(),
      name: name?.trim() || path.basename(resolvedRoot),
      path: resolvedRoot,
      lastOpened: new Date().toISOString(),
    };
    this.projects.push(project);
    return project;
  }
  async getProjects() {
    return [...this.projects];
  }
  async getProject(id) {
    return this.projects.find((project) => project.id === id);
  }
  async updateProjectLastOpened(id) {
    const project = await this.getProject(id);
    if (project) project.lastOpened = new Date().toISOString();
    return project;
  }
  async deleteProject(id) {
    const previousLength = this.projects.length;
    this.projects = this.projects.filter((project) => project.id !== id);
    return this.projects.length !== previousLength;
  }
  async renameProject(id, newName) {
    const project = await this.getProject(id);
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName.includes(path.sep) || trimmedName.includes(path.posix.sep)) {
      throw new Error("Project name must be a non-empty name");
    }
    if (project) project.name = trimmedName;
    return project;
  }
  async getConfinedPath(projectId, relativePath) {
    const project = await this.getProject(projectId);
    if (!project) throw new Error("Project not found");
    const candidate = confinedPath(project.path, relativePath);
    const realRoot = await fsp.realpath(project.path);
    try {
      const realCandidate = await fsp.realpath(candidate);
      if (realCandidate !== realRoot && !realCandidate.startsWith(`${realRoot}${path.sep}`)) {
        throw new Error("Project path escapes the project root");
      }
    } catch (error) {
      const code = error;
      if (code.code !== "ENOENT") throw error;
    }
    return candidate;
  }
  async getProjectFiles(projectId, relativePath = "") {
    const fullPath = await this.getConfinedPath(projectId, relativePath);
    const entries = await fsp.readdir(fullPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(relativePath, entry.name),
    }));
  }
  async readFile(projectId, filePath) {
    return fsp.readFile(await this.getConfinedPath(projectId, filePath), "utf-8");
  }
  async writeFile(projectId, filePath, content) {
    const target = await this.getConfinedPath(projectId, filePath);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, content, "utf-8");
    return true;
  }
  async deleteFile(projectId, filePath) {
    await fsp.unlink(await this.getConfinedPath(projectId, filePath));
    return true;
  }
  async createFile(projectId, filePath) {
    const target = await this.getConfinedPath(projectId, filePath);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, "", { flag: "wx" });
    return true;
  }
  async createDirectory(projectId, dirPath) {
    await fsp.mkdir(await this.getConfinedPath(projectId, dirPath), { recursive: true });
    return true;
  }
}
export const projectManager = new ProjectManager();
