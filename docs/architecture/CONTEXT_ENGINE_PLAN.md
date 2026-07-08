# Phase C: Context Engine Architecture Plan

**Status**: Planned (Not yet implemented)  
**Created**: July 2026  
**Purpose**: Unified workspace state service for AI agent integration

---

## Overview

The Context Engine is the central nervous system of Synapse Browser. It provides a unified, queryable view of the entire workspace—browser tabs, project files, Git state, terminal output, notes, and AI conversations—enabling AI agents to understand and act across all contexts simultaneously.

Unlike traditional browsers that isolate contexts, Synapse Browser's Context Engine allows agents to:
- Read the current webpage content
- Access project files and their contents
- Query Git status and history
- Execute terminal commands
- Search notes and conversations
- Coordinate actions across all these contexts

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    ContextEngine (Singleton)                │
│  Central service providing unified workspace state access   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬────────────┬──────────┐
        │              │              │            │          │
        ▼              ▼              ▼            ▼          ▼
   ┌────────┐   ┌──────────┐   ┌────────┐   ┌────────┐   ┌──────┐
   │Browser │   │ Project  │   │  Git   │   │Terminal│   │Notes │
   │Context │   │ Context  │   │Context │   │Context │   │Ctx   │
   │Provider│   │Provider  │   │Provider│   │Provider│   │Prov. │
   └────────┘   └──────────┘   └────────┘   └────────┘   └──────┘
        │              │              │            │          │
        └──────────────┼──────────────┴────────────┴──────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
      Event Emitter        Cache Manager
      (Real-time updates)  (Performance)
```

### Core Components

#### 1. ContextEngine Service

**Location**: `src/renderer/services/ContextEngine.ts`

**Responsibilities**:
- Aggregate context from all providers
- Manage event subscriptions
- Handle caching and invalidation
- Provide query API
- Coordinate cross-context operations

**Key Methods**:
```typescript
class ContextEngine {
  // Query methods
  getFullContext(): Promise<UnifiedContext>;
  getBrowserContext(): BrowserContext;
  getProjectContext(): ProjectContext;
  getGitContext(): GitContext;
  getTerminalContext(): TerminalContext;
  getNotesContext(): NotesContext;
  getAIContext(): AIContext;
  getWorkspaceContext(): WorkspaceContext;

  // Event subscription
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, data: any): void;

  // Cache management
  invalidateCache(context: string): void;
  clearAllCaches(): void;

  // Utility
  search(query: string): SearchResults;
  executeWorkflow(workflow: Workflow): Promise<WorkflowResult>;
}
```

#### 2. Context Providers

Each provider maintains its own state and exposes a consistent interface.

**BrowserContextProvider**:
```typescript
interface BrowserContext {
  activeTab: Tab | null;
  tabs: Tab[];
  currentUrl: string;
  currentTitle: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  history: HistoryEntry[];
  bookmarks: Bookmark[];
  favicon: string;
  pageContent?: string; // When available
}
```

**ProjectContextProvider**:
```typescript
interface ProjectContext {
  rootPath: string;
  files: FileNode[];
  currentFile: FileNode | null;
  fileContents: Map<string, string>;
  openBuffers: EditorBuffer[];
  projectConfig: ProjectConfig;
  dependencies: Dependency[];
}
```

**GitContextProvider**:
```typescript
interface GitContext {
  currentBranch: string;
  status: GitStatus;
  stagedChanges: Change[];
  unstagedChanges: Change[];
  recentCommits: Commit[];
  remotes: Remote[];
  tags: Tag[];
  isDirty: boolean;
}
```

**TerminalContextProvider**:
```typescript
interface TerminalContext {
  currentWorkingDirectory: string;
  lastCommand: string;
  lastOutput: string;
  isRunning: boolean;
  environment: Record<string, string>;
  history: CommandHistory[];
}
```

**NotesContextProvider**:
```typescript
interface NotesContext {
  notes: Note[];
  currentNote: Note | null;
  tags: string[];
  searchIndex: SearchIndex;
}
```

**AIContextProvider**:
```typescript
interface AIContext {
  availableModels: AIModel[];
  activeModel: AIModel | null;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messageHistory: Message[];
}
```

**WorkspaceContextProvider**:
```typescript
interface WorkspaceContext {
  activePanel: string;
  panelLayout: PanelLayout;
  theme: 'light' | 'dark';
  settings: WorkspaceSettings;
  recentFiles: string[];
  pinnedItems: PinnedItem[];
}
```

#### 3. Unified Context Type

```typescript
interface UnifiedContext {
  browser: BrowserContext;
  project: ProjectContext;
  git: GitContext;
  terminal: TerminalContext;
  notes: NotesContext;
  ai: AIContext;
  workspace: WorkspaceContext;
  timestamp: number;
  metadata: {
    cacheStatus: Record<string, boolean>;
    lastUpdated: Record<string, number>;
  };
}
```

#### 4. Event System

**Event Types**:
```
browser:tab-created
browser:tab-closed
browser:tab-switched
browser:navigation-complete
browser:url-changed
browser:title-changed

project:file-created
project:file-modified
project:file-deleted
project:file-opened
project:buffer-changed

git:branch-changed
git:status-changed
git:commit-created

terminal:command-executed
terminal:output-received

notes:note-created
notes:note-modified
notes:note-deleted

ai:model-changed
ai:message-sent
ai:conversation-started
```

---

## Data Flow

### Initialization Flow

```
App Start
    ↓
ContextEngine.initialize()
    ↓
├─→ BrowserContextProvider.init()
├─→ ProjectContextProvider.init()
├─→ GitContextProvider.init()
├─→ TerminalContextProvider.init()
├─→ NotesContextProvider.init()
├─→ AIContextProvider.init()
└─→ WorkspaceContextProvider.init()
    ↓
