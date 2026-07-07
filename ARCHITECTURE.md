# Synapse Browser Architecture

## Project Status: Phases 2-7 Complete (Phase C, D, E, F, G In Progress)

This document outlines the architecture of Synapse Browser, an AI-first developer workspace combining browser, IDE, and productivity tools in one unified interface.

## 1. Completed Phases

### Phase 1: Browser Engine ✅
- BrowserManager with tab lifecycle management
- BrowserWindow instances per tab
- Navigation, reload, back/forward support
- Tab metadata tracking (title, URL, loading state)

### Phase 2: Advanced Browser ✅
- **Drag-and-drop tab reordering** (AdvancedTabBar.tsx)
- **Tab groups** with colors and management (TabGroups.tsx)
- **Tab properties**: pin, sleep, color, grouping
- **Session management**: save/restore browser sessions (SessionManager.tsx)
- **Tab state persistence**: all tab properties stored in Zustand + IPC

### Phase 3: Workspace Engine ✅
- **Resizable panels** with horizontal/vertical split support
- **Workspace layouts**: save/load multi-panel configurations
- **WorkspaceLayoutManager** for layout CRUD operations
- **Multi-panel rendering** (2, 3, or 4 panels)
- **Panel persistence** via PanelManager in main process

### Phase 4: AI Workspace ✅
- **AIWorkspacePanel** with multi-model support
- **Service management**: add/enable/disable AI services
- **Conversation system**: create, manage, and persist conversations
- **Message history**: store and retrieve conversation messages
- **Support for**: OpenAI, Claude, Gemini, DeepSeek, Grok, OpenRouter, Ollama, LM Studio
- **BYOK** (Bring Your Own API Keys) - no hardcoded keys

### Phase 5: Developer Workspace ✅
- **DeveloperWorkspace** component with integrated tools
- **Monaco Editor** for code editing with syntax highlighting
- **File Explorer** with tree view and folder navigation
- **Project management**: open, read, write, delete files
- **Git integration**: status, commits, branches, diffs
- **Open files tabs** with dirty state tracking
- **Auto-save** support (configurable)

### Phase 6: Productivity ✅
- **ProductivityPanel** with multi-tab interface
- **Notes**: create, edit, delete notes with persistence
- **Todo List**: task management with completion tracking
- **Whiteboard**: quick notes and sketches
- **Search**: global search across notes and todos
- **LocalStorage persistence** for all productivity data

### Phase 7: Command Palette & Settings ✅
- **CommandPalette**: global search with keyboard shortcuts (Cmd+K)
- **50+ commands** across all categories (Browser, Productivity, Git, Settings)
- **Enhanced SettingsPanel**: comprehensive app configuration
- **Settings categories**: Appearance, Editor, Features, Browser
- **Persistent settings** via localStorage

### Phase C: Context Engine 🛠️
- **Context Management**: Centralized state for browser, workspace, and project context
- **Context Summarization**: Generates human-readable context for AI consumption
- **Real-time Updates**: Tracks active tabs, open files, and recent user actions

### Phase D: Memory System 🛠️
- **Persistent Memory**: Stores facts, preferences, and history in `memory.json`
- **Memory Retrieval**: Search and retrieval of relevant memories for AI context
- **Categorized Storage**: Supports facts, preferences, history, and project-specific memories

### Phase E: Planning Engine 🛠️
- **Goal-oriented Planning**: Breaks down complex goals into manageable tasks
- **Task Tracking**: Manages status and results for multi-step plans
- **Nested Subtasks**: Support for hierarchical task structures

### Phase F: Browser Automation 🛠️
- **Programmatic Interaction**: Automates clicks, typing, and navigation
- **DOM Inspection**: Ability to query elements and extract page source
- **Visual Feedback**: Captures screenshots of the current browser state
- **Environment Management**: Access to cookies, localStorage, and JavaScript execution
- **IPC Integration**: Exposes automation capabilities to the AI system via IPC handlers

