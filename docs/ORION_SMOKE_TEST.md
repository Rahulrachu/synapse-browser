# ORION Smoke Test and Reliability Notes

## Scope

This smoke test validates that the Synapse renderer loads, the ORION panel accepts a natural-language goal, and the UI remains usable when the Electron preload bridge is unavailable during hosted previews or diagnostics.

## Findings

The initial renderer loaded as a blank page. React reported an exception from `AIWorkspacePanel`; the panel called React hooks without importing them. After restoring the hook import, the hosted renderer still failed when `window.electron` was unavailable because the main layout, browser surface, and ORION event subscription assumed the desktop preload bridge always existed.

## Changes

The renderer now initializes a local preview tab when the Electron bridge is absent, skips browser-area IPC in non-Electron hosts, and shows a clear ORION availability message instead of throwing. The desktop path remains unchanged and continues to use the preload bridge for tabs, browser embedding, and agent events.

## Validation

The following commands pass in the repository environment:

```text
pnpm build
pnpm test --run
```

The test suite reports 7 passing test files and 25 passing tests. The build completes for the main process, preload, and renderer bundles.

The repository-wide TypeScript no-emit check currently fails on pre-existing missing modules and stale APIs, including `AgentLogger`, `EventBus`, `PromptManager`, `src/common/types/*`, and legacy `ipcRenderer` references. These should be addressed in a separate typed-integration cleanup before treating `tsc --noEmit` as a release gate.

## Desktop agent test boundary

A real cross-site task such as copying a YouTube Studio value into Telegram Saved Messages requires authenticated user sessions in the desktop browser. This environment did not use the user's accounts or submit an external Telegram message. Consequential actions are designed to pause for explicit confirmation before submission.
