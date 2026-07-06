# Synapse Browser

## AI-First Productivity Browser

Synapse Browser is a modern desktop browser designed as an AI-focused developer workspace. It provides a unified environment where AI assistants, project files, GitHub, notes, terminals, and documentation are available together, fostering a fast, minimal, and professional user experience.

## Current Status: Phase 1 Complete ✅

The browser engine is now fully functional with real web rendering capabilities.

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

- `Ctrl+T` - New tab
- `Ctrl+W` - Close tab
- `Ctrl+Tab` - Next tab
- `Ctrl+Shift+Tab` - Previous tab
- `Ctrl+R` - Reload
- `Ctrl+Shift+R` - Hard reload
- `F12` - Developer tools
- `Alt+Left` - Go back
- `Alt+Right` - Go forward

## Roadmap

### Phase 2: Advanced Tab Management
- Drag-and-drop tab reordering
- Tab groups
- Tab pinning
- Session restore on startup

### Phase 3: Workspace System
- Split-view (2/3/4 panes)
- Resizable panels
- Dockable panels
- Workspace presets

### Phase 4: AI Workspace
- ChatGPT integration
- Gemini integration
- Claude integration
- GitHub integration
- Local notes panel

### Phase 5: Developer Tools
- Integrated terminal
- File explorer
- Monaco code editor
- Git integration
- Git status and commit

### Phase 6: Performance & Polish
- Memory optimization
- Startup speed improvement
- Lazy loading
- GPU acceleration
- Crash recovery

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
