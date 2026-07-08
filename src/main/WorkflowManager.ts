import { ipcMain } from 'electron';
import { Workflow } from '../common/types/workflow';
import Storage from './Storage';
import WorkflowEngine from './WorkflowEngine';

class WorkflowManager {
  private STORAGE_KEY = 'workflows';

  constructor() {
    this.setupIPCHandlers();
  }

  private setupIPCHandlers() {
    ipcMain.handle('workflow:get-all', () => this.getAllWorkflows());
    ipcMain.handle('workflow:save', (_, workflow: Workflow) => this.saveWorkflow(workflow));
    ipcMain.handle('workflow:delete', (_, id: string) => this.deleteWorkflow(id));
    ipcMain.handle('workflow:execute', (_, id: string) => this.executeWorkflow(id));
    ipcMain.handle('workflow:import', (_, json: string) => this.importWorkflow(json));
    ipcMain.handle('workflow:export', (_, id: string) => this.exportWorkflow(id));
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    const workflows = await Storage.get(this.STORAGE_KEY);
    return workflows || [];
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    const workflows = await this.getAllWorkflows();
    const index = workflows.findIndex(w => w.id === workflow.id);
    
    if (index >= 0) {
      workflows[index] = { ...workflow, updatedAt: Date.now() };
    } else {
      workflows.push({ ...workflow, createdAt: Date.now(), updatedAt: Date.now() });
    }

    await Storage.set(this.STORAGE_KEY, workflows);
  }

  async deleteWorkflow(id: string): Promise<void> {
    const workflows = await this.getAllWorkflows();
    const filtered = workflows.filter(w => w.id !== id);
    await Storage.set(this.STORAGE_KEY, filtered);
  }

  async executeWorkflow(id: string): Promise<any> {
    const workflows = await this.getAllWorkflows();
    const workflow = workflows.find(w => w.id === id);
    if (!workflow) throw new Error('Workflow not found');
    
    return WorkflowEngine.executeWorkflow(workflow);
  }

  async importWorkflow(json: string): Promise<void> {
    try {
      const workflow: Workflow = JSON.parse(json);
      // Generate a new ID to avoid collisions
      workflow.id = `imported-${Date.now()}`;
      await this.saveWorkflow(workflow);
    } catch (error) {
      throw new Error('Invalid workflow JSON');
    }
  }

  async exportWorkflow(id: string): Promise<string> {
    const workflows = await this.getAllWorkflows();
    const workflow = workflows.find(w => w.id === id);
    if (!workflow) throw new Error('Workflow not found');
    return JSON.stringify(workflow, null, 2);
  }
}

export default new WorkflowManager();
