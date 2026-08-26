# Release Acceptance Matrix

The productization work is on branch `productization/v1.0.5`; **v1.0.5 is not published**. The matrix below separates evidence that is actually verified from work that remains untested. A gate is not marked PASS from code inspection alone. The whole-product visual redesign is implemented in the current branch, while fresh native Windows validation of this newer visual layer remains open.

## PLATFORM: Windows

| Gate | Status | Evidence or limitation |
|---|---|---|
| Installer/package | PASS | Native GitHub Actions packaging produced Windows artifacts. |
| Launch | PASS | Native Windows packaged executable survived the launch smoke. |
| Onboarding and browser shell | PASS WITH PRIOR EVIDENCE | Native Windows UI Automation run `32935389959` produced `artifacts/windows-ui-evidence-ci/01-launch.png` and `02-after-skip.png`; those screenshots predate the whole-product visual redesign. |
| Settings and provider setup UI | PASS | Native Windows evidence `03-settings.png` visibly shows provider, key, base URL, model, save, and reset controls. Provider-backed Windows connection was not tested. |
| AI input | PASS | Native Windows evidence `04-ai-input.png` shows the ORION panel and prompt control. |
| ORION running state | PASS | Native Windows evidence `05-ai-running.png` shows a submitted prompt and the agent attention/failure state. |
| Completed ORION takeover | NOT VERIFIED | No native Windows provider-backed task reached a completed, rendered result in the available evidence bundle. |
| Files, editor, terminal, tabs, database, restart, shortcuts | NOT VERIFIED | Not completed in the native Windows acceptance pass. |
| Screenshot | PASS | Five native Windows screenshots are available under `artifacts/windows-ui-evidence-ci/`. |
| Screen recording | FAIL | No real Windows `.exe` screen recording was captured or uploaded. |
| Overall Windows gate | BLOCKED | Native launch and core UI are evidenced; full ORION completion and the requested recording remain open. |

## PLATFORM: macOS

| Gate | Status | Evidence or limitation |
|---|---|---|
| Package artifact | PASS | GitHub Actions produced a macOS artifact in the successful release-validation run. |
| Runtime, UI, browser, AI, workspace, restart | NOT VERIFIED | No interactive macOS runtime acceptance evidence was captured. |
| Overall macOS gate | BLOCKED | Package creation alone is not runtime acceptance. |

## PLATFORM: Linux

| Gate | Status | Evidence or limitation |
|---|---|---|
| Installer/package | PASS | Electron Builder produced the AppImage, deb, and unpacked package. |
| Launch and browser shell | PASS | Built Electron application launched under Xvfb and rendered Google. |
| Onboarding, Settings, AI input | PASS | Real renderer interaction and screenshots are available in `artifacts/smoke/`. |
| ORION Wikipedia takeover | PASS | Real provider-backed run approved the cross-origin confirmation, navigated to `https://en.wikipedia.org/wiki/Bengaluru`, read the visible page, and rendered a final answer. Evidence: `artifacts/real-orion-wikipedia-confirmed/04-final.png`. |
| ORION weather takeover | PASS | Real provider-backed run searched Google, detected the CAPTCHA page, navigated to `https://wttr.in/Bangalore?format=3`, read `+28°C`, and rendered a final answer. Evidence: `artifacts/real-orion-weather-wttr/04-final.png`. |
| Tabs | PARTIAL | A browser tab and tab strip are verified; full multi-tab regression remains incomplete. |
| Files and editor | PARTIAL | Secure IPC handlers are wired; complete CRUD, dirty-state, reopen, and failure cases were not manually exercised. |
| Terminal | PARTIAL | Constrained terminal integration is wired; lifecycle and process tests were not manually exercised. |
| Database and restart | PARTIAL | Unit/build coverage passed; full close/relaunch persistence was not manually exercised. |
| Screen recording | FAIL | No Linux recording was requested as a substitute for the native Windows recording. |
| Whole-product visual system | PASS WITH LIMITATIONS | The current built renderer was visually inspected across browser shell, ORION, Files, Terminal, and Settings under `artifacts/whole-product-visual-latest/`; visual smoke is renderer/Xvfb evidence, not native Windows evidence. |
| Command palette | PASS | Ctrl/Cmd+K opened the floating command surface with Open Settings, New Tab, Open Terminal, Ask ORION, and Search History commands. |
| Overall Linux gate | PASS WITH LIMITATIONS | The core ORION proof and current whole-product renderer styling are complete on Linux; broader workspace and lifecycle acceptance remains partial. |

## Automated validation

The verified local commands are:

```text
pnpm typecheck
pnpm test --run
pnpm build
git diff --check
```

The current local build completed successfully, and the test suite previously reported 37 tests across 9 files. The successful native release-validation run produced Windows, macOS, and Linux package artifacts. The Windows UI evidence run is `32935389959`; the package validation run is `32872335608`.

## Release decision

```text
CODE: PASS — current application sources build and typecheck
TESTS: PASS — existing suite previously reported 37 tests across 9 files
BUILD: PASS
WINDOWS PACKAGE: PASS
WINDOWS LAUNCH/UI: PASS WITH EVIDENCE
WINDOWS COMPLETED ORION: NOT VERIFIED
WINDOWS SCREEN RECORDING: FAIL
MACOS PACKAGE: PASS
MACOS RUNTIME: NOT VERIFIED
LINUX ORION: PASS WITH EVIDENCE
WHOLE-PRODUCT VISUAL: PASS WITH RENDERER EVIDENCE
COMMAND PALETTE: PASS
WINDOWS REDESIGN RERUN: NOT VERIFIED
GITHUB RELEASE v1.0.5: NOT CREATED
OVERALL: NOT RELEASE READY
```

The correct next release action is to run the packaged application on a real Windows desktop with valid provider credentials, complete at least the Wikipedia and weather ORION tasks, capture the full Launch → Onboarding → AI Config → Browser Takeover → Result recording, and attach that recording to the release evidence. Until then, publishing v1.0.5 would contradict the requested acceptance standard.
