import { lazy } from 'react';
import { Database } from 'lucide-react';
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
  LayoutTemplate,
  Camera,
  Bell,
  Download,
  Activity,
  TrendingUp,
  Play,
  Cpu,
  Lock,
  Clock,
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
const WorkspaceTemplateManager = lazy(() => import('../components/WorkspaceTemplateManager'));
const WorkspaceSnapshotManager = lazy(() => import('../components/WorkspaceSnapshotManager'));
const NotificationCenter = lazy(() => import('../components/NotificationCenter'));
const DownloadManager = lazy(() => import('../components/DownloadManager'));
const RecentManager = lazy(() => import('../components/RecentManager'));
const HealthDashboard = lazy(() => import('../components/HealthDashboard'));
const PluginManagerPanel = lazy(() => import('../components/PluginManagerPanel'));
const ExtensionMarketplacePanel = lazy(() => import('../components/ExtensionMarketplacePanel'));
const WorkflowManagerPanel = lazy(() => import('../components/WorkflowManagerPanel'));
const SkillManagerPanel = lazy(() => import('../components/SkillManagerPanel'));
const EventInspectorPanel = lazy(() => import('../components/EventInspectorPanel'));
const PermissionManagerPanel = lazy(() => import('../components/PermissionManagerPanel'));
const KnowledgeManagerPanel = lazy(() => import('../components/KnowledgeManagerPanel'));
const TaskQueuePanel = lazy(() => import('../components/TaskQueuePanel'));
const SearchCenterPanel = lazy(() => import('../components/SearchCenterPanel'));
const AgentMonitorPanel = lazy(() => import('../components/AgentMonitorPanel'));
const ModelSelectionPanel = lazy(() => import('../components/ModelSelectionPanel'));

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

    // Workspace Template Manager
    this.register({
      id: 'templates',
      title: 'Templates',
      icon: LayoutTemplate,
      component: WorkspaceTemplateManager,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 't', ctrlKey: true },
      lazy: true,
    });

    // Workspace Snapshot Manager
    this.register({
      id: 'snapshots',
      title: 'Snapshots',
      icon: Camera,
      component: WorkspaceSnapshotManager,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 's', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Notification Center
    this.register({
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      component: NotificationCenter,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'i', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Download Manager
    this.register({
      id: 'downloads',
      title: 'Downloads',
      icon: Download,
      component: DownloadManager,
      permissions: ['storage', 'filesystem'],
      defaultLayout: 'split',
      shortcuts: { key: 'j', ctrlKey: true },
      lazy: true,
    });

    // Recent Items Manager
    this.register({
      id: 'recent',
      title: 'Recent',
      icon: History,
      component: RecentManager,
      permissions: ['storage', 'filesystem'],
      defaultLayout: 'split',
      shortcuts: { key: 'r', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Health Dashboard
    this.register({
      id: 'health',
      title: 'Health',
      icon: Activity,
      component: HealthDashboard,
      permissions: ['storage', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'h', ctrlKey: true, shiftKey: true },
      lazy: true,
    });
    
    // Plugin Manager Panel
    this.register({
      id: 'plugins',
      title: 'Plugins',
      icon: Zap,
      component: PluginManagerPanel,
      permissions: ['storage', 'filesystem'],
      defaultLayout: 'split',
      shortcuts: { key: 'u', ctrlKey: true, shiftKey: true },
      lazy: true,
    });
    
    // Extension Marketplace Panel
    this.register({
      id: 'marketplace',
      title: 'Marketplace',
      icon: TrendingUp,
      component: ExtensionMarketplacePanel,
      permissions: ['network', 'storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'm', ctrlKey: true, shiftKey: true },
      lazy: true,
    });
    
    // Workflow Manager Panel
    this.register({
      id: 'workflows',
      title: 'Workflows',
      icon: Play,
      component: WorkflowManagerPanel,
      permissions: ['storage', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'w', ctrlKey: true, shiftKey: true },
      lazy: true,
    });
    
    // Skill Manager Panel
    this.register({
      id: 'skills',
      title: 'Skills',
      icon: Cpu,
      component: SkillManagerPanel,
      permissions: ['storage', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'k', ctrlKey: true, shiftKey: true },
      lazy: true,
    });
    
    // Event Inspector Panel
    this.register({
      id: 'events',
      title: 'Events',
      icon: Activity,
      component: EventInspectorPanel,
      permissions: ['storage', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'e', ctrlKey: true, shiftKey: true },
      lazy: true,
    });
    
    // Permission Manager Panel
    this.register({
      id: 'permissions',
      title: 'Permissions',
      icon: Lock,
      component: PermissionManagerPanel,
      permissions: ['storage', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'p', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Knowledge Manager Panel
    this.register({
      id: 'knowledge',
      title: 'Knowledge',
      icon: Database,
      component: KnowledgeManagerPanel,
      permissions: ['storage', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'k', ctrlKey: true, altKey: true },
      lazy: true,
    });

    // Task Queue Panel
    this.register({
      id: 'task-queue',
      title: 'Task Queue',
      icon: Clock,
      component: TaskQueuePanel,
      permissions: ['storage', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'q', ctrlKey: true, altKey: true },
      lazy: true,
    });

    // Search Center Panel
    this.register({
      id: 'search',
      title: 'Search',
      icon: Search,
      component: SearchCenterPanel,
      permissions: ['storage'],
      defaultLayout: 'split',
      shortcuts: { key: 'f', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Agent Monitor Panel
    this.register({
      id: 'agents',
      title: 'Agents',
      icon: Activity,
      component: AgentMonitorPanel,
      permissions: ['storage', 'process'],
      defaultLayout: 'split',
      shortcuts: { key: 'o', ctrlKey: true, shiftKey: true },
      lazy: true,
    });

    // Model Selection Panel
    this.register({
      id: 'models',
      title: 'AI Models',
      icon: Cpu,
      component: ModelSelectionPanel,
      permissions: ['storage', 'network'],
      defaultLayout: 'split',
      shortcuts: { key: 'm', ctrlKey: true, altKey: true },
      lazy: true,
    });
  }

  register(entry: PanelRegistryEntry) {
    this.panels.set(entry.id, entry);
    // Notify main process or other listeners if needed
    window.dispatchEvent(new CustomEvent('panel-registered', { detail: entry }));
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
