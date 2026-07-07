# Changelog

All notable changes to Synapse Browser will be documented in this file.

## [1.0.0] - 2026-07-06

### Added - Phase 1: Core Browser Engine

#### Browser Engine
- Real Electron-based browser with WebContents rendering
- Multi-tab browsing with create, close, switch, and duplicate functionality
- Tab state tracking (title, URL, loading state)
- Real website rendering and navigation

#### Navigation Controls
- Back/Forward navigation with history support
- Reload and stop loading buttons
- Home button to navigate to default page
- Address bar with URL input and auto-protocol detection
- Page title and URL display

#### Tab Management
- Create new tabs with `+` button
- Close tabs with `X` button
- Switch between tabs with click
- Duplicate existing tabs
- Visual indicators for loading state
- Tab bar with overflow scrolling

#### Context Menu
- Right-click context menu on web pages
- Back/Forward/Reload options
- Link opening in new tabs
- Copy link address
- Image handling (open in new tab, copy address)
- Text selection and copy
- Inspect element for debugging

#### Persistent Storage
- **Bookmarks**: Add, remove, and manage bookmarks
- **History**: Track visited URLs with visit count and timestamps
- **Sessions**: Save and restore browser sessions with multiple tabs
- **Downloads**: Track and manage file downloads
- File-based storage in user data directory

#### UI/UX Features
- Dark and Light theme support
- Responsive layout with resizable panels
- Smooth animations and transitions
- Professional design with Tailwind CSS
- Loading indicators
- Keyboard shortcuts support

#### Developer Experience
- TypeScript for type safety
- IPC-based communication between main and renderer processes
- Modular architecture with separated concerns
- Hot-reload support in development mode
- Developer tools integration

### Technical Details

#### Build System
- Vite for fast development and production builds
- TypeScript compilation for main process
- Electron-builder for cross-platform packaging
- Support for Windows, Linux, and macOS

#### Dependencies
- Electron 43.0.0
- React 19.2.7
- TypeScript 6.0.3
- Tailwind CSS 4.3.2
- Framer Motion 12.42.2
- Zustand 5.0.14

#### File Structure
- `src/main/`: Electron main process modules
  - `background.ts`: App lifecycle and IPC handlers
  - `BrowserWindow.ts`: Main window setup
  - `BrowserManager.ts`: Tab and navigation management
  - `ContextMenu.ts`: Right-click menu handling
  - `DownloadManager.ts`: Download tracking
  - `SessionManager.ts`: Session persistence
  - `Storage.ts`: Bookmarks and history storage
  - `preload.ts`: Secure IPC bridge

- `src/renderer/`: React UI components
  - `App.tsx`: Main application component
  - `components/`: UI components (BrowserPanel, Sidebar, etc.)
  - `hooks/`: Custom React hooks
  - `store/`: Zustand state management
  - `styles/`: Global CSS and Tailwind configuration

### Known Limitations

- WebContents-based tabs are hidden windows (not visible in taskbar)
- No support for extensions yet
- Limited media format support (depends on Chromium)
- No incognito/private mode yet

### Future Roadmap

- **Phase 2**: Advanced tab management (drag-and-drop, grouping, pinning)
- **Phase 3**: Workspace system (split-view, resizable panels)
- **Phase 4**: AI workspace (ChatGPT, Gemini, Claude integration)
- **Phase 5**: Developer tools (terminal, file explorer, Git integration)
- **Phase 6**: Performance optimization and polish

---

## Installation & Usage

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

### Production Build
```bash
npm run build
npm run dist
```

### Keyboard Shortcuts
- `Ctrl+T` - New tab
- `Ctrl+W` - Close tab
- `Ctrl+R` - Reload
- `F12` - Developer tools
- `Alt+Left` - Go back
- `Alt+Right` - Go forward

---

## Contributors

- **Rahul S R** - Initial development and architecture

## License

MIT License - See LICENSE file for details
