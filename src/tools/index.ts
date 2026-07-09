import ToolRegistry from './ToolRuntime.js';
import { BrowserTool } from './BrowserTool.js';
import { TerminalTool } from './TerminalTool.js';
import { FileSystemTool } from './FileSystemTool.js';
import { ContextTool, MemoryTool, PlanningTool } from './EngineTools.js';
import { GitTool, HttpTool, ClipboardTool, NotesTool } from './OtherTools.js';

// Initialize and register all tools
export function initializeTools() {
  ToolRegistry.register(new BrowserTool());
  ToolRegistry.register(new TerminalTool());
  ToolRegistry.register(new FileSystemTool());
  ToolRegistry.register(new ContextTool());
  ToolRegistry.register(new MemoryTool());
  ToolRegistry.register(new PlanningTool());
  ToolRegistry.register(new GitTool());
  ToolRegistry.register(new HttpTool());
  ToolRegistry.register(new ClipboardTool());
  ToolRegistry.register(new NotesTool());
}

export { ToolRegistry };
