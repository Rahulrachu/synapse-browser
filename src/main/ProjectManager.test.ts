import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ProjectManager } from './ProjectManager.js';

describe('ProjectManager filesystem confinement', () => {
  const roots: string[] = [];
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('allows normal project operations', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'synapse-project-'));
    roots.push(root);
    const manager = new ProjectManager();
    const project = await manager.addProject(root, 'Demo');
    await manager.createFile(project.id, 'src/main.ts');
    await manager.writeFile(project.id, 'src/main.ts', 'export const value = 1;');
    expect(await manager.readFile(project.id, 'src/main.ts')).toContain('value = 1');
  });

  it('rejects traversal and absolute paths', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'synapse-project-'));
    roots.push(root);
    const manager = new ProjectManager();
    const project = await manager.addProject(root);
    await expect(manager.readFile(project.id, '../outside.txt')).rejects.toThrow('escapes');
    await expect(manager.writeFile(project.id, path.join(os.tmpdir(), 'outside.txt'), 'x')).rejects.toThrow('relative');
  });
});
