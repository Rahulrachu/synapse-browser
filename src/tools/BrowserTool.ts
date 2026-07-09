import { Tool, ToolDefinition, ToolResult } from './ToolRuntime.js';
import BrowserAutomation from '../main/BrowserAutomation.js';

export class BrowserTool extends Tool {
  definition: ToolDefinition = {
    id: 'browser-tool',
    name: 'Browser Tool',
    description: 'Perform browser automation tasks like navigation, clicking, and typing.',
    permissions: ['browser:read', 'browser:write'],
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['navigate', 'click', 'type', 'screenshot', 'getSource'] },
        url: { type: 'string' },
        selector: { type: 'string' },
        text: { type: 'string' },
        tabId: { type: 'string' }
      },
      required: ['action']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'any' },
        error: { type: 'string' }
      }
    }
  };

  async execute(input: any): Promise<ToolResult> {
    const { action, url, selector, text, tabId } = input;
    let result;

    switch (action) {
      case 'navigate':
        result = await BrowserAutomation.navigate(url, tabId);
        break;
      case 'click':
        result = await BrowserAutomation.clickElement(selector, tabId);
        break;
      case 'type':
        result = await BrowserAutomation.typeText(selector, text, tabId);
        break;
      case 'screenshot':
        result = await BrowserAutomation.takeScreenshot(tabId);
        break;
      case 'getSource':
        result = await BrowserAutomation.getPageSource(tabId);
        break;
      default:
        return { success: false, error: `Unsupported action: ${action}`, executionTime: 0 };
    }

    return { 
      success: result.success, 
      data: result.data, 
      error: result.message, 
      executionTime: 0 
    };
  }
}
