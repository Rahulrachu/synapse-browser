# Changelog

## 1.0.1

### Fixed
- **AI panel split screen.** Opening the AI panel now shrinks the web page and shows the panel beside it. The page container measured 0px tall, so the browser surface never received its real size and stayed full width over the AI panel.

### Added
- Drag the AI panel's left edge to resize it (300–720px). The width is remembered; double-click the edge to reset.
- `Ctrl+Shift+A` toggles the AI panel and `Ctrl+K` opens the command palette, even while a web page has focus.
- Crashed tabs reload themselves (up to 3 times a minute), and the Synapse UI recovers if its own renderer crashes.
- Only one Synapse window runs at a time; launching again focuses the open window.
- Automatic updates from GitHub Releases (downloaded in the background, installed on quit).
- Strict Content-Security-Policy for the packaged UI; the UI window can't be navigated away, and its links open in your default browser.
- GitHub Actions: CI build on every push, and a Windows installer built and attached to the release on every `v*` tag.

### Changed
- The repository now holds the exact source of the shipped Windows app (see `docs/SOURCE.md`). The older, unused codebase was removed.

## 1.0.0
- First Windows release.
