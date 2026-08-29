# Changelog

All notable changes to Synapse Browser will be documented in this file.

## [1.1.2] - 2026-08-29

### Fixed
- Added a real desktop-persisted AI API settings form for provider name, API key, base URL, model, enable/disable state, and connection testing.
- Updated ORION to consume the saved API configuration rather than only process environment variables.
- Added a native image chooser that compresses selected images to a safe data URL and renders them as home-tab backgrounds.
- Made ORION visible by default on every launch and corrected custom data-URL background rendering.
- Verified the corrected app with a production build, focused browser-manager tests, and a headless Electron startup smoke test.

## [1.1.1] - 2026-08-29

### Fixed
- Fixed native browser resizing so the active WebContentsView cannot cover or push out the AI panel.
- Kept the ORION panel mounted as the primary workspace while auxiliary tools are opened.
- Connected sidebar and window-control icons to real actions, including Notes, Chromium DevTools, terminal feedback, settings, help, profile feedback, minimize, maximize/restore, and close.
- Fixed the Notes panel’s invalid hook usage so the Files control opens without a React runtime error.

## [1.1.0] - 2026-08-29

### Added
- Replaced the app branding with the supplied Synapse Browser logo and packaged PNG/ICO assets.
- Added selectable Google, Bing, DuckDuckGo, and Brave Search providers for address-bar searches.
- Added a customizable home tab with persisted background color/image and editable website shortcuts.

### Fixed
- Kept the ORION AI panel available when tasks open or switch to a new tab, with persisted panel visibility.
- Made the AI panel and browser content responsive at smaller window sizes.
- Corrected native browser bounds clamping so the WebContentsView follows the measured layout instead of reserving a duplicate fixed panel width.

## [1.0.0] - 2026-08-11

### Added
- **Real Browser Engine**: Replaced placeholder UI with native Electron `WebContentsView` instances, providing isolated partition sessions and full web standards compliance.
- **Advanced Multi-Tab Management**: Support for unlimited tabs, active-tab visibility control, drag reordering, pinning, audio muting, duplication, recently closed tabs, and crash recovery.
- **Persistent Profiles & Private Browsing**: Isolated profile partitions with separate cookies, storage, history, and bookmarks; fully functioning private browsing mode that isolates ephemeral state and prevents persistent history logging.
- **Persistent History & Bookmarks**: Profile-scoped history logging, search, time-range clearing, bookmark management, and hierarchical folder structures.
- **Download & Upload Management**: Native session download monitoring, progress tracking, cancellation, pause/resume, file opening, folder revealing, and persistent history, alongside robust file upload support.
- **Security & Permissions**: Context isolation (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`), strict IPC allowlists, origin-scoped permission prompts (camera, microphone, location, clipboard, notifications), and secure popup handling.
- **Developer Workspace**: Integrated terminal, file explorer, Monaco code editor, and Git status/diff/commit/push management.
- **AI Workspace & Context Broker**: AI agent integration with controlled context access (URL, title, selected text, authorized files), execution traces, and safe browser/workspace actions.
- **Browser Utilities**: Find-in-page, zoom controls, printing, PDF export, native context menus, and DevTools per tab.
- **Automated Testing & Packaging**: Comprehensive unit test suite (Vitest), production build pipeline (`electron-vite`), and multi-platform packaging support (`electron-builder`).