### Phase G: Tool Runtime 🛠️
- **Centralized Registry**: Secure discovery and management of all AI tools
- **Unified Interface**: Common interface for all tools with structured input/output
- **Secure Execution**: Permission validation and timeout/cancellation support
- **Built-in Tools**: Initial set of tools for Browser, Terminal, File System, Git, HTTP, and more
- **Extensible Architecture**: Easy addition of new tools without core modifications
- **Observability**: Structured logging and execution history for all tool invocations

## 2. Folder Structure

```
./
├── public/                 # Static assets
├── src/
│   ├── main/              # Electron main process
│   │   ├── background.ts  # IPC handlers for all phases
│   │   ├── BrowserManager.ts
│   │   ├── BrowserWindow.ts
│   │   ├── SessionManager.ts
│   │   ├── TabGroupManager.ts
│   │   ├── PanelManager.ts
│   │   ├── AIServiceManager.ts
│   │   ├── ProjectManager.ts
│   │   ├── GitManager.ts
│   │   ├── DownloadManager.ts
│   │   └── preload.ts
│   ├── renderer/          # React components
│   │   ├── components/
│   │   │   ├── BrowserPanel.tsx
│   │   │   ├── AdvancedTabBar.tsx
│   │   │   ├── TabGroups.tsx
│   │   │   ├── SessionManager.tsx
│   │   │   ├── WorkspaceLayoutManager.tsx
│   │   │   ├── ResizablePanel.tsx
│   │   │   ├── AIWorkspacePanel.tsx
│   │   │   ├── DeveloperWorkspace.tsx
│   │   │   ├── ProductivityPanel.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MultiPanelLayout.tsx
│   │   ├── store/
│   │   │   ├── browserStore.ts    # Zustand: tabs, groups, sessions
│   │   │   └── workspaceStore.ts  # Zustand: notes, theme, layout
│   │   ├── hooks/
│   │   │   └── useKeyboardShortcuts.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── common/
│   │   └── utils.ts       # Shared types (TabData, Session, etc.)
│   ├── browser/
│   │   ├── BrowserEngine.ts
│   │   ├── BookmarkManager.ts
│   │   └── HistoryManager.ts
│   ├── git/
│   │   └── GitManager.ts
│   └── workspace/
│       └── SessionManager.ts
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── ARCHITECTURE.md
```

## 3. State Management

### Zustand Stores

**browserStore.ts**
- `tabs`: TabData[] - all open tabs with properties
- `activeTabId`: current active tab
- `tabGroups`: TabGroup[] - tab group definitions
- `sessions`: Session[] - saved browser sessions
- Actions: addTab, closeTab, pinTab, sleepTab, setTabColor, saveSession, etc.

**workspaceStore.ts**
- `notes`: Note[] - all user notes
- `isDarkMode`: boolean - theme preference
- `workspaceLayout`: current workspace configuration
- Actions: addNote, updateNote, deleteNote, toggleDarkMode, etc.

## 4. IPC Communication

All communication between main and renderer processes is handled via IPC handlers in `background.ts`:

### Browser IPC
- `create-tab`, `close-tab`, `set-active-tab`, `duplicate-tab`, `get-all-tabs`
- `navigate-to`, `go-back`, `go-forward`, `reload`, `stop-loading`

### Tab Groups IPC
- `create-tab-group`, `delete-tab-group`, `add-tab-to-group`, `remove-tab-from-group`
- `pin-tab`, `unpin-tab`, `sleep-tab`, `wake-tab`, `set-tab-color`

### Sessions IPC
- `save-session`, `get-sessions`, `get-session`, `delete-session`, `rename-session`

### Workspace Layout IPC
- `create-layout`, `get-layouts`, `update-layout`, `delete-layout`
- `create-vertical-split`, `create-horizontal-split`, `create-grid-layout`

### AI Services IPC
- `add-ai-service`, `get-ai-services`, `update-ai-service`, `delete-ai-service`
- `create-conversation`, `get-conversations`, `add-message`

### Project & File IPC
- `add-project`, `get-projects`, `get-project-files`, `read-file`, `write-file`
- `create-file`, `create-directory`, `delete-file`

