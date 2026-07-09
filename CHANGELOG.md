# Changelog

All notable changes to Synapse Browser will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-06

### Added

#### Core Browser Engine

- Real Electron-based browser with WebContents rendering
- Multi-tab browsing with create, close, switch, and duplicate functionality
- Tab state tracking (title, URL, loading state)
- Real website rendering and navigation
- Back/Forward navigation with history support
- Reload and stop loading buttons
- Address bar with URL input and auto-protocol detection
- Page title and URL display
- Right-click context menu with full browser actions

#### Tab Management

- Create new tabs via button or keyboard shortcut
- Close tabs with visual feedback
- Switch between tabs with click
- Duplicate existing tabs
- Visual indicators for loading state
- Tab bar with overflow scrolling

#### Persistent Storage

- Bookmarks with add, remove, and manage functionality
- History tracking with visit count and timestamps
- Session saving and restoration with multiple tabs
- Downloads tracking and management
- File-based storage in user data directory

#### UI/UX

- Dark and Light theme support
- Responsive layout with resizable panels
- Smooth animations with Framer Motion
- Professional design with Tailwind CSS
- Loading indicators
- Keyboard shortcuts for all major actions
- Status bar with contextual information

#### Developer Experience

- TypeScript for type safety throughout
- IPC-based communication between main and renderer processes
- Modular architecture with separated concerns
- Hot-reload support in development mode
- Developer tools integration (F12)

#### Workspace Engine

- Dynamic split-panels (2, 3, 4 panel layouts)
- Horizontal and vertical splitting
- Workspace presets for saving and restoring states
- Tab groups and pinning
- Panel navigation via sidebar

#### AI Workspace

- Multi-provider AI support (OpenAI, Ollama)
- AI chat panel with conversation history
- Model selection interface
- Context engine for persistent AI awareness
- Memory system with vector embeddings

#### Developer Tools

- Monaco Editor with syntax highlighting
- Git integration with status, commits, and branch management
- Integrated terminal
- File explorer with project tree

#### Productivity Panels

- Markdown notes editor
- Todo list for task tracking
- Command palette (Ctrl+K) with 50+ commands
- Search center for global search
- Notifications system

#### Multi-Agent Runtime

- Agent Orchestrator for coordinating specialized agents
- Planning Engine for task decomposition
- Context Engine for workspace awareness
- Memory Manager with short-term and long-term stores
- Specialized agents: Planner, Browser, Coding, Research, Reviewer, Writer, Orchestrator
- Tool runtime connecting agents to browser, filesystem, terminal, and HTTP tools

### Changed

- Migrated build system to Electron-Vite for faster builds
- Updated to Electron 43 and React 19
- Improved IPC handler organization in background.ts

### Fixed

- Resolved IPC memory leaks in preload script
- Fixed production build asset pathing
- Removed duplicate IPC handler registrations
- Fixed WebContentsView attachment logic
- Added missing React imports in BrowserPanel
- Fixed lazy import in PanelRegistry

### Technical Details

| Component | Technology |
|---|---|
| Electron | 43.0.0 |
| React | 19.2.7 |
| TypeScript | 6.0.3 |
| Tailwind CSS | 4.3.2 |
| Framer Motion | 12.42.2 |
| Zustand | 5.0.14 |
| Vite | 8.1.3 |
| Monaco Editor | @monaco-editor/react 4.7.0 |
| SQLite | sqlite3 6.0.1 |

### Known Limitations

- WebContents-based tabs are hidden windows (not visible in taskbar)
- No support for browser extensions yet
- Limited media format support (depends on Chromium)
- No incognito/private mode yet

---

## [0.9.0] - 2026-06-28

### Added

- Initial browser engine implementation
- Basic tab management
- Electron main process setup
- React renderer with basic UI components
- Dark theme support
- IPC communication layer

---

## [0.8.0] - 2026-06-20

### Added

- Project scaffold and initial architecture
- Electron and React project setup
- Development tooling configuration
