# Synapse Browser: Unified Search & Command Center Design

## 1. Introduction

This document outlines the design for the Unified Search & Command Center within the Synapse Browser. The goal is to provide a centralized, fast, and extensible search experience across various application components, enabling users to quickly find information and execute actions. The design emphasizes a pluggable architecture to allow future systems to easily integrate their searchable content.

## 2. SearchEngine Core Design

The `SearchEngine` will be a core service residing in the Electron main process, responsible for managing search providers, indexing data, processing queries, and returning ranked results. It will communicate with the renderer process via IPC (Inter-Process Communication) for search requests and result delivery.

### 2.1 Core Functionalities

*   **Indexing**: Collects and stores searchable data from registered providers. This will involve both initial full indexing and real-time incremental updates.
*   **Query Processing**: Handles user search queries, including fuzzy matching and tokenization.
*   **Ranking**: Orders search results based on relevance, recency, and user interaction patterns.
*   **Filtering**: Allows users to narrow down results by category (e.g., 'Tabs', 'Notes', 'Workflows').
*   **Instant Results**: Provides immediate feedback as the user types, updating results in real-time.
*   **Quick Actions**: Enables direct execution of actions from search results (e.g., 
open tab").

### 2.2 Data Structures

*   **`SearchResult`**: A standardized interface for search results, including `id`, `title`, `description`, `category`, `icon`, `url` (optional), and `action` (optional, for quick actions).
*   **`SearchQuery`**: Defines the user's search input, including `text`, `filters`, and `limit`.
*   **`SearchProvider`**: An interface that all pluggable search providers must implement.

## 3. Pluggable Search Provider Architecture

The system will support a pluggable architecture for search providers. Each provider will be responsible for indexing its specific data type and returning `SearchResult` objects. This allows for easy extension and integration of new searchable content without modifying the core `SearchEngine`.

### 3.1 `SearchProvider` Interface

```typescript
interface SearchProvider {
  id: string;
  name: string;
  /**
   * Indexes all searchable content for this provider.
   * Can be called periodically or on demand.
   */
  index(): Promise<void>;
  /**
   * Searches the provider's indexed content based on the query.
   * @param query The search query.
   * @returns A promise resolving to an array of SearchResult.
   */
  search(query: SearchQuery): Promise<SearchResult[]>;
  /**
   * Optional: Provides quick actions for a given search result.
   * @param result The search result.
   * @returns An array of QuickAction objects.
   */
  getQuickActions?(result: SearchResult): QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  handler: (result: SearchResult) => void;
}
```

### 3.2 Registration of Search Providers

Search providers will register themselves with the `SearchEngine` during application startup or when a plugin/extension is loaded. The `SearchEngine` will maintain a registry of all active providers.

## 4. Integration Plan

### 4.1 Electron Main Process

*   **`SearchEngine.ts`**: New service in `src/main` to manage providers, indexing, and search logic.
*   **`background.ts`**: IPC handlers for `search:query`, `search:register-provider`, `search:unregister-provider`, `search:get-indexing-status`, `search:get-stats`.
*   **Existing Managers**: Each relevant manager (e.g., `BrowserManager`, `ProjectManager`, `MemoryManager`, `PluginManager`, `WorkflowManager`, `SkillRegistry`, `DownloadManager`, `NotificationService`, `ExtensionRepositoryService`, `TabGroupManager`, `PanelManager`, `SessionManager`) will implement a `SearchProvider` interface and register itself with the `SearchEngine`.

### 4.2 Electron Renderer Process

*   **`SearchCenterPanel.tsx`**: New React component in `src/renderer/components` for the dedicated search interface.
*   **`useSearch.ts`**: New React hook for interacting with the `SearchEngine` via IPC.
*   **`CommandPalette.tsx`**: Modify to integrate with the new `SearchEngine` for global search (Ctrl/Cmd + Shift + F).
*   **`Sidebar.tsx`**: Add an entry for the Search Center panel.
*   **`PanelRegistry.ts`**: Register the `SearchCenterPanel`.

### 4.3 Indexing Strategy

*   **Initial Indexing**: Each provider will perform a full index on registration or application startup.
*   **Incremental Indexing**: Providers will listen to relevant events (e.g., `EventBus` events for new tabs, saved notes, completed downloads) to update their index incrementally.

### 4.4 Fuzzy Search and Highlighting

*   **Fuzzy Search**: A library like `fuse.js` or a custom implementation will be used for fuzzy matching within the `SearchEngine`.
*   **Highlighting**: The `SearchEngine` will return information about matching text ranges, which the UI will use to highlight results.

## 5. UI Design

### 5.1 Dedicated Search Center Panel

*   A full-height, resizable panel accessible from the sidebar.
*   Input field for search queries.
*   Category filters (e.g., Tabs, Notes, Workspaces).
*   List of search results with icons, titles, descriptions, and quick action buttons.
*   Live indexing status and search statistics (e.g., 
number of indexed items, last updated).
*   Recent searches and search history.

### 5.2 Global Search (Ctrl/Cmd + Shift + F)

*   A modal overlay that appears on top of the current view.
*   Minimalistic design focused on the search input and instant results.
*   Keyboard navigation for selecting results and triggering quick actions.

## 6. Integration Details

### 6.1 Browser Tabs

*   **Provider**: `BrowserTabSearchProvider`
*   **Data Source**: `BrowserManager.getAllTabs()`
*   **Index Fields**: Tab title, URL.
*   **Quick Actions**: Switch to tab, close tab.
*   **Events**: Listen to `tab:created`, `tab:updated`, `tab:closed` from `EventBus`.

### 6.2 Notes

*   **Provider**: `NoteSearchProvider`
*   **Data Source**: `useWorkspaceStore().notes` (via IPC to main process)
*   **Index Fields**: Note title, content.
*   **Quick Actions**: Open note, edit note.
*   **Events**: Listen to `note:created`, `note:updated`, `note:deleted` from `EventBus`.

### 6.3 Workspaces, Workspace Templates, Workspace Snapshots

*   **Provider**: `WorkspaceSearchProvider`
*   **Data Source**: `PanelManager.getAllLayouts()`, `WorkspaceSnapshotManager` (if available)
*   **Index Fields**: Name, description.
*   **Quick Actions**: Load workspace, apply template, restore snapshot.
*   **Events**: Listen to `workspace:created`, `workspace:updated`, `workspace:deleted` from `EventBus`.

### 6.4 Recent Files & Projects

*   **Provider**: `FileProjectSearchProvider`
*   **Data Source**: `ProjectManager.getAllProjects()`, recent file history (from `Storage` or `ProjectManager`)
*   **Index Fields**: Project name, file name, file path.
*   **Quick Actions**: Open project, open file.
*   **Events**: Listen to `project:created`, `project:opened`, `file:opened`, `file:saved` from `EventBus`.

### 6.5 Downloads

*   **Provider**: `DownloadSearchProvider`
*   **Data Source**: `DownloadManager.getAllDownloads()`
*   **Index Fields**: Filename, URL.
*   **Quick Actions**: Open file, open folder, retry download.
*   **Events**: Listen to `download:completed`, `download:failed` from `EventBus`.

### 6.6 Notifications

*   **Provider**: `NotificationSearchProvider`
*   **Data Source**: `NotificationService.getAllNotifications()` (via IPC)
*   **Index Fields**: Notification title, message.
*   **Quick Actions**: Dismiss notification, view details.
*   **Events**: Listen to `notification:new` from `EventBus`.

### 6.7 Installed Plugins

*   **Provider**: `PluginSearchProvider`
*   **Data Source**: `PluginManager.getAllPlugins()`
*   **Index Fields**: Plugin name, description, author.
*   **Quick Actions**: Enable/disable plugin, open settings.
*   **Events**: Listen to `plugin:installed`, `plugin:uninstalled`, `plugin:enabled`, `plugin:disabled` from `EventBus`.

### 6.8 Marketplace Extensions

*   **Provider**: `ExtensionSearchProvider`
*   **Data Source**: `ExtensionRepositoryService.getAllExtensions()`
*   **Index Fields**: Extension name, description, author, category.
*   **Quick Actions**: Install extension, view details.
*   **Events**: Listen to `extension:new`, `extension:updated` from `EventBus`.

### 6.9 Workflows

*   **Provider**: `WorkflowSearchProvider`
*   **Data Source**: `WorkflowManager.getAllWorkflows()`
*   **Index Fields**: Workflow name, description.
*   **Quick Actions**: Run workflow, edit workflow.
*   **Events**: Listen to `workflow:created`, `workflow:updated`, `workflow:deleted` from `EventBus`.

### 6.10 Skills

*   **Provider**: `SkillSearchProvider`
*   **Data Source**: `SkillRegistry.getAllSkills()`
*   **Index Fields**: Skill name, description, category.
*   **Quick Actions**: Execute skill, view skill details.
*   **Events**: Listen to `skill:registered`, `skill:unregistered` from `EventBus`.

### 6.11 Memories

*   **Provider**: `MemorySearchProvider`
*   **Data Source**: `MemoryManager.getAllMemories()`
*   **Index Fields**: Memory content, tags.
*   **Quick Actions**: View memory, pin memory.
*   **Events**: Listen to `memory:added`, `memory:updated`, `memory:deleted` from `EventBus`.

## 7. Quality Assurance

*   **TypeScript**: All new code will be written in TypeScript with strict type checking.
*   **Linting**: Adherence to existing linting rules (`eslint`).
*   **Build**: Ensure successful compilation and packaging with `electron.vite.config.ts`.
*   **Testing**: Unit tests for `SearchEngine` core and individual providers. Integration tests for UI components and end-to-end search flows.

## 8. Commit and Push Strategy

*   The implementation will be fully completed and verified locally before any commits or pushes to the repository.
*   A single, comprehensive commit will be made with a clear commit message summarizing the feature. 

## References

[1] Synapse Browser ARCHITECTURE.md (file://synapse-browser/ARCHITECTURE.md)
[2] Synapse Browser src/main/EventBus.ts (file://synapse-browser/src/main/EventBus.ts)
[3] Synapse Browser src/main/PluginManager.ts (file://synapse-browser/src/main/PluginManager.ts)
[4] Synapse Browser src/main/SkillRegistry.ts (file://synapse-browser/src/main/SkillRegistry.ts)
[5] Synapse Browser src/main/WorkflowManager.ts (file://synapse-browser/src/main/WorkflowManager.ts)
[6] Synapse Browser src/main/MemoryManager.ts (file://synapse-browser/src/main/MemoryManager.ts)
[7] Synapse Browser src/main/TaskQueueManager.ts (file://synapse-browser/src/main/TaskQueueManager.ts)
[8] Synapse Browser src/main/NotificationService.ts (file://synapse-browser/src/main/NotificationService.ts)
[9] Synapse Browser src/main/ExtensionRepositoryService.ts (file://synapse-browser/src/main/ExtensionRepositoryService.ts)
[10] Synapse Browser src/main/ProjectManager.ts (file://synapse-browser/src/main/ProjectManager.ts)
[11] Synapse Browser src/main/DownloadManager.ts (file://synapse-browser/src/main/DownloadManager.ts)
[12] Synapse Browser src/main/TabGroupManager.ts (file://synapse-browser/src/main/TabGroupManager.ts)
[13] Synapse Browser src/main/PanelManager.ts (file://synapse-browser/src/main/PanelManager.ts)
[14] Synapse Browser src/main/SessionManager.ts (file://synapse-browser/src/main/SessionManager.ts)
[15] Synapse Browser src/renderer/store/browserStore.ts (file://synapse-browser/src/renderer/store/browserStore.ts)
[16] Synapse Browser src/renderer/store/workspaceStore.ts (file://synapse-browser/src/renderer/store/workspaceStore.ts)
[17] Synapse Browser src/renderer/components/CommandPalette.tsx (file://synapse-browser/src/renderer/components/CommandPalette.tsx)
[18] Synapse Browser src/renderer/hooks/useKeyboardShortcuts.ts (file://synapse-browser/src/renderer/hooks/useKeyboardShortcuts.ts)
[19] Synapse Browser src/renderer/registry/PanelRegistry.ts (file://synapse-browser/src/renderer/registry/PanelRegistry.ts)
