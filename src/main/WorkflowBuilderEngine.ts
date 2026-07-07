import * as fs from 'fs';
import * as path from 'path';
import { DeploymentConfig, DeploymentTarget } from './DeploymentService';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'output';
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  inputs: string[];
  outputs: string[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: WorkflowVariable[];
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  description?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: number;
  completedAt?: number;
  variables: Record<string, any>;
  logs: ExecutionLog[];
  error?: string;
}

export interface ExecutionLog {
  timestamp: number;
  nodeId: string;
  message: string;
  level: 'info' | 'warning' | 'error';
}

export class WorkflowBuilderEngine {
  private workflowsPath: string;
  private executionsPath: string;

  constructor(projectPath: string) {
    this.workflowsPath = path.join(projectPath, '.synapse', 'workflows');
    this.executionsPath = path.join(projectPath, '.synapse', 'executions');

    // Ensure directories exist
    [this.workflowsPath, this.executionsPath].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  createWorkflow(name: string, description: string): Workflow {
    return {
      id: `workflow-${Date.now()}`,
      name,
      description,
      nodes: [],
      edges: [],
      variables: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  addNode(workflow: Workflow, node: WorkflowNode): void {
    workflow.nodes.push(node);
    workflow.updatedAt = Date.now();
  }

  addEdge(workflow: Workflow, edge: WorkflowEdge): void {
    workflow.edges.push(edge);
    workflow.updatedAt = Date.now();
  }

  removeNode(workflow: Workflow, nodeId: string): void {
    workflow.nodes = workflow.nodes.filter((n) => n.id !== nodeId);
    workflow.edges = workflow.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    workflow.updatedAt = Date.now();
  }

  removeEdge(workflow: Workflow, edgeId: string): void {
    workflow.edges = workflow.edges.filter((e) => e.id !== edgeId);
    workflow.updatedAt = Date.now();
  }

  saveWorkflow(workflow: Workflow): void {
    const filePath = path.join(this.workflowsPath, `${workflow.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
  }

  loadWorkflow(workflowId: string): Workflow | null {
    const filePath = path.join(this.workflowsPath, `${workflowId}.json`);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }

    return null;
  }

  listWorkflows(): Workflow[] {
    const workflows: Workflow[] = [];

    if (fs.existsSync(this.workflowsPath)) {
      const files = fs.readdirSync(this.workflowsPath);

      files.forEach((file) => {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(this.workflowsPath, file), 'utf-8');
          workflows.push(JSON.parse(content));
        }
      });
    }

    return workflows;
  }

  validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for at least one trigger
    const hasTrigger = workflow.nodes.some((n) => n.type === 'trigger');
    if (!hasTrigger) {
      errors.push('Workflow must have at least one trigger');
    }

    // Check for at least one action
    const hasAction = workflow.nodes.some((n) => n.type === 'action');
    if (!hasAction) {
      errors.push('Workflow must have at least one action');
    }

    // Check for dangling edges
    const nodeIds = new Set(workflow.nodes.map((n) => n.id));
    workflow.edges.forEach((edge) => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge references non-existent target node: ${edge.target}`);
      }
    });

    // Check for cycles (simplified)
    if (this.hasCycle(workflow)) {
      errors.push('Workflow contains circular dependencies');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async executeWorkflow(workflow: Workflow, variables?: Record<string, any>): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId: workflow.id,
      status: 'running',
      startedAt: Date.now(),
      variables: variables || {},
      logs: [],
    };

    try {
      // Validate workflow
      const validation = this.validateWorkflow(workflow);
      if (!validation.valid) {
        execution.status = 'failed';
        execution.error = validation.errors.join('; ');
        return execution;
      }

      // Find trigger node
      const triggerNode = workflow.nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found');
      }

      // Execute workflow starting from trigger
      await this.executeNode(workflow, triggerNode, execution);

      execution.status = 'completed';
      execution.completedAt = Date.now();
    } catch (err) {
      execution.status = 'failed';
      execution.error = err instanceof Error ? err.message : 'Unknown error';
      execution.logs.push({
        timestamp: Date.now(),
        nodeId: 'system',
        message: execution.error,
        level: 'error',
      });
    }

    // Save execution
    this.saveExecution(execution);

