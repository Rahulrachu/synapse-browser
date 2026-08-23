# Synapse Browser Full Audit Baseline

## Scope and repository state

The repository was cloned from `Rahulrachu/synapse-browser` at commit `a4e829aa` (`v1.0.4`) on the recovery branch `antigravity/full-audit-fix`. The working tree was clean before diagnostics. The source is an Electron + React + TypeScript application built with electron-vite, using Zustand, SQLite/sqlite3, Monaco, Tailwind, and Vitest.

## Baseline commands

| Command | Result | Severity | Notes |
|---|---|---:|---|
| `pnpm install --frozen-lockfile` | PASS with warning | P2 | Lockfile and native sqlite3 rebuild succeeded. The package declares Node `>=24.0.0`, while the current environment is Node `22.13.0`. |
| `pnpm typecheck` | FAIL | P0 | No `typecheck` script exists; pnpm reports command not found. |
| `pnpm lint` | FAIL | P2 | No `lint` script exists; pnpm reports command not found. |
| `pnpm test --run` | PASS | P2 | 8 test files and 35 tests passed. Coverage is concentrated in agent/state logic; no end-to-end Electron smoke suite is present in the baseline. |
| `pnpm build` | PASS | P1 | Electron main, preload, and renderer bundles were produced. A passing bundle does not establish runtime correctness. |

## Initial findings

The repository has a very large dependency graph and a small active source tree. The package exposes build, dev, preview, package, and test workflows, but no explicit typecheck or lint workflow. The renderer bridge is broadly typed with `any` and dynamic channel strings. Several filesystem paths are composed from user/project input and require a complete confinement audit. Runtime behavior of the Electron window, browser view, IPC, and packaged paths still requires launch verification.

## Required follow-up

1. Inspect the main process, preload, renderer, browser manager, project manager, storage/database layer, and package configuration in detail.
2. Add reproducible typecheck and lint commands without weakening compiler strictness or suppressing errors.
3. Run development and packaged launch smoke tests in the available headless environment, documenting platform limitations where Windows-only behavior cannot be exercised.
4. Add or repair tests for IPC contracts, navigation/tab state, persistence, and safe filesystem operations.
