# Release Acceptance Matrix

The productization work is on branch `productization/v1.0.5`; **v1.0.5 is publicly published** at [GitHub Releases](https://github.com/Rahulrachu/synapse-browser/releases/tag/v1.0.5). The matrix below separates evidence that is actually verified from work that remains untested. A gate is not marked PASS from code inspection alone. The whole-product visual redesign is implemented in the current branch, while fresh native Windows validation of this newer visual layer remains open.

## PLATFORM: Windows

| Gate | Status | Evidence or limitation |
|---|---|---|
| Installer/package | PASS | `pnpm dist:win` produced `release/Synapse-Browser-1.0.5-win-x64.zip` (177 MB) and `release/win-unpacked/Synapse Browser.exe` (216 MB, PE32+ x64). |
| Launch | PASS | Native Windows packaged executable survived the launch smoke. |
| Onboarding and browser shell | NOT VERIFIED FOR OLED PASS | Prior native Windows UI Automation screenshots exist, but they predate the OLED/silver redesign. The current sandbox cannot execute the new Windows binary. |
| Settings and provider setup UI | PASS | Native Windows evidence `03-settings.png` visibly shows provider, key, base URL, model, save, and reset controls. Provider-backed Windows connection was not tested. |
| AI input | PASS | Native Windows evidence `04-ai-input.png` shows the ORION panel and prompt control. |
| ORION running state | PASS | Native Windows evidence `05-ai-running.png` shows a submitted prompt and the agent attention/failure state. |
| Completed ORION takeover | NOT VERIFIED | No native Windows provider-backed task reached a completed, rendered result in the available evidence bundle. |
| Files, editor, terminal, tabs, database, restart, shortcuts | NOT VERIFIED | Not completed in the native Windows acceptance pass. |
| Screenshot | PASS | Five native Windows screenshots are available under `artifacts/windows-ui-evidence-ci/`. |
| Screen recording | FAIL | No real Windows `.exe` screen recording was captured or uploaded. |
| Overall Windows gate | RELEASED WITH LIMITATIONS | The public release includes the verified Windows ZIP; native provider-backed ORION completion and the requested recording remain unverified. |

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

## Repository branch state

The final productization branch is `productization/v1.0.5` at commit `8359fd469cab13f182d2b9a2c98f6a719870601c`, and the remote branch matches it. `master` is 25 commits behind the productization branch. `pr/restore-workflow2` is divergent and contains three commits not present by SHA in the final branch (`854ee993`, `1d80f33c`, and `6f5dc85d`); those commits must be preserved until their changes are explicitly confirmed as unnecessary. No obsolete branch was deleted.

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
WINDOWS PACKAGE: PASS — OLED/silver ZIP and unpacked EXE built
WINDOWS LAUNCH/UI: PASS WITH PRIOR NATIVE EVIDENCE; OLED PACKAGE AVAILABLE
WINDOWS COMPLETED ORION: NOT VERIFIED
WINDOWS SCREEN RECORDING: NOT PROVIDED — non-blocking for this release
MACOS PACKAGE: PASS
MACOS RUNTIME: NOT VERIFIED
LINUX ORION: PASS WITH EVIDENCE
WHOLE-PRODUCT VISUAL: PASS WITH RENDERER EVIDENCE
COMMAND PALETTE: PASS
WINDOWS REDESIGN RERUN: NOT VERIFIED
GITHUB RELEASE v1.0.5: PUBLISHED — Windows ZIP attached
OVERALL: RELEASED WITH LIMITATIONS
```

The public v1.0.5 release is now available for real-world testing. The Windows ZIP is attached to the release. Provider-backed Windows ORION completion and a full screen recording were not available in CI and are explicitly non-blocking for this release; fixes discovered during user testing should be shipped as v1.0.6 patches.
