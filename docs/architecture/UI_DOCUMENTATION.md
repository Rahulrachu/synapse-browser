# Synapse Browser: UI Architecture & Component Documentation

**Current Status**: Phase B Complete (Integration Architecture)  
**Last Updated**: July 2026  
**Purpose**: Comprehensive documentation of current UI structure, data flow, and integration points for Phase C (Context Engine)

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Current Application Layout](#current-application-layout)
4. [Navigation Flow](#navigation-flow)
5. [Panel Architecture](#panel-architecture)
6. [Store Architecture & Data Flow](#store-architecture--data-flow)
7. [Theme & Styling System](#theme--styling-system)
8. [UI Entry Points](#ui-entry-points)
9. [Future Context Engine Integration Points](#future-context-engine-integration-points)

---

## Application Overview

### Purpose
Synapse Browser is an AI-first productivity browser that integrates web browsing, code editing, Git management, AI assistance, and note-taking into a unified workspace.

### Key Features (Current)
- Multi-tab browser with session management
- Workspace with notes and productivity tools
- Settings and theme management
- Panel-based layout system
- Extensible panel registry

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand (persistent)
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React icons
- **Build**: Vite + TypeScript
- **Desktop**: Electron 43
- **IPC**: Electron IPC (main ↔ renderer)

---

## Component Hierarchy

### Root Component Tree

```
App.tsx (Root)
├── FadeIn (Animation wrapper)
│   └── div.h-screen (Main container)
│       ├── Sidebar (Left navigation)
│       │   ├── Logo (S badge)
│       │   ├── nav (Menu items from PanelRegistry)
│       │   │   └── button × 12 (Panel buttons)
│       │   └── Settings & Theme controls
│       │
│       └── div.flex-1 (Main content area)
│           ├── header (Title bar)
│           │   ├── h1 "Synapse Browser"
│           │   └── Layout buttons (2/3/4-panel)
│           │
│           └── MultiPanelLayout
│               └── ResizablePanel × N
│                   └── PanelRouter
│                       └── Dynamic Component
│                           ├── BrowserPanel
│                           ├── WorkspacePanel (Notes)
│                           ├── AIWorkspacePanel
│                           ├── DeveloperWorkspace
│                           ├── SettingsPanel
│                           │   └── AboutDialog (Modal)
│                           ├── ProductivityPanel
│                           ├── CommandPalette
│                           ├── Terminal
│                           ├── GitPanel
│                           ├── BookmarksPanel
│                           ├── HistoryPanel
│                           └── FileExplorer
```

### Component Inventory

| Component | Location | Purpose | State |
|-----------|----------|---------|-------|
| **App** | `src/renderer/App.tsx` | Root component, layout orchestration | Keyboard shortcuts, panel layout |
| **Sidebar** | `src/renderer/components/Sidebar.tsx` | Left navigation panel | Active panel, theme toggle |
| **MultiPanelLayout** | `src/renderer/components/MultiPanelLayout.tsx` | Panel grid manager | Panel sizes, layout config |
| **ResizablePanel** | `src/renderer/components/ResizablePanel.tsx` | Draggable panel divider | Panel dimensions |
| **PanelRouter** | `src/renderer/components/PanelRouter.tsx` | Dynamic panel renderer | Panel ID, lazy loading |
| **BrowserPanel** | `src/renderer/components/BrowserPanel.tsx` | Web browser UI | Active tab, URL, loading state |
| **WorkspacePanel** | `src/renderer/components/WorkspacePanel.tsx` | Notes & workspace | Notes list, current note |
| **SettingsPanel** | `src/renderer/components/SettingsPanel.tsx` | Application settings | Theme, language, About dialog |
| **AboutDialog** | `src/renderer/components/AboutDialog.tsx` | About modal | Dialog open/close state |
| **AIWorkspacePanel** | `src/renderer/components/AIWorkspacePanel.tsx` | AI chat interface | Messages, input |
| **DeveloperWorkspace** | `src/renderer/components/DeveloperWorkspace.tsx` | Code editor + file explorer | Selected file |
| **ProductivityPanel** | `src/renderer/components/ProductivityPanel.tsx` | Todo list | Todos, input |
| **CommandPalette** | `src/renderer/components/CommandPalette.tsx` | Command search | Search query, filtered results |
| **Terminal** | `src/renderer/components/Terminal.tsx` | Terminal emulator | Command history, output |
| **GitPanel** | `src/renderer/components/GitPanel.tsx` | Git status viewer | Branch, status, commits |
| **BookmarksPanel** | `src/renderer/components/BookmarksPanel.tsx` | Bookmarks manager | Bookmarks list |
| **HistoryPanel** | `src/renderer/components/HistoryPanel.tsx` | Browser history | History entries |
| **FileExplorer** | `src/renderer/components/FileExplorer.tsx` | Project file tree | File tree, selected file |
| **FadeIn** | `src/renderer/components/FadeIn.tsx` | Fade-in animation | Animation state |
| **LoadingAnimation** | `src/renderer/components/LoadingAnimation.tsx` | Loading spinner | Animation |
| **SlideIn** | `src/renderer/components/SlideIn.tsx` | Slide-in animation | Animation state |

---

## Current Application Layout

### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Synapse Browser                          │
│  [2-Panel] [3-Panel] [4-Panel]                              │
├──┬───────────────────────────────────────────────────────────┤
│  │                                                            │
│  │  ┌──────────────────┬──────────────────┐                  │
│  │  │                  │                  │                  │
│  │  │   Panel 1        │   Panel 2        │                  │
│  │  │   (Browser)      │   (Notes)        │                  │
│  │  │                  │                  │                  │
│  │  │                  │                  │                  │
│  │  │                  │                  │                  │
│  │  │                  │                  │                  │
│  │  └──────────────────┴──────────────────┘                  │
│  │                                                            │
│S │                                                            │
│i │  (Resizable dividers between panels)                      │
│d │                                                            │
│e │  Panel layout can be 2, 3, or 4 panels                    │
│b │  Each panel independently scrollable                      │
│a │  Panels can be any registered component                   │
│r │                                                            │
│  │                                                            │
└──┴───────────────────────────────────────────────────────────┘

Sidebar (Left):
- Logo (S badge)
- 12 menu items (one per registered panel)
- Theme toggle (☀️/🌙)
- Settings button
```

### Responsive Behavior

| Breakpoint | Layout | Behavior |
|-----------|--------|----------|
| < 1024px | 2-panel | Sidebar collapses to icons only |
| 1024-1440px | 2-3 panel | Full sidebar visible |
| > 1440px | 2-4 panel | All layout options available |

### Color Scheme

**Dark Mode** (Default):
- Background: `#1a1a1a` (synapse-darker)
- Secondary: `#2d2d2d` (gray-800)
- Accent: `#7c3aed` (synapse-accent - purple)
- Text: `#ffffff` (white)
- Muted: `#9ca3af` (gray-400)

**Light Mode**:
- Background: `#ffffff` (white)
- Secondary: `#f3f4f6` (gray-100)
- Accent: `#7c3aed` (synapse-accent - purple)
- Text: `#111827` (gray-900)
- Muted: `#6b7280` (gray-500)

---

## Navigation Flow

### User Navigation Paths

```
User clicks Sidebar button
    ↓
Sidebar onClick handler
    ↓
usePanelStore.setActivePanel(panelId, slot)
    ↓
panelStore updates state
    ↓
MultiPanelLayout re-renders
    ↓
PanelRouter receives new panelId
    ↓
Dynamic import of panel component
    ↓
Suspense boundary shows loading
    ↓
Panel component renders
```

### Panel Switching

```
Current: Browser panel active
User clicks: Notes in sidebar
    ↓
setActivePanel('notes', 'left')
    ↓
panelStore.activePanel = 'notes'
panelStore.splitPanels.left = 'notes'
    ↓
MultiPanelLayout detects state change
    ↓
PanelRouter receives 'notes'
    ↓
WorkspacePanel component mounts
    ↓
Notes content displays
```

### Multi-Panel Layout

```
2-Panel Mode:
Left panel: Active panel (from sidebar)
Right panel: Secondary panel (if set)

3-Panel Mode:
Left panel: Active panel
Right panel: Secondary panel
Top panel: Tertiary panel

4-Panel Mode:
Left panel: Active panel
Right panel: Secondary panel
Top panel: Tertiary panel
Bottom panel: Quaternary panel
```

---

## Panel Architecture

### Panel Registry System

**Location**: `src/renderer/registry/PanelRegistry.ts`

**Registered Panels** (12 total):

| ID | Title | Icon | Component | Lazy | Permissions |
|----|-------|------|-----------|------|-------------|
| browser | Browser | Globe | BrowserPanel | No | network, storage |
| bookmarks | Bookmarks | BookmarkIcon | BookmarksPanel | No | storage |
| history | History | History | HistoryPanel | No | storage |
| notes | Notes | FileText | WorkspacePanel | No | storage |
| terminal | Terminal | Terminal | Terminal | Yes | process, filesystem |
| ai | AI | Zap | AIWorkspacePanel | Yes | network, storage |
| developer | Developer | Code | DeveloperWorkspace | Yes | filesystem, process, network |
| git | Git | GitBranch | GitPanel | Yes | filesystem, process |
| commands | Commands | Search | CommandPalette | Yes | storage |
| productivity | Productivity | Layers | ProductivityPanel | Yes | storage |
| settings | Settings | Settings | SettingsPanel | Yes | storage |

### Panel State Management

**Store**: `src/renderer/store/panelStore.ts` (Zustand)

**State Structure**:
```typescript
{
  activePanel: string | null;           // Currently active panel
  panelHistory: string[];               // Recent panels (for back/forward)
  splitPanels: {
    left: string | null;                // Left panel ID
    right: string | null;               // Right panel ID
    top?: string | null;                // Top panel ID (3/4-panel mode)
    bottom?: string | null;             // Bottom panel ID (4-panel mode)
  };
  panelData: Record<string, any>;       // Per-panel custom data
}
```

**Persistence**: localStorage (key: `panel-store`)

### Panel Lifecycle

```
Panel Registration (at startup)
    ↓
Panel in registry
    ↓
User clicks sidebar button
    ↓
setActivePanel() called
    ↓
panelStore updates
    ↓
PanelRouter detects change
    ↓
Suspense boundary shows loading (if lazy)
    ↓
Panel component mounts
    ↓
useEffect hooks run
    ↓
Panel renders
    ↓
User switches to different panel
    ↓
Panel unmounts
    ↓
State preserved in panelStore.panelData
    ↓
User returns to panel
    ↓
Panel remounts with previous state
```

---

## Store Architecture & Data Flow

### Current Stores

#### 1. BrowserStore (`src/renderer/store/browserStore.ts`)

**Purpose**: Manage browser tabs and navigation state

**State**:
```typescript
{
  tabs: Tab[];
  activeTabId: string | null;
  history: HistoryEntry[];
  bookmarks: Bookmark[];
  tabGroups: TabGroup[];
  sessions: BrowserSession[];
}
```

**Key Methods**:
- `addTab()` - Create new tab
- `closeTab()` - Close tab
- `setActiveTab()` - Switch active tab
- `navigate()` - Navigate to URL
- `goBack()` / `goForward()` - History navigation
- `saveSession()` - Persist session
- `restoreSession()` - Load session

**Persistence**: localStorage (key: `browser-store`)

**IPC Integration**:
- Sends tab changes to main process
- Receives navigation state updates
- Coordinates with BrowserManager

#### 2. WorkspaceStore (`src/renderer/store/workspaceStore.ts`)

**Purpose**: Manage workspace-level state (notes, settings, theme)

**State**:
```typescript
{
  isDarkMode: boolean;
  notes: Note[];
  currentNoteId: string | null;
  settings: WorkspaceSettings;
  recentFiles: string[];
  pinnedItems: PinnedItem[];
}
```

**Key Methods**:
- `toggleDarkMode()` - Switch theme
- `addNote()` - Create note
- `updateNote()` - Edit note
- `deleteNote()` - Remove note
- `updateSettings()` - Change settings

**Persistence**: localStorage (key: `workspace-store`)

#### 3. PanelStore (`src/renderer/store/panelStore.ts`)

**Purpose**: Manage panel layout and navigation

**State**:
```typescript
{
  activePanel: string | null;
  panelHistory: string[];
  splitPanels: { left, right, top?, bottom? };
  panelData: Record<string, any>;
}
```

**Key Methods**:
- `setActivePanel()` - Switch panel
- `closePanel()` - Hide panel
- `updatePanelData()` - Store panel-specific data
- `setPanelLayout()` - Change layout mode
- `restorePanelState()` - Load saved layout

**Persistence**: localStorage (key: `panel-store`)

### Data Flow Diagram

```
User Action (e.g., click tab)
    ↓
Component event handler
    ↓
Store method called (e.g., setActiveTab)
    ↓
Store updates state
    ↓
Zustand subscribers notified
    ↓
Components using selector re-render
    ↓
UI updates
    ↓
(Optional) IPC to main process
    ↓
Main process updates browser view
```

### Store Integration Points

```
App.tsx
├─→ useWorkspaceStore (theme, notes)
├─→ useBrowserStore (tabs, navigation)
├─→ useKeyboardShortcuts (keyboard events)
│
Sidebar.tsx
├─→ usePanelStore (active panel)
├─→ useWorkspaceStore (theme)
│
MultiPanelLayout.tsx
├─→ usePanelStore (split panels, sizes)
│
PanelRouter.tsx
├─→ useWorkspaceStore (theme)
│
BrowserPanel.tsx
├─→ useBrowserStore (tabs, active tab)
├─→ useWorkspaceStore (theme)
│
WorkspacePanel.tsx
├─→ useWorkspaceStore (notes, theme)
│
SettingsPanel.tsx
├─→ useWorkspaceStore (theme, settings)
│
(All panels)
├─→ useWorkspaceStore (theme)
└─→ usePanelStore (panel data)
```

---

## Theme & Styling System

### Tailwind Configuration

**Location**: `tailwind.config.js`

**Custom Colors**:
```javascript
colors: {
  'synapse-darker': '#1a1a1a',
  'synapse-dark': '#2d2d2d',
  'synapse-accent': '#7c3aed',
  'synapse-accent-light': '#a78bfa',
}
```

**Utilities**:
- Dark mode toggle via `isDarkMode` state
- Conditional classes: `` `${isDarkMode ? 'bg-synapse-darker' : 'bg-white'}` ``
- Consistent spacing: `p-4`, `gap-2`, etc.
- Responsive design: `md:`, `lg:`, `xl:` prefixes

### Component Styling Patterns

**Pattern 1: Theme-Aware Container**
```tsx
<div className={`${isDarkMode ? 'bg-synapse-darker text-white' : 'bg-white text-gray-900'}`}>
```

**Pattern 2: Hover States**
```tsx
<button className={`hover:bg-synapse-accent hover:text-white transition`}>
```

**Pattern 3: Border Colors**
```tsx
<div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
```

**Pattern 4: Active States**
```tsx
className={`${activePanel === id ? 'bg-synapse-accent text-white' : 'hover:bg-synapse-accent'}`}
```

### Animation Classes

- `animate-in fade-in` - Fade in animation
- `animate-spin` - Loading spinner
- `transition` - Smooth transitions
- `duration-200` - Animation duration

---

## UI Entry Points

### Main Entry Point

**File**: `src/renderer/main.tsx`

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Component Entry Points

| Entry Point | Component | Triggered By |
|-------------|-----------|--------------|
| App root | `App.tsx` | Application start |
| Sidebar navigation | `Sidebar.tsx` | User clicks menu item |
| Panel rendering | `PanelRouter.tsx` | Panel state change |
| Settings dialog | `AboutDialog.tsx` | User clicks "About" |
| Theme toggle | `Sidebar.tsx` | User clicks theme button |
| Keyboard shortcuts | `useKeyboardShortcuts` | Keyboard press |

### IPC Entry Points

| IPC Event | Direction | Handler | Purpose |
|-----------|-----------|---------|---------|
| `create-tab` | Renderer → Main | `background.ts` | Create new browser tab |
| `close-tab` | Renderer → Main | `background.ts` | Close browser tab |
| `navigate` | Renderer → Main | `background.ts` | Navigate to URL |
| `resize-browser-area` | Renderer → Main | `background.ts` | Resize WebContentsView |
| `get-tab-state` | Renderer → Main | `background.ts` | Fetch tab state |
| `save-session` | Renderer → Main | `background.ts` | Persist session |

---

## Future Context Engine Integration Points

### Phase C Integration Checklist

This section identifies every component, store, and service that will interact with the Context Engine once it's implemented.

#### 1. Store Integration Points

**BrowserStore** (`src/renderer/store/browserStore.ts`)
- **Integration**: Context Engine will read `tabs`, `activeTabId`, `history`, `bookmarks`
- **Changes Needed**: 
  - Add method to expose current tab content
  - Emit events for tab changes
  - Integrate with BrowserContextProvider
- **Impact**: Medium (read-only initially)

**WorkspaceStore** (`src/renderer/store/workspaceStore.ts`)
- **Integration**: Context Engine will read `notes`, `settings`, `isDarkMode`
- **Changes Needed**:
  - Add method to search notes
  - Emit events for note changes
  - Integrate with NotesContextProvider
- **Impact**: Medium (read-only initially)

**PanelStore** (`src/renderer/store/panelStore.ts`)
- **Integration**: Context Engine will read `activePanel`, `splitPanels`, `panelData`
- **Changes Needed**:
  - Add method to get all panel states
  - Emit events for layout changes
  - Integrate with WorkspaceContextProvider
- **Impact**: Low (read-only)

**New Stores to Create**:
- `gitStore` - Git status and history
- `terminalStore` - Terminal state and output
- `aiStore` - AI models and conversations

#### 2. Component Integration Points

**BrowserPanel** (`src/renderer/components/BrowserPanel.tsx`)
- **Current State**: Manages tab UI, navigation buttons
- **Context Engine Integration**:
  - Query `BrowserContext.currentUrl`, `currentTitle`, `isLoading`
  - Subscribe to `browser:tab-switched` events
  - Provide page content to context engine
- **Changes Needed**: Add `useContextEngine` hook, query browser context
- **Impact**: Medium (read from context)

**WorkspacePanel** (`src/renderer/components/WorkspacePanel.tsx`)
- **Current State**: Manages notes list and editor
- **Context Engine Integration**:
  - Query `NotesContext.notes`, `currentNote`
  - Subscribe to `notes:note-modified` events
  - Provide note content to context engine
- **Changes Needed**: Add `useContextEngine` hook, query notes context
- **Impact**: Medium (read from context)

**SettingsPanel** (`src/renderer/components/SettingsPanel.tsx`)
- **Current State**: Manages theme and language settings
- **Context Engine Integration**:
  - Query `WorkspaceContext.theme`, `settings`
  - Subscribe to `workspace:settings-changed` events
- **Changes Needed**: Minimal (mostly read-only)
- **Impact**: Low

**DeveloperWorkspace** (`src/renderer/components/DeveloperWorkspace.tsx`)
- **Current State**: File explorer placeholder
- **Context Engine Integration**:
  - Query `ProjectContext.files`, `currentFile`, `fileContents`
  - Subscribe to `project:file-changed` events
  - Provide open buffers to context engine
- **Changes Needed**: Implement file explorer, wire to ProjectContextProvider
- **Impact**: High (new functionality)

**AIWorkspacePanel** (`src/renderer/components/AIWorkspacePanel.tsx`)
- **Current State**: Chat interface placeholder
- **Context Engine Integration**:
  - Query `AIContext.availableModels`, `conversations`, `messageHistory`
  - Subscribe to `ai:message-sent` events
  - Provide conversation history to context engine
- **Changes Needed**: Implement AI service integration, wire to AIContextProvider
- **Impact**: High (new functionality)

**Terminal** (`src/renderer/components/Terminal.tsx`)
- **Current State**: Terminal placeholder
- **Context Engine Integration**:
  - Query `TerminalContext.currentWorkingDirectory`, `lastCommand`, `lastOutput`
  - Subscribe to `terminal:command-executed` events
  - Provide command output to context engine
- **Changes Needed**: Implement terminal emulation, wire to TerminalContextProvider
- **Impact**: High (new functionality)

**GitPanel** (`src/renderer/components/GitPanel.tsx`)
- **Current State**: Git status viewer
- **Context Engine Integration**:
  - Query `GitContext.currentBranch`, `status`, `stagedChanges`, `recentCommits`
  - Subscribe to `git:status-changed` events
  - Provide Git operations to context engine
- **Changes Needed**: Wire to GitContextProvider, implement Git operations
- **Impact**: High (new functionality)

**CommandPalette** (`src/renderer/components/CommandPalette.tsx`)
- **Current State**: Command search interface
- **Context Engine Integration**:
  - Use `context.search()` for global search
  - Query all contexts for searchable items
  - Execute workflows via `context.executeWorkflow()`
- **Changes Needed**: Implement search across all contexts
- **Impact**: High (new functionality)

**PanelRouter** (`src/renderer/components/PanelRouter.tsx`)
- **Current State**: Dynamic panel renderer
- **Context Engine Integration**:
  - Provide context to all rendered panels
  - No direct integration needed
- **Changes Needed**: Wrap panels with Context Provider
- **Impact**: Low (infrastructure)

**Sidebar** (`src/renderer/components/Sidebar.tsx`)
- **Current State**: Navigation menu
- **Context Engine Integration**:
  - Query `WorkspaceContext.activePanel`
  - Minimal integration needed
- **Changes Needed**: None (already uses PanelStore)
- **Impact**: None

#### 3. Service Integration Points

**BrowserManager** (`src/main/BrowserManager.ts`)
- **Current Role**: Manages Electron WebContentsView instances
- **Context Engine Integration**:
  - Provide tab state to BrowserContextProvider
  - Emit IPC events for tab changes
  - Handle page content extraction
- **Changes Needed**: Add methods to expose tab metadata and content
- **Impact**: Medium (new IPC handlers)

**ProjectManager** (`src/main/ProjectManager.ts`)
- **Current Role**: File system operations
- **Context Engine Integration**:
  - Provide file tree to ProjectContextProvider
  - Watch for file changes
  - Provide file contents on demand
- **Changes Needed**: Add methods to expose project structure and file contents
- **Impact**: Medium (new IPC handlers)

**GitManager** (`src/main/GitManager.ts`)
- **Current Role**: Git operations
- **Context Engine Integration**:
  - Provide Git status to GitContextProvider
  - Watch for branch/status changes
  - Provide commit history
- **Changes Needed**: Add methods to expose Git state
- **Impact**: Medium (new IPC handlers)

**AIServiceManager** (`src/main/AIServiceManager.ts`)
- **Current Role**: AI model integration
- **Context Engine Integration**:
  - Provide available models to AIContextProvider
  - Manage conversation history
  - Handle model invocation
- **Changes Needed**: Add methods to expose model state and conversations
- **Impact**: Medium (new IPC handlers)

#### 4. Hook Integration Points

**useContextEngine** (New Hook)
- **Location**: `src/renderer/hooks/useContextEngine.ts`
- **Purpose**: Provide Context Engine access to components
- **Usage**: `const context = useContextEngine();`
- **Components Using**:
  - BrowserPanel
  - WorkspacePanel
  - DeveloperWorkspace
  - AIWorkspacePanel
  - Terminal
  - GitPanel
  - CommandPalette

**useKeyboardShortcuts** (Existing Hook)
- **Location**: `src/renderer/hooks/useKeyboardShortcuts.ts`
- **Integration**: May add shortcuts for Context Engine operations
- **Example**: Cmd+K to open command palette (searches all contexts)

#### 5. Type System Integration

**New Types to Create**:
- `src/renderer/types/context.ts` - All context interfaces
- `src/renderer/types/providers.ts` - Provider interfaces
- `src/renderer/types/events.ts` - Event type definitions
- `src/renderer/types/workflow.ts` - Workflow execution types

**Existing Types to Extend**:
- `Tab` - Add `content` field for page content
- `Note` - Already complete
- `FileNode` - Add `content` field for file contents
- `Bookmark` - Already complete

#### 6. Event System Integration

**Events to Implement**:
```
browser:*
├── tab-created
├── tab-closed
├── tab-switched
├── navigation-complete
├── url-changed
└── title-changed

project:*
├── file-created
├── file-modified
├── file-deleted
├── file-opened
└── buffer-changed

git:*
├── branch-changed
├── status-changed
└── commit-created

terminal:*
├── command-executed
└── output-received

notes:*
├── note-created
├── note-modified
└── note-deleted

ai:*
├── model-changed
├── message-sent
└── conversation-started

workspace:*
├── panel-changed
├── layout-changed
└── settings-changed
```

**Event Subscribers**:
- Context Engine providers (listen to all events)
- Components (subscribe to relevant events)
- Cache manager (invalidate on events)

#### 7. IPC Channel Integration

**New IPC Channels to Add**:
```
Main Process → Renderer:
├── browser:tab-state-changed
├── git:status-changed
├── project:file-changed
├── terminal:output-received
└── ai:model-changed

Renderer → Main Process:
├── get-browser-context
├── get-project-context
├── get-git-context
├── get-terminal-context
├── execute-git-command
├── execute-terminal-command
└── read-file-content
```

#### 8. Caching Layer Integration

**Cache Invalidation Triggers**:
- Browser: Tab change, navigation
- Project: File change, buffer update
- Git: Git operation, branch change
- Terminal: Command execution
- Notes: Note modification
- AI: Model change, message sent

**Cache Persistence**:
- In-memory cache for fast access
- localStorage for cross-session persistence (optional)
- TTL-based expiration

#### 9. Performance Optimization Points

**Lazy Loading**:
- Heavy providers (Git, Terminal, Project) load on-demand
- File contents fetched only when requested
- Git history fetched incrementally

**Debouncing**:
- File change events debounced (100ms)
- Git status checks debounced (500ms)
- Terminal output batched (200ms)

**Memoization**:
- Component selectors with `useShallow`
- Context queries cached per component
- Search results cached

#### 10. Testing Integration Points

**Unit Tests Needed**:
- Each ContextProvider independently
- Event emission and subscription
- Cache invalidation logic
- Query methods

**Integration Tests Needed**:
- Full context aggregation
- Cross-provider queries
- Event propagation
- Component integration

**E2E Tests Needed**:
- User workflows (e.g., "refactor component")
- Multi-context operations
- Real browser/Git/file operations

---

## Integration Timeline

### Pre-Implementation
- [ ] Review this documentation
- [ ] Capture UI screenshots on real desktop
- [ ] Validate architecture against UI
- [ ] Plan store extensions

### Phase C.1: Core Engine
- [ ] Create ContextEngine service
- [ ] Implement all 7 context providers
- [ ] Add event emitter
- [ ] Wire to existing stores
- [ ] Create useContextEngine hook

### Phase C.2: Component Integration
- [ ] Update BrowserPanel to use context
- [ ] Update WorkspacePanel to use context
- [ ] Implement DeveloperWorkspace
- [ ] Implement AIWorkspacePanel
- [ ] Implement Terminal
- [ ] Implement GitPanel
- [ ] Implement CommandPalette search

### Phase C.3: Advanced Features
- [ ] Workflow execution
- [ ] Agent coordination
- [ ] Real-time synchronization
- [ ] Performance optimization

---

## Notes for Phase C Implementation

1. **Start with BrowserContextProvider** - Simplest, already has data
2. **Defer Terminal/Git** - More complex, can be added later
3. **Use existing stores** - Don't duplicate state, read from Zustand
4. **Event-driven updates** - Minimize polling, use event subscriptions
5. **Cache aggressively** - Performance is critical for agent operations
6. **Type safety** - Full TypeScript, no `any` types
7. **Error handling** - Graceful degradation if context unavailable
8. **Testing** - Write tests as you implement

---

## Conclusion

This documentation provides a complete map of the current Synapse Browser UI architecture and identifies all integration points for the Context Engine. Before implementing Phase C, review this document with screenshots of the actual running application to ensure the architecture aligns with the visual design and user workflows.
