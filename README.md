# Synapse Browser v1.0.0

Synapse Browser is an advanced, AI-first productivity desktop browser and developer environment built with Electron, React, TypeScript, and TailwindCSS. It combines a high-performance multi-process web rendering engine with an integrated AI workspace and full-featured developer toolset.

## Core Capabilities & Feature Readiness

Synapse Browser classifies capabilities into four distinct readiness tiers based on real-world verification and testing:

| Feature Category | Readiness Tier | Verification Summary |
|---|---|---|
| **Core Browser Engine & Tabs** | Production-ready | Native `WebContentsView` instances, multi-tab browsing, navigation, history, bookmarks, session restoration, and crash recovery. |
| **Profiles & Private Browsing** | Production-ready | Isolated partition-backed profiles and strictly ephemeral private browsing sessions. |
| **Downloads & Uploads** | Production-ready | Real-time session download management, progress tracking, file actions, and native file upload dialogs. |
| **Security & IPC** | Production-ready | Context isolation, sandboxing, strict IPC allowlists, and origin-scoped permission prompts. |
| **Developer Workspace** | Production-ready | Real terminal sessions, file explorer, Monaco editor, and Git integration. |
| **AI Workspace & Context Broker** | Beta | Controlled context sharing, page summarization, error explanation, and safe browser action execution. |
| **Browser Agent Takeover** | Beta | Structured live-DOM inspection and user-like click, fill, keypress, scroll, and navigation actions with confirmation gates for external side effects. See [the browser-agent design](docs/BROWSER_AGENT.md). |
| **Advanced Extensions** | Experimental | Browser extension loading and custom WebAssembly runtime hooks. |
| **Cloud Sync** | Planned | Encrypted cross-device synchronization of bookmarks and settings. |

## Installation & Local Development

To run Synapse Browser locally from source, ensure Node.js (>=22.0.0) and pnpm are installed:

```bash
git clone https://github.com/Rahulrachu/synapse-browser.git
cd synapse-browser
pnpm install
pnpm dev
```

## Production Build & Packaging

To compile the application for production distribution:

```bash
pnpm build
pnpm pack
```

For platform-specific distribution bundles:

```bash
pnpm dist:win
pnpm dist:mac
pnpm dist:linux
```

## Testing

Synapse Browser includes an automated test suite powered by Vitest covering core manager logic, tab restoration, and workspace stores:

```bash
pnpm test -- --run
```

## License

MIT License. See [LICENSE](LICENSE) for details.
