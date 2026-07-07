import { lazy } from 'react';
import { PanelRegistryEntry } from '../types/panel';
import {
  Globe,
  BookmarkIcon,
  History,
  FileText,
  Terminal,
  Zap,
  Code,
  GitBranch,
  Settings,
  Search,
  Layers,
} from 'lucide-react';

// Eager imports for frequently used panels
import BrowserPanel from '../components/BrowserPanel';
import WorkspacePanel from '../components/WorkspacePanel';
import HistoryPanel from '../components/HistoryPanel';
import BookmarksPanel from '../components/BookmarksPanel';

// Lazy imports for heavier panels
const AIWorkspacePanel = lazy(() => import('../components/AIWorkspacePanel'));
const DeveloperWorkspace = lazy(() => import('../components/DeveloperWorkspace'));
const CommandPalette = lazy(() => import('../components/CommandPalette'));
const SettingsPanel = lazy(() => import('../components/SettingsPanel'));
const ProductivityPanel = lazy(() => import('../components/ProductivityPanel'));
const Terminal = lazy(() => import('../components/Terminal'));
const GitPanel = lazy(() => import('../components/GitPanel'));
const AIChatPanel = lazy(() => import('../components/AIChatPanel'));
const ProjectExplorerPanel = lazy(() => import('../components/ProjectExplorerPanel'));
const LivePreviewPanel = lazy(() => import('../components/LivePreviewPanel'));
const TerminalPanel = lazy(() => import('../components/TerminalPanel'));
const NotesPanel = lazy(() => import('../components/NotesPanel'));

class PanelRegistry {
  private panels: Map<string, PanelRegistryEntry> = new Map();

  constructor() {
    this.registerDefaultPanels();
  }

  private registerDefaultPanels() {
    // Browser Panel
    this.register({
      id: 'browser',
      title: 'Browser',
      icon: Globe,
      component: BrowserPanel,
      permissions: ['network', 'storage'],
      defaultLayout: 'full',
      shortcuts: { key: 'b', ctrlKey: true },
      lazy: false,
    });

    // Bookmarks Panel
    this.register({
      id: 'bookmarks',
      title: 'Bookmarks',
      icon: BookmarkIcon,
      component: BookmarksPanel,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'd', ctrlKey: true, shiftKey: true },
      lazy: false,
    });

    // History Panel
    this.register({
      id: 'history',
      title: 'History',
      icon: History,
      component: HistoryPanel,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'h', ctrlKey: true },
      lazy: false,
    });

    // Notes Panel
    this.register({
      id: 'notes',
      title: 'Notes',
      icon: FileText,
      component: WorkspacePanel,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'n', ctrlKey: true },
      lazy: false,
    });

    // Terminal Panel
    this.register({
      id: 'terminal',
      title: 'Terminal',
      icon: Terminal,
      component: Terminal,
      permissions: ['process', 'filesystem'],
      defaultLayout: 'split',
      shortcuts: { key: 't', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // AI Workspace Panel
    this.register({
      id: 'ai',
      title: 'AI',
      icon: Zap,
      component: AIWorkspacePanel,
      permissions: ['network', 'storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'a', ctrlKey: true },
      lazy: true,
    });

    // Developer Workspace
    this.register({
      id: 'developer',
      title: 'Developer',
      icon: Code,
      component: DeveloperWorkspace,
      permissions: ['filesystem', 'process', 'network'],
      defaultLayout: 'full',
      shortcuts: { key: 'd', ctrlKey: true },
      lazy: true,
    });

    // Git Panel
    this.register({
      id: 'git',
      title: 'Git',
      icon: GitBranch,
      component: GitPanel,
      permissions: ['filesystem', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'g', ctrlKey: true },
      lazy: true,
    });

    // Command Palette
    this.register({
      id: 'commands',
      title: 'Commands',
      icon: Search,
      component: CommandPalette,
      permissions: ['storage'],
      defaultLayout: 'float',
      shortcuts: { key: 'k', ctrlKey: true },
      lazy: true,
    });

    // Productivity Panel
    this.register({
      id: 'productivity',
      title: 'Productivity',
      icon: Layers,
      component: ProductivityPanel,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'p', ctrlKey: true },
      lazy: true,
    });

    // Settings Panel
    this.register({
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      component: SettingsPanel,
      permissions: ['storage'],
      defaultLayout: 'full',
      shortcuts: { key: ',', ctrlKey: true },
      lazy: true,
    });

    // AI Chat Panel
    this.register({
      id: 'ai-chat',
      title: 'AI Chat',
      icon: Zap,
      component: AIChatPanel,
      permissions: ['network', 'storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'c', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Project Explorer Panel
    this.register({
      id: 'project-explorer',
      title: 'Project Explorer',
      icon: FileText,
      component: ProjectExplorerPanel,
      permissions: ['filesystem'],
      defaultLayout: 'split',
      shortcuts: { key: 'e', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Live Preview Panel
    this.register({
      id: 'live-preview',
      title: 'Live Preview',
      icon: Globe,
      component: LivePreviewPanel,
      permissions: ['filesystem'],
      defaultLayout: 'split',
      shortcuts: { key: 'l', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Terminal Panel
    this.register({
      id: 'terminal-panel',
      title: 'Terminal',
      icon: Terminal,
      component: TerminalPanel,
      permissions: ['process', 'filesystem'],
      defaultLayout: 'split',
      shortcuts: { key: '`', ctrlKey: true },
      lazy: true,
    });

    // Notes Panel
    this.register({
      id: 'notes-panel',
      title: 'Notes',
      icon: FileText,
      component: NotesPanel,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'n', ctrlKey: true, shiftKey: true },
      lazy: true,
    });
  }

  register(entry: PanelRegistryEntry) {
    this.panels.set(entry.id, entry);
  }

  unregister(panelId: string) {
    this.panels.delete(panelId);
  }

  get(panelId: string): PanelRegistryEntry | undefined {
    return this.panels.get(panelId);
  }

  getAll(): PanelRegistryEntry[] {
    return Array.from(this.panels.values());
  }

  getByIcon(iconName: string): PanelRegistryEntry | undefined {
    return Array.from(this.panels.values()).find((p) => p.icon.name === iconName);
  }

  getAllWithPermission(permission: string): PanelRegistryEntry[] {
    return Array.from(this.panels.values()).filter(
      (p) => p.permissions && p.permissions.includes(permission)
    );
  }
}

export const panelRegistry = new PanelRegistry();