Subscribe to store changes
    ↓
Ready for queries
```

### Query Flow

```
Component requests context
    ↓
ContextEngine.getFullContext()
    ↓
Check cache validity
    ├─→ Valid: Return cached
    └─→ Invalid: Query providers
    ↓
Aggregate results
    ↓
Update cache
    ↓
Return UnifiedContext
```

### Update Flow

```
Store changes (e.g., tab added)
    ↓
Provider detects change
    ↓
Provider updates internal state
    ↓
ContextEngine emits event
    ↓
Subscribers notified
    ↓
Cache invalidated
    ↓
Components re-render
```

---

## Integration with Existing Architecture

### Store Integration

The Context Engine will read from existing Zustand stores:

| Context | Source Store | Key State |
|---------|--------------|-----------|
| Browser | `browserStore` | `tabs`, `activeTab`, `history` |
| Project | `workspaceStore` (extended) | `currentFile`, `openBuffers` |
| Git | New `gitStore` | `branch`, `status`, `commits` |
| Terminal | New `terminalStore` | `cwd`, `lastCommand`, `output` |
| Notes | `workspaceStore` | `notes`, `currentNote` |
| AI | New `aiStore` | `models`, `conversations` |
| Workspace | `workspaceStore`, `panelStore` | `theme`, `layout`, `settings` |

### Component Integration

Context Engine will be accessible via React hook:

```typescript
// In any component
const context = useContextEngine();
const browser = context.getBrowserContext();
const project = context.getProjectContext();

// Subscribe to changes
useEffect(() => {
  const handler = (tab) => console.log('Tab changed:', tab);
  context.on('browser:tab-switched', handler);
  return () => context.off('browser:tab-switched', handler);
}, [context]);
```

### Service Integration

Context Engine will coordinate with services:

```
ContextEngine
├─→ BrowserManager (IPC)
├─→ ProjectManager (File system)
├─→ GitManager (Git operations)
├─→ TerminalManager (Process execution)
└─→ AIServiceManager (Model calls)
```

---

## Caching Strategy

### Cache Levels

| Level | TTL | Invalidation |
|-------|-----|--------------|
| Browser context | 500ms | Tab change, navigation |
| Project context | 2s | File change, buffer update |
| Git context | 5s | Git operation, branch change |
| Terminal context | 1s | Command execution |
| Notes context | 10s | Note modification |
| AI context | 30s | Model change, message sent |
| Workspace context | Persistent | Settings change |

### Invalidation Triggers

- **Explicit**: `contextEngine.invalidateCache('browser')`
- **Event-based**: Store changes trigger invalidation
- **Time-based**: TTL expiration
- **Manual**: `contextEngine.clearAllCaches()`

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Providers load data on-demand
2. **Debouncing**: Rapid updates batched into single event
3. **Selective Updates**: Only changed data re-queried
4. **Memoization**: Component-level caching with `useMemo`
5. **Worker Threads**: Heavy operations (search, indexing) in workers

### Memory Management

- Cache size limits per provider
- Automatic cleanup of old entries
- Configurable retention policies
- Garbage collection hints

---

## Future AI Agent Integration

### Agent Query Examples

```typescript
// Agent: "What files have I changed?"
const changes = context.getGitContext().unstagedChanges;

// Agent: "Show me the current project structure"
const files = context.getProjectContext().files;

// Agent: "What's on the active webpage?"
const pageContent = context.getBrowserContext().pageContent;

// Agent: "Search my notes for 'API design'"
const results = context.search('API design');

// Agent: "Execute this workflow"
await context.executeWorkflow({
  name: 'refactor-component',
  steps: [
    { action: 'read-file', path: 'src/Component.tsx' },
    { action: 'call-ai', prompt: 'Refactor this component' },
    { action: 'write-file', path: 'src/Component.tsx' },
    { action: 'run-tests' },
    { action: 'git-commit', message: 'Refactor Component' }
  ]
});
```

---

## Implementation Phases

### Phase C.1: Core Engine
- Create ContextEngine service
- Implement all context providers
- Add event emitter
- Wire to existing stores

### Phase C.2: Integration
- Create React hooks
- Update components to use context
- Add cache management
- Performance optimization

### Phase C.3: Advanced Features
- Search across contexts
- Workflow execution
- Agent coordination
- Real-time synchronization

---

## File Structure

```
src/renderer/
├── services/
│   ├── ContextEngine.ts
│   ├── providers/
│   │   ├── BrowserContextProvider.ts
│   │   ├── ProjectContextProvider.ts
│   │   ├── GitContextProvider.ts
│   │   ├── TerminalContextProvider.ts
│   │   ├── NotesContextProvider.ts
│   │   ├── AIContextProvider.ts
│   │   └── WorkspaceContextProvider.ts
│   └── cache/
│       ├── CacheManager.ts
│       └── CacheEntry.ts
├── hooks/
│   └── useContextEngine.ts
└── types/
    └── context.ts

docs/
└── architecture/
    ├── CONTEXT_ENGINE_PLAN.md (this file)
    └── UI_DOCUMENTATION.md
```

---

## Success Criteria

- [x] Architecture documented
- [ ] Core service implemented
- [ ] All providers implemented
- [ ] Event system working
- [ ] React hooks created
- [ ] Components integrated
- [ ] Performance benchmarks met
- [ ] AI agent workflows functional

---

## Notes

- This is a **planned but not yet implemented** feature
- Implementation will begin when sufficient credits are available
- UI screenshots and integration points will be reviewed before coding begins
- Architecture may be refined based on UI review feedback
