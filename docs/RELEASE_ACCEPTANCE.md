# Release Acceptance Matrix

The current productization work is on branch `productization/v1.0.5` and is **not released**. The public release remains `v1.0.4`. Linux validation was performed in the sandbox with a real packaged Electron window and X11 mouse/keyboard interaction. Windows and macOS environments were not available and are not marked as verified.

## PLATFORM: Windows

```text
INSTALLER: FAIL — Windows installer was not built or executed in this Linux environment.
LAUNCH: FAIL — Not tested on Windows.
UI CLICKING: FAIL — Not tested on Windows.
SETTINGS: FAIL — Not tested on Windows.
BROWSER: FAIL — Not tested on Windows.
TABS: FAIL — Not tested on Windows.
AI INPUT: FAIL — Not tested on Windows.
AI RUN: FAIL — Not tested on Windows.
FILES: FAIL — Not tested on Windows.
EDITOR: FAIL — Not tested on Windows.
TERMINAL: FAIL — Not tested on Windows.
POWERSHELL: FAIL — Not tested on Windows.
DATABASE: FAIL — Not tested on Windows.
SHORTCUTS: FAIL — Not tested on Windows.
RESTART: FAIL — Not tested on Windows.
SCREENSHOT: FAIL — No Windows screenshot.
SCREEN RECORDING: FAIL — No Windows recording.
OVERALL: FAIL
```

## PLATFORM: macOS

```text
INSTALLER: FAIL — macOS artifact and runtime were not built or tested.
LAUNCH: FAIL — Not tested on macOS.
UI CLICKING: FAIL — Not tested on macOS.
SETTINGS: FAIL — Not tested on macOS.
BROWSER: FAIL — Not tested on macOS.
TABS: FAIL — Not tested on macOS.
AI INPUT: FAIL — Not tested on macOS.
AI RUN: FAIL — Not tested on macOS.
FILES: FAIL — Not tested on macOS.
EDITOR: FAIL — Not tested on macOS.
TERMINAL: FAIL — Not tested on macOS.
POWERSHELL: FAIL — Not applicable; no macOS shell validation was performed.
DATABASE: FAIL — Not tested on macOS.
SHORTCUTS: FAIL — Not tested on macOS.
RESTART: FAIL — Not tested on macOS.
SCREENSHOT: FAIL — No macOS screenshot.
SCREEN RECORDING: FAIL — No macOS recording.
OVERALL: FAIL
```

## PLATFORM: Linux

```text
INSTALLER: PASS — Electron Builder produced `Synapse Browser-1.0.5.AppImage` and `synapse-browser_1.0.5_amd64.deb`; the unpacked package was also produced.
LAUNCH: PASS — Packaged Electron window launched under Xvfb.
UI CLICKING: PASS — X11 mouse clicks interacted with Settings and AI controls.
SETTINGS: PASS — Settings opened, rendered, and displayed interactive checkboxes.
BROWSER: PASS — Packaged browser view rendered Google and responded to the visible runtime.
TABS: PARTIAL — A tab rendered and the tab strip was visible; full multi-tab regression remains incomplete.
AI INPUT: PASS — Real X11 keyboard input appeared in the AI textarea.
AI RUN: PASS — Real X11 click changed the button to Stop and the panel entered LIVE/planning state.
FILES: PARTIAL — Functional project-open and project-file listing actions are wired through secure IPC; complete CRUD, invalid-path, and permission-failure cases were not manually exercised.
EDITOR: PARTIAL — Functional read/edit/save actions are wired through secure IPC; the complete Monaco, dirty-state, reopen, and invalid-file workflow was not manually exercised.
TERMINAL: PARTIAL — Functional command input and output are wired to the existing constrained terminal handler; lifecycle and process tests were not manually exercised.
POWERSHELL: FAIL — Windows-only and unavailable.
DATABASE: PARTIAL — Existing unit coverage and build passed; full restart persistence was not manually exercised.
SHORTCUTS: PARTIAL — Existing Electron menu accelerators remain; complete shortcut matrix was not manually exercised.
RESTART: FAIL — Not completed in the interactive pass.
SCREENSHOT: PASS — Real Linux screenshots captured under artifacts/smoke.
SCREEN RECORDING: FAIL — No final recording captured.
OVERALL: FAIL — Windows/macOS acceptance and several complete Linux workflows remain outstanding.
```
