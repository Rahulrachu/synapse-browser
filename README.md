# Synapse Browser v1.0.5 productization branch

Synapse Browser is an AI-first productivity desktop browser and developer environment built with Electron 43, React 19, TypeScript, Vite, Zustand, SQLite, and TailwindCSS. It combines multi-process web rendering with an integrated workspace for browsing, notes, files, code, terminal workflows, and optional AI capabilities.

## Verified feature readiness

| Feature category | Status | Verified scope |
|---|---|---|
| Core browser engine and tabs | Production-oriented | Native `WebContentsView` lifecycle, browser rendering, tab strip, navigation surface, history, bookmarks, and session-restoration code are present. |
| Profiles and private browsing | Production-oriented | Partition-backed profiles and ephemeral private sessions are implemented. |
| Downloads and permissions | Production-oriented | Download tracking and origin-scoped permission prompts are implemented. |
| Developer workspace | Production-oriented | File explorer, editor integration, terminal integration, and Git services are wired through secure IPC. |
| First-launch onboarding | Verified | Native Windows CI evidence shows the onboarding card, Skip Setup transition, and browser shell. |
| AI provider setup | Verified UI | Settings contains provider, API-key, base URL, model, save, test, and reset controls; credentials remain in the main process. |
| ORION browser agent | Functional beta | Real provider-backed Linux proof completed visible navigation, confirmation approval, page reading, and rendered final responses for Wikipedia Bangalore and a Google-weather task with a wttr.in fallback. |
| Cloud sync and advanced extensions | Planned/experimental | Not required for core startup and not part of the v1.0.5 acceptance claim. |

> **Release:** v1.0.5 is published at [GitHub Releases](https://github.com/Rahulrachu/synapse-browser/releases/tag/v1.0.5). Windows users should download `Synapse-Browser-1.0.5-Windows-x64-Setup.exe` for the normal install experience; the portable ZIP remains available as an optional download. Provider-backed Windows ORION completion was not run to completion in CI. Please report issues found during real-world Windows testing.

## Synapse product experience

Synapse now uses one restrained visual system across the application: near-black and deep-navy surfaces, soft white typography, thin illuminated borders, subtle blue ambient light, floating tabs, spatial workspace transitions, and quiet status indicators. Shared CSS and React primitives cover raised surfaces, icon buttons, inputs, reveals, active rails, modal treatment, progress lines, and ORION presence states.

The browser shell, sidebar, tabs, address surface, navigation progress, Files, Editor, Terminal, History, Bookmarks, Downloads, Settings modal, and ORION panel inherit the same visual language. Real callbacks and secure IPC remain unchanged; the visual layer does not replace browser navigation, file operations, terminal execution, provider configuration, or agent actions with simulations.

The first-launch experience remains guided and first-launch-only: a short Synapse boot stage transitions into Welcome, provider setup, secure connection status, and ORION-ready completion. Skip Setup and `synapse.onboardingComplete` persistence remain intact. Reduced-motion preferences suppress orbit, particle, breathing, and large transition effects globally.

The whole-product visual implementation has been inspected in the built Electron renderer under `artifacts/whole-product-visual/` and `artifacts/onboarding-visual/`. The native Windows evidence bundle currently attached to CI predates this whole-product visual redesign; a fresh Windows packaged-app run is still required before claiming Windows visual acceptance for the new shell and animation layer.

## ORION browser agent

ORION observes the active website, plans bounded actions, uses semantic browser tools, verifies important results, and pauses for confirmation before consequential or cross-origin actions. Provider configuration is optional at startup and can be completed during onboarding or later in Settings. Supported provider families include OpenAI-compatible endpoints, Google, Anthropic, OpenRouter, Groq, Ollama, and custom OpenAI-compatible services.

The following real browser-agent proofs were completed against the built Electron application through its local DevTools endpoint:

| Proof | Result | Evidence |
|---|---|---|
| Wikipedia Bangalore | PASS | Navigated to `en.wikipedia.org/wiki/Bengaluru`, approved the confirmation gate, read the visible page, and rendered an answer identifying the article title and a fact. Screenshots: `artifacts/real-orion-wikipedia-confirmed/`. |
| Google weather with fallback | PASS | Navigated Google, detected the CAPTCHA/unusual-traffic page, opened `https://wttr.in/Bangalore?format=3`, read `+28°C`, and rendered the answer. Screenshots: `artifacts/real-orion-weather-wttr/`. |

The proof scripts are `scripts/real-orion-wikipedia-test.mjs` and `scripts/real-orion-weather-test.mjs`. They require a running Electron instance with a configured provider and a DevTools endpoint, for example `ELECTRON_CDP=http://127.0.0.1:9666`.

## Requirements

Use Node.js `>=24.0.0` and pnpm `>=9.0.0`. The repository lockfile is authoritative; use a frozen install for reproducible setup. The current sandbox build completed under Node 22 with an engine warning, so Node 24 or newer should be used for release builds.

## Installation and development

```bash
git clone https://github.com/Rahulrachu/synapse-browser.git
cd synapse-browser
pnpm install --frozen-lockfile
pnpm dev
```

AI provider credentials are optional during startup. Do not commit `.env` files, API keys, or user-data directories.

## Validation and build

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

`pnpm lint` currently runs strict TypeScript validation because the repository does not yet include an ESLint configuration. The detailed baseline and final audit are in [docs/FULL_AUDIT_BASELINE.md](docs/FULL_AUDIT_BASELINE.md) and [docs/FULL_AUDIT_FINAL_REPORT.md](docs/FULL_AUDIT_FINAL_REPORT.md).

## Packaging

The public Windows distribution is a normal NSIS installer. Download the `Synapse-Browser-1.0.5-Windows-x64-Setup.exe` asset from the [v1.0.5 release](https://github.com/Rahulrachu/synapse-browser/releases/tag/v1.0.5), double-click it, choose an installation directory if desired, and let it create Start Menu and Desktop shortcuts. The installer registers Synapse Browser for Windows uninstall. The ZIP remains available for portable use and CI diagnostics.

Build a platform-specific Electron Builder artifact with the relevant command:

```bash
pnpm run pack
pnpm dist:win   # NSIS installer + optional portable ZIP
pnpm dist:mac
pnpm dist:linux
```

The architecture and privileged-process boundaries are described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Common setup and platform limitations are described in [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md). The current acceptance matrix is [docs/RELEASE_ACCEPTANCE.md](docs/RELEASE_ACCEPTANCE.md), and the decision record is [docs/FINAL_RELEASE_REPORT.md](docs/FINAL_RELEASE_REPORT.md). The GitHub Actions workflow at `.github/workflows/release-validation.yml` typechecks, tests, builds, packages, and uploads Windows, macOS, and Linux artifacts.

## Native evidence

The successful Windows UI evidence bundle is available in CI and has been copied to `artifacts/windows-ui-evidence-ci/`. It contains native screenshots for launch/onboarding, post-onboarding browser UI, Settings, ORION input, and the ORION running/attention state. The bundle does not contain the requested Windows screen recording or a completed Windows provider-backed browser-agent result. Linux ORION screenshots and final response surfaces are stored under `artifacts/real-orion-wikipedia-confirmed/` and `artifacts/real-orion-weather-wttr/`.

## License

MIT License. See [LICENSE](LICENSE) for details.
