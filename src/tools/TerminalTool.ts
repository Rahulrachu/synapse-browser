import { Tool, ToolDefinition, ToolResult } from './ToolRuntime.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TerminalTool extends Tool {
  definition: ToolDefinition = {
    id: 'terminal-tool',
    name: 'Terminal Tool',
    description: 'Execute shell commands in the terminal.',
    permissions: ['terminal:execute'],
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        cwd: { type: 'string' }
      },
      required: ['command']
    },
    outputSchema: {
      type: 'object',
      properties: {
        stdout: { type: 'string' },
        stderr: { type: 'string' },
        error: { type: 'string' }
      }
    }
  };

  async execute(input: any): Promise<ToolResult> {
    try {
      const { stdout, stderr } = await execAsync(input.command, { cwd: input.cwd });
      return { 
        success: true, 
        data: { stdout, stderr }, 
        executionTime: 0 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message, 
        data: { stderr: error.stderr }, 
        executionTime: 0 
      };
    }
  }
}
