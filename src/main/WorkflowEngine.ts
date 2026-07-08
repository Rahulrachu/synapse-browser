import { Workflow, WorkflowAction, WorkflowExecutionResult } from '../common/types/workflow';
import BrowserManager from './BrowserManager';
import PluginManager from './PluginManager';
import EventBus from './EventBus';
import PermissionManager from './PermissionManager';

class WorkflowEngine {
  async executeWorkflow(workflow: Workflow): Promise<WorkflowExecutionResult> {
    console.log(`Executing workflow: ${workflow.name} (${workflow.id})`);
    
    // Check for 'workflow:execution' permission
    const hasPermission = await PermissionManager.checkPermission(`workflow:${workflow.id}`, 'execution');
    if (!hasPermission) {
      const granted = await PermissionManager.requestPermission({
        id: `req-${Date.now()}`,
        scope: `workflow:${workflow.id}`,
        resource: 'execution',
        reason: `Execute workflow: ${workflow.name}`,
        timestamp: Date.now()
      });
      if (!granted) throw new Error(`Permission denied for workflow: ${workflow.name}`);
    }

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

      case 'trigger-event':
        const { type, payload, category } = action.params;
        EventBus.publish({
          id: `evt-${Date.now()}`,
          type,
          category: category || 'workflow',
          source: 'workflow-engine',
          payload,
          timestamp: Date.now(),
          priority: 0
        });
        break;

      case 'add-memory':
        const { content, memoryType, metadata, tags } = action.params;
        if (!content) throw new Error('Content is required for add-memory action');
        // Import MemoryManager dynamically to avoid circular dependency if any
        const { default: MemoryManager } = await import('../engine/MemoryManager');
        await MemoryManager.addMemory({
          content,
          type: memoryType || 'short_term',
          metadata: metadata || {},
          tags: tags || [],
          source: `workflow`
        });
        break;

      case 'search-memory':
        const { query, k } = action.params;
        if (!query) throw new Error('Query is required for search-memory action');
        const { default: MemMgr } = await import('../engine/MemoryManager');
        const results = await MemMgr.searchMemories(query, { k: k || 5 });
        // Store results in context or publish event
        EventBus.publish({
          id: `evt-${Date.now()}`,
          type: 'workflow:memory-search-results',
          category: 'workflow',
          source: 'workflow-engine',
          payload: { query, results },
          timestamp: Date.now(),
          priority: 0
        });
        break;

      case 'enqueue-job':
        const { default: TaskQueueManager } = await import('./TaskQueueManager');
        const { jobName, jobType, jobPayload, jobPriority, jobIsPersistent, jobMaxRetries, jobRetryDelay, jobMetadata } = action.params;
        if (!jobName || !jobType) throw new Error('Job name and type are required for enqueue-job action');
        await TaskQueueManager.enqueueJob({
          name: jobName,
          type: jobType,
          payload: jobPayload || {},
          priority: jobPriority,
          isPersistent: jobIsPersistent,
          maxRetries: jobMaxRetries,
          retryDelay: jobRetryDelay,
          metadata: jobMetadata || {},
        });
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
        break;
    }
  }
}

export default new WorkflowEngine();
