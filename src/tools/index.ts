import ToolRegistry from './ToolRuntime';
import { BrowserTool } from './BrowserTool';
import { TerminalTool } from './TerminalTool';
import { FileSystemTool } from './FileSystemTool';
import { ContextTool, MemoryTool, PlanningTool } from './EngineTools';
import { GitTool, HttpTool, ClipboardTool, NotesTool } from './OtherTools';

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