    return execution;
  }

  private async executeNode(
    workflow: Workflow,
    node: WorkflowNode,
    execution: WorkflowExecution
  ): Promise<void> {
    execution.logs.push({
      timestamp: Date.now(),
      nodeId: node.id,
      message: `Executing ${node.type}: ${node.label}`,
      level: 'info',
    });

    switch (node.type) {
      case 'trigger':
        await this.executeTrigger(node, execution);
        break;
      case 'action':
        await this.executeAction(node, execution);
        break;
      case 'condition':
        await this.executeCondition(workflow, node, execution);
        break;
      case 'output':
        await this.executeOutput(node, execution);
        break;
    }

    // Execute connected nodes
    const connectedEdges = workflow.edges.filter((e) => e.source === node.id);
    for (const edge of connectedEdges) {
      const nextNode = workflow.nodes.find((n) => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(workflow, nextNode, execution);
      }
    }
  }

  private async executeTrigger(node: WorkflowNode, execution: WorkflowExecution): Promise<void> {
    // Simulate trigger execution
    execution.logs.push({
      timestamp: Date.now(),
      nodeId: node.id,
      message: `Trigger "${node.label}" activated`,
      level: 'info',
    });
  }

  private async executeAction(node: WorkflowNode, execution: WorkflowExecution): Promise<void> {
    const action = node.config.action;

    execution.logs.push({
      timestamp: Date.now(),
      nodeId: node.id,
      message: `Executing action: ${action}`,
      level: 'info',
    });

    // Real service integration
    try {
      switch (action) {
        case 'run-tests': {
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          const { stdout, stderr } = await execAsync('npm test', { cwd: process.cwd() }).catch(e => e);
          execution.variables.testResults = { output: stdout + stderr, success: !stderr.includes('FAIL') };
          break;
        }
        case 'build': {
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          const { stdout, stderr } = await execAsync('npm run build', { cwd: process.cwd() }).catch(e => e);
          execution.variables.buildStatus = stderr.includes('error') ? 'failed' : 'success';
          break;
        }
        case 'deploy': {
          const { DeploymentService } = require(\'./DeploymentService\');
          const { DeploymentTarget } = require(\'./DeploymentService\');
          const deployService = new DeploymentService(process.cwd());
          const deploymentConfig = {
            target: node.config.target as DeploymentTarget || 'vercel',
            projectName: node.config.projectName || execution.variables.projectName || 'default-project',
            // Add other relevant properties from node.config to deploymentConfig
          };
          const result = await deployService.deploy(deploymentConfig);
          execution.variables.deploymentUrl = result.url;
          break;
        }
        case 'notify':
          // In production, would call a notification service (Slack, Email, etc.)
          execution.logs.push({
            timestamp: Date.now(),
            nodeId: node.id,
            message: `Notification sent: ${node.config.message}`,
            level: 'info',
          });
          break;
        default:
          execution.logs.push({
            timestamp: Date.now(),
            nodeId: node.id,
            message: `Unknown action: ${action}`,
            level: 'warning',
          });
      }
    } catch (err: any) {
      execution.logs.push({
        timestamp: Date.now(),
        nodeId: node.id,
        message: `Action ${action} failed: ${err.message}`,
        level: 'error',
      });
      throw err;
    }
  }

  private async executeCondition(
    workflow: Workflow,
    node: WorkflowNode,
    execution: WorkflowExecution
  ): Promise<void> {
    const condition = node.config.condition;
    const result = this.evaluateCondition(condition, execution.variables);

    execution.logs.push({
      timestamp: Date.now(),
      nodeId: node.id,
      message: `Condition evaluated: ${result}`,
      level: 'info',
    });

    // Only follow the appropriate branch
    const connectedEdges = workflow.edges.filter((e) => e.source === node.id);
    const targetEdge = connectedEdges.find(
      (e) => e.sourceHandle === (result ? 'true' : 'false')
    );

    if (targetEdge) {
      const nextNode = workflow.nodes.find((n) => n.id === targetEdge.target);
      if (nextNode) {
        await this.executeNode(workflow, nextNode, execution);
      }
    }
  }

  private async executeOutput(node: WorkflowNode, execution: WorkflowExecution): Promise<void> {
    execution.logs.push({
      timestamp: Date.now(),
      nodeId: node.id,
      message: `Workflow output: ${JSON.stringify(node.config.output)}`,
      level: 'info',
    });
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      // Simple condition evaluation
      // In production, would use a safer expression evaluator
      const func = new Function(...Object.keys(variables), `return ${condition}`);
      return func(...Object.values(variables));
    } catch {
      return false;
    }
  }

  private hasCycle(workflow: Workflow): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const connectedEdges = workflow.edges.filter((e) => e.source === nodeId);

      for (const edge of connectedEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycleDFS(edge.target)) {
            return true;
          }
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) {
          return true;
        }
      }
    }

    return false;
  }

  private saveExecution(execution: WorkflowExecution): void {
    const filePath = path.join(this.executionsPath, `${execution.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(execution, null, 2));
  }

  getExecutionHistory(workflowId: string, limit: number = 10): WorkflowExecution[] {
    const executions: WorkflowExecution[] = [];

    if (fs.existsSync(this.executionsPath)) {
      const files = fs.readdirSync(this.executionsPath)
        .sort()
        .reverse()
        .slice(0, limit);

      files.forEach((file) => {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(this.executionsPath, file), 'utf-8');
          const execution = JSON.parse(content);

          if (execution.workflowId === workflowId) {
            executions.push(execution);
          }
        }
      });
    }

    return executions;
  }
}
