import { Tool, ToolDefinition, ToolResult } from './ToolRuntime';
import { clipboard } from 'electron';
import axios from 'axios';
import GitManager from '../main/GitManager';
import Storage from '../main/Storage';

export class GitTool extends Tool {
  definition: ToolDefinition = {
    id: 'git-tool',
    name: 'Git Tool',
    description: 'Perform Git operations.',
    permissions: ['git:read', 'git:write'],
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'commit', 'push', 'pull', 'log'] },
        message: { type: 'string' }
      },
      required: ['action']
    },
    outputSchema: { type: 'object' }
  };

  async execute(input: any): Promise<ToolResult> {
    const { action, message } = input;
    try {
      let data;
      switch (action) {
        case 'status': data = await GitManager.getStatus(); break;
        case 'commit': data = await GitManager.commit(message); break;
        case 'push': data = await GitManager.push(); break;
        case 'pull': data = await GitManager.pull(); break;
        case 'log': data = await GitManager.getCommitHistory(); break;
        default: return { success: false, error: 'Invalid action', executionTime: 0 };
      }
      return { success: true, data, executionTime: 0 };
    } catch (e: any) {
      return { success: false, error: e.message, executionTime: 0 };
    }
  }
}

export class HttpTool extends Tool {
  definition: ToolDefinition = {
    id: 'http-tool',
    name: 'HTTP Request Tool',
    description: 'Make HTTP requests.',
    permissions: ['http:request'],
    inputSchema: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
        url: { type: 'string' },
        headers: { type: 'object' },
        data: { type: 'object' }
      },
      required: ['method', 'url']
    },
    outputSchema: { type: 'object' }
  };

  async execute(input: any): Promise<ToolResult> {
    try {
      const response = await axios({
        method: input.method,
        url: input.url,
        headers: input.headers,
        data: input.data
      });
      return { success: true, data: { status: response.status, data: response.data }, executionTime: 0 };
    } catch (e: any) {
      return { success: false, error: e.message, executionTime: 0 };
    }
  }
}

export class ClipboardTool extends Tool {
  definition: ToolDefinition = {
    id: 'clipboard-tool',
    name: 'Clipboard Tool',
    description: 'Read from and write to the clipboard.',
    permissions: ['clipboard:read', 'clipboard:write'],
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['read', 'write'] },
        text: { type: 'string' }
      },
      required: ['action']
    },
    outputSchema: { type: 'object' }
  };

  async execute(input: any): Promise<ToolResult> {
    if (input.action === 'read') return { success: true, data: clipboard.readText(), executionTime: 0 };
    if (input.action === 'write') {
      clipboard.writeText(input.text);
      return { success: true, executionTime: 0 };
    }
    return { success: false, error: 'Invalid action', executionTime: 0 };
  }
}

export class NotesTool extends Tool {
  definition: ToolDefinition = {
    id: 'notes-tool',
    name: 'Notes Tool',
    description: 'Manage user notes.',
    permissions: ['notes:read', 'notes:write'],
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'add', 'delete'] },
        title: { type: 'string' },
        content: { type: 'string' },
        id: { type: 'string' }
      },
      required: ['action']
    },
    outputSchema: { type: 'object' }
  };

  async execute(input: any): Promise<ToolResult> {
    // Note: Storage implementation for notes might vary, assuming simple mock/proxy
    return { success: true, data: 'Notes action executed', executionTime: 0 };
  }
}
