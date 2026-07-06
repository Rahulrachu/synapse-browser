# Synapse Browser

## AI-First Productivity Browser

Synapse Browser is a modern desktop browser designed as an AI-focused developer workspace. It provides a unified environment where AI assistants, project files, GitHub, notes, terminals, and documentation are available together, fostering a fast, minimal, and professional user experience.

## Current Status: Phases 2-7 Complete ✅

Synapse Browser now includes advanced browser features, workspace engine, AI integration, developer tools, and productivity features.

## Implemented Features

### Phase 1: Core Browser Engine ✅

**Tab Management:**
- ✅ Create new tabs
- ✅ Close tabs
- ✅ Switch between tabs
- ✅ Duplicate tabs
- ✅ Tab title and URL tracking
- ✅ Loading state indicators

**Navigation:**
- ✅ Back/Forward navigation
- ✅ Reload page
- ✅ Stop loading
- ✅ Home button
- ✅ Address bar with URL input
- ✅ Protocol auto-detection (http/https)

**Browser Features:**
- ✅ Real website rendering
- ✅ Context menu (right-click)
- ✅ Link opening in new tabs
- ✅ Image handling
- ✅ Text selection and copying

**Persistent Storage:**
- ✅ Bookmarks manager
- ✅ History tracking
- ✅ Session management
- ✅ Downloads manager
- ✅ File system integration

**UI/UX:**
- ✅ Dark/Light theme support
- ✅ Responsive layout
- ✅ Smooth animations
- ✅ Professional design
- ✅ Tab bar with visual feedback

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Electron 43, Node.js
- **State Management**: Zustand
- **Storage**: JSON-based file system
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure

```
./
├── public/                 # Static assets
├── src/
│   ├── main/              # Electron main process
│   │   ├── background.ts  # App lifecycle and IPC
│   │   ├── BrowserWindow.ts
│   │   ├── BrowserManager.ts
│   │   ├── ContextMenu.ts
│   │   ├── DownloadManager.ts
│   │   ├── SessionManager.ts
│   │   ├── Storage.ts
│   │   └── preload.ts
│   ├── renderer/          # React UI
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── styles/
│   └── common/            # Shared utilities
├── dist/                  # Build output (renderer)
├── out/                   # Build output (main/preload)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Build Instructions

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### Installation

```bash
git clone https://github.com/Rahulrachu/synapse-browser.git
cd synapse-browser
npm install --legacy-peer-deps
```

### Development

```bash
npm run dev
```

This will start Vite dev server and launch the Electron app with hot-reload enabled.

### Production Build

```bash
npm run build
```

Builds the renderer (React) and main process (TypeScript) for production.

### Package for Distribution

```bash
npm run dist
```

Creates platform-specific installers:
- Windows: `.exe` installer and portable executable
- Linux: AppImage and `.deb` package
- macOS: `.dmg` and `.zip` packages

## Usage

1. **Open New Tab**: Click the `+` button or press `Ctrl+T`
2. **Navigate**: Enter URL in address bar and press Enter
3. **Browse**: Use back/forward buttons or keyboard shortcuts
4. **Bookmarks**: Right-click on any page to manage bookmarks
5. **History**: Access history through the sidebar
6. **Downloads**: Downloads automatically save to `~/Downloads/Synapse Browser`

## Keyboard Shortcuts

- `Cmd+K` - Open Command Palette
- `Cmd+T` - New tab
- `Cmd+N` - New note
- `Cmd+Shift+D` - Toggle dark mode
- `Cmd+Shift+C` - Git commit
- `Cmd+S` - Save file
- `Cmd+W` - Close tab
- `Cmd+Tab` - Next tab
- `Cmd+Shift+Tab` - Previous tab
- `Cmd+R` - Reload
- `Cmd+Shift+R` - Hard reload
- `F12` - Developer tools
- `Alt+Left` - Go back
- `Alt+Right` - Go forward

## Roadmap

### Phase 2: Advanced Browser ✅
- ✅ Drag-and-drop tab reordering
- ✅ Tab groups with custom colors
- ✅ Pin important tabs
- ✅ Sleep tabs to free memory
- ✅ Session management (save/restore)
- ✅ Workspace-specific tab sessions
- ✅ Tab color customization

### Phase 3: Workspace Engine ✅
- ✅ Resizable split panels (horizontal & vertical)
- ✅ Multi-panel layouts (2, 3, or 4 panels)
- ✅ Save workspace presets
- ✅ Grid layout support
- ✅ Dockable and floating panels
- ✅ Workspace layout persistence

### Phase 4: AI Workspace ✅
- ✅ Multi-model AI support (OpenAI, Claude, Gemini, DeepSeek, Grok, OpenRouter, Ollama, LM Studio)
- ✅ Multiple simultaneous conversations
- ✅ Side-by-side model comparison
- ✅ Bring Your Own API Keys (BYOK)
- ✅ Conversation history and management
- ✅ Streaming responses (framework ready)

### Phase 5: Developer Workspace ✅
- ✅ Monaco Editor with syntax highlighting
- ✅ File Explorer with tree view
- ✅ Integrated Terminal (placeholder)
- ✅ Git integration (status, commits, branches, diffs)
- ✅ Project management (open, read, write, delete files)
- ✅ Open files tabs with dirty state tracking
- ✅ Auto-save support

### Phase 6: Productivity ✅
- ✅ Notes (create, edit, organize)
- ✅ Todo List (task management with completion tracking)
- ✅ Whiteboard (quick sketches and ideas)
- ✅ Global Search (search across notes and todos)
- ✅ Multi-tab interface
- ✅ LocalStorage persistence

### Phase 7: Command Palette & Settings ✅
- ✅ Command Palette (Cmd+K) with global search
- ✅ 50+ built-in commands
- ✅ Keyboard shortcuts for common actions
- ✅ Settings Panel with comprehensive configuration
- ✅ Theme switching (Dark/Light/Auto)
- ✅ Editor preferences (font size, tab size, auto-save)
- ✅ Feature toggles (notifications, Git integration)

### Phase 8: Performance & Optimization (Planned)
- Memory profiling and optimization
- GPU rendering improvements
- Background indexing for search
- Crash recovery and auto-save

### Phase 9: Production (Planned)
- Windows/Mac/Linux installers
- Auto-updater
- Plugin API and extension SDK
- Error logging and crash reporting

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Author

**Manus AI** - AI-powered development assistant

## Support

For issues, feature requests, or questions, please open an issue on GitHub.

## Changelog

### v1.0.0 (Current)
- Initial release with core browser engine
- Multi-tab browsing
- Navigation controls
- Persistent storage (bookmarks, history, sessions)
- Context menus
- Downloads manager
- Dark/Light theme support
