# Synapse Browser v1.0.5 productization branch

Synapse Browser is an AI-first productivity desktop browser and developer environment built with Electron, React, TypeScript, and TailwindCSS. It combines multi-process web rendering with an integrated workspace for browsing, notes, files, code, terminal workflows, and optional AI capabilities.

## Feature Readiness

| Feature Category | Readiness | Notes |
|---|---|---|
| Core browser engine and tabs | Production-oriented | Native `WebContentsView` lifecycle, multi-tab browsing, navigation, history, bookmarks, and session restoration are implemented. |
| Profiles and private browsing | Production-oriented | Partition-backed profiles and ephemeral private sessions are implemented. |
| Downloads and permissions | Production-oriented | Download tracking and origin-scoped permission prompts are implemented. |
| Developer workspace | Production-oriented | File explorer, Monaco-related editor integration, terminal integration, and Git services are present. |
| AI workspace and context broker | Beta/optional | AI providers are optional and must not prevent application startup. |
| Browser agent | Beta | Structured browser-agent actions and confirmation gates are implemented. See [the browser-agent design](docs/BROWSER_AGENT.md). |
| Cloud sync and advanced extensions | Planned/experimental | These capabilities are not required for core startup. |

## Requirements

Use Node.js `>=24.0.0` and pnpm `>=9.0.0`. The repository’s lockfile is authoritative; use a frozen install for reproducible setup.

## Installation and Development

```bash
git clone https://github.com/Rahulrachu/synapse-browser.git
cd synapse-browser
pnpm install --frozen-lockfile
pnpm dev
```

The development process starts the Vite renderer and Electron main process. AI provider credentials are optional; do not commit `.env` files or API keys.

## Validation and Build

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

`pnpm lint` currently runs strict TypeScript validation because the repository does not yet include an ESLint configuration. The detailed baseline and final audit are in [docs/FULL_AUDIT_BASELINE.md](docs/FULL_AUDIT_BASELINE.md) and [docs/FULL_AUDIT_FINAL_REPORT.md](docs/FULL_AUDIT_FINAL_REPORT.md).

## Packaging

Build a platform-specific Electron Builder artifact with the relevant command:

```bash
pnpm run pack
pnpm dist:win
pnpm dist:mac
pnpm dist:linux
```

The architecture and privileged-process boundaries are described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Common setup and platform limitations are described in [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md). Platform evidence is maintained in [docs/RELEASE_ACCEPTANCE.md](docs/RELEASE_ACCEPTANCE.md), with the full decision record in [docs/FINAL_RELEASE_REPORT.md](docs/FINAL_RELEASE_REPORT.md). The native-runner workflow at `.github/workflows/release-validation.yml` typechecks, tests, builds, packages, and uploads Windows, macOS, and Linux artifacts; use it before publishing v1.0.5.

## License

MIT License. See [LICENSE](LICENSE) for details.
