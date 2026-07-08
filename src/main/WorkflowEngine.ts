import { Workflow, WorkflowAction, WorkflowExecutionResult } from '../common/types/workflow';
import BrowserManager from './BrowserManager';
import PluginManager from './PluginManager';

class WorkflowEngine {
  async executeWorkflow(workflow: Workflow): Promise<WorkflowExecutionResult> {
    console.log(`Executing workflow: ${workflow.name} (${workflow.id})`);
    let completedActions = 0;

    try {
      for (const action of workflow.actions) {
        await this.executeAction(action);
        completedActions++;
      }
      return {
        success: true,
        completedActions,
        totalActions: workflow.actions.length
      };
    } catch (error: any) {
      console.error(`Workflow execution failed at action ${completedActions + 1}:`, error);
      return {
        success: false,
        error: error.message,
        completedActions,
        totalActions: workflow.actions.length
      };
    }
  }

  private async executeAction(action: WorkflowAction): Promise<void> {
    console.log(`Executing action: ${action.type}`);
    
    switch (action.type) {
      case 'open-url':
        if (!action.params.url) throw new Error('URL is required for open-url action');
        BrowserManager.createTab(action.params.url);
        break;

      case 'wait':
        const duration = action.params.durationMs || 1000;
        await new Promise(resolve => setTimeout(resolve, duration));
        break;

      case 'plugin-action':
        const { pluginId, commandId } = action.params;
        if (!pluginId || !commandId) throw new Error('pluginId and commandId are required for plugin-action');
        console.log(`Executing plugin action: ${pluginId}:${commandId}`);
        // Integration with PluginManager to execute action
        // await PluginManager.executePluginAction(pluginId, commandId, action.params);
        break;

      case 'show-notification':
        const { title, message } = action.params;
        console.log(`Notification: ${title} - ${message}`);
        // Integration with notification system
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
        break;
    }
  }
}

export default new WorkflowEngine();