### Git IPC
- `set-git-project-path`, `get-git-status`, `get-git-commit-history`
- `git-commit`, `git-push`, `git-pull`, `git-create-branch`, `git-switch-branch`

### Browser Automation IPC
- `automation-navigate`, `automation-click`, `automation-type`, `automation-execute-js`
- `automation-get-source`, `automation-screenshot`, `automation-scroll`, `automation-get-cookies`

### Tool Runtime IPC
- `tool-list`: Get definitions of all registered tools
- `tool-invoke`: Execute a specific tool with parameters
- `tool-history`: Retrieve the history of tool executions

## 5. Data Persistence

### Main Process (Node.js)
- **JSON Files**: Sessions, tab groups, workspace layouts stored in userData directory
- **SQLite**: Future database for bookmarks, history, notes (schema defined in ARCHITECTURE.md)
- **Git Integration**: Direct filesystem access for project files

### Renderer Process (React)
- **Zustand Stores**: In-memory state management
- **localStorage**: Settings, productivity data, whiteboard content
- **IPC Sync**: Periodic sync with main process for critical data

## 6. Component Hierarchy

```
App.tsx
├── Sidebar.tsx (navigation)
├── Header (panel layout selector)
└── MultiPanelLayout.tsx
    ├── ResizablePanel (Panel 1)
    │   └── BrowserPanel.tsx
    │       ├── AdvancedTabBar.tsx
    │       ├── Navigation Bar
    │       └── Browser Content Area
    ├── ResizablePanel (Panel 2)
    │   └── AIWorkspacePanel.tsx
    │       ├── Services Sidebar
    │       └── Chat Area
    ├── ResizablePanel (Panel 3)
    │   └── DeveloperWorkspace.tsx
    │       ├── File Explorer
    │       ├── Monaco Editor
    │       └── Terminal
    └── ResizablePanel (Panel 4)
        └── ProductivityPanel.tsx
            ├── Notes
            ├── Todos
            ├── Whiteboard
            └── Search
```

## 7. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+K | Open Command Palette |
| Cmd+T | New Tab |
| Cmd+N | New Note |
| Cmd+Shift+D | Toggle Dark Mode |
| Cmd+Shift+C | Git Commit |
| Cmd+S | Save File |

## 8. Styling

- **Tailwind CSS** for utility-first styling
- **Dark Mode**: Full dark mode support with `isDarkMode` context
- **Color Scheme**: Synapse accent color (#7C3AED) for primary actions
- **Responsive**: Adapts to window resizing and panel resizing

## 9. Performance Optimizations

- **Tab Sleeping**: Inactive tabs can be put to sleep to free memory
- **Lazy Loading**: Components load on demand
- **Memoization**: React.memo for expensive components
- **Zustand**: Efficient state management with selector-based subscriptions

## 10. Security

- **Context Isolation**: Enabled in BrowserWindow preload
- **No Node Integration**: Disabled for renderer process
- **Sandbox Mode**: Enabled for all browser tabs
- **IPC Validation**: All IPC handlers validate input
- **BYOK**: No hardcoded API keys in codebase

## 11. Next Phases (Future)

### Phase 8: Performance & Optimization
- Memory profiling and optimization
- GPU rendering for smooth animations
- Background indexing for search
- Crash recovery and auto-save

### Phase 9: Production
- Windows/Mac/Linux installers
- Auto-updater
- Plugin API and extension SDK
- Error logging and crash reporting
- Settings UI for advanced options

## 12. Build & Deployment

```bash
npm install          # Install dependencies
npm run dev          # Development mode with HMR
npm run build        # Build for production
npm run pack         # Create portable package
npm run dist         # Create installers
```

## 13. Technology Stack

- **Electron 43**: Desktop application framework
- **React 19**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Styling
- **Zustand 5**: State management
- **Monaco Editor**: Code editing
- **Vite 8**: Build tool
- **SQLite 6**: Local database (future)
- **Electron-Builder**: Packaging and distribution

---

**Last Updated**: Phase 7 Complete
**Maintainer**: Rahul S R
**License**: MIT
