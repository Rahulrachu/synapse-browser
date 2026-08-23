# Synapse Browser Architecture

Synapse Browser is an Electron desktop application with a React and TypeScript renderer. The Electron main process owns native window and browser-view lifecycle, persistence, filesystem operations, downloads, AI services, and IPC handlers. The renderer is a projection of main-process state and communicates through a constrained preload bridge.

## Runtime layers

| Layer | Responsibility | Boundary |
|---|---|---|
| Main process | Browser tabs, WebContentsView instances, storage, projects, prompts, AI providers, downloads, native menus | Owns privileged APIs and native resources |
| Preload | `invoke`, `send`, and removable event subscriptions | Exposes only allow-listed IPC channels through `contextBridge` |
| Renderer | React UI, Zustand workspace state, tabs/address bar/panels | No Node integration; no direct filesystem or Electron module access |
| Shared contracts | AI, event, prompt, search, agent, workflow, and permission types | Compile-time contracts between subsystems |

## Browser lifecycle

`BrowserManager` is the source of truth for native browser tabs. Each tab owns one `WebContentsView`, and tab activation changes visibility and bounds rather than recreating the view. Closing a tab removes the view, destroys its web contents, updates the active-tab selection, persists the remaining tabs, and emits renderer state updates. Browser content uses sandboxed, context-isolated web preferences with Node integration disabled.

## State and IPC

The renderer stores UI projections in Zustand. Native browser state remains in the main process. IPC requests are allow-listed in preload and renderer subscriptions return cleanup functions. AI is optional: provider setup and vision configuration are deferred capabilities, and unavailable providers return explicit errors instead of preventing application startup.

## Filesystem boundary

Project operations resolve paths against a canonical project root and reject absolute paths, traversal, and symlink escapes. File creation and writes create parent directories only after confinement checks. The project manager stores typed project records rather than unbounded `any` objects.

## Build and validation

The project uses electron-vite for main, preload, and renderer bundles. `pnpm typecheck` runs strict application checking through `tsconfig.typecheck.json`; test files remain independently exercised by Vitest. `pnpm test --run` runs the unit and subsystem tests.
