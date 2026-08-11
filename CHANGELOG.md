# Changelog

All notable changes to Synapse Browser will be documented in this file.

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
