import { Tool, ToolDefinition, ToolResult } from './ToolRuntime.js';
import fs from 'fs/promises';
import path from 'path';

export class FileSystemTool extends Tool {
  definition: ToolDefinition = {
    id: 'fs-tool',
    name: 'File System Tool',
    description: 'Read, write, and manage files on the filesystem.',
    permissions: ['fs:read', 'fs:write'],
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['read', 'write', 'list', 'delete', 'mkdir'] },
        path: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['action', 'path']
    },
    outputSchema: {
      type: 'object'
    }
  };

  async execute(input: any): Promise<ToolResult> {
    const { action, path: filePath, content } = input;
    try {
      switch (action) {
        case 'read':
          const data = await fs.readFile(filePath, 'utf-8');
          return { success: true, data, executionTime: 0 };
        case 'write':
          await fs.writeFile(filePath, content || '');
          return { success: true, executionTime: 0 };
        case 'list':
          const files = await fs.readdir(filePath);
          return { success: true, data: files, executionTime: 0 };
        case 'delete':
          await fs.rm(filePath, { recursive: true, force: true });
          return { success: true, executionTime: 0 };
        case 'mkdir':
          await fs.mkdir(filePath, { recursive: true });
          return { success: true, executionTime: 0 };
        default:
          return { success: false, error: `Unsupported action: ${action}`, executionTime: 0 };
      }
    } catch (error: any) {
      return { success: false, error: error.message, executionTime: 0 };
    }
  }
}
