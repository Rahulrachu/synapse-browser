# Troubleshooting

## Installation

Use Node 24 or newer and pnpm 9 or newer. The current recovery environment used Node 22.13.0, which installs successfully but emits an engine warning because the package requires Node `>=24.0.0`. Run `pnpm install --frozen-lockfile` from a clean checkout so native `sqlite3` dependencies are rebuilt for the installed Electron version.

## Development mode

Run `pnpm dev`. If the renderer does not load, verify that the Vite development server is reachable at `http://localhost:5173` and that the Electron process is using `NODE_ENV=development`. In a packaged build, the main process resolves `out/preload/preload.cjs` and `out/renderer/index.html` relative to the packaged application root.

## Validation commands

Run `pnpm typecheck`, `pnpm test --run`, and `pnpm build`. `pnpm lint` is currently an alias for strict TypeScript validation because the repository does not contain an ESLint configuration or ESLint dependency. This is intentionally visible rather than silently claiming a lint pass.

## Runtime limitations

A real Electron process was started successfully in the available Xvfb environment, but the unattended smoke command was terminated after its timeout because Electron remains a foreground desktop process. The sandbox did not provide a complete interactive desktop session for manually exercising URL entry, tabs, panels, and keyboard shortcuts. Windows-specific PowerShell, installer, filesystem-permission, and shortcut validation must be performed on Windows.

## Security notes

Do not add arbitrary IPC channels to the preload allow-list. New channels must have a narrow contract and validate arguments in the main process. Project file APIs reject paths outside the selected project root. AI providers are optional and should never require committing secrets; configure credentials through the user environment or secure runtime configuration.
