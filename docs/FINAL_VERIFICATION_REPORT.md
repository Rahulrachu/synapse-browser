# Synapse Browser v1.0.5 Final Verification Report

## Executive decision

The recovery and productization work is functionally advanced, but **v1.0.5 must not be published yet**. The core ORION browser-agent workflow is proven in the built Electron application on Linux, including real browser takeover, confirmation handling, page reading, and response rendering. Native Windows launch and the principal UI surfaces are proven by a successful CI evidence bundle. The requested completed Windows ORION workflow and real Windows screen recording are still missing, so the overall release gate remains blocked.

## First-launch experience verification

The basic Welcome card was redesigned into a first-launch-only cinematic flow. The implementation now includes a short Synapse boot stage with logo/orbit motion and staged readiness indicators, an ambient dark welcome reveal, a dedicated provider-selection and configuration screen, animated selected states, secure connection status messaging, and a final ORION-ready transition. Existing `synapse.onboardingComplete` persistence, Skip Setup semantics, provider IPC channels, main-process credential handling, accessible button/input labels, keyboard focus behavior, and reduced-motion fallbacks were retained.

The built Electron renderer was visually inspected under `artifacts/onboarding-visual/`. The welcome and provider setup states rendered correctly, and the provider setup smoke confirmed the expected region and Save and Continue control. The persistence smoke confirmed the boot stage, Welcome stage, keyboard focus on Skip Setup, Skip Setup completion, persisted local-storage state, browser tabs after transition, and no onboarding screen after reload. The earliest boot frame was not captured by the current renderer-attached smoke because the app had already reached the renderer by connection time; a true process-launch recording remains a native desktop follow-up.

## Whole-product visual verification

The cinematic onboarding visual language was extended across the browser shell, sidebar, tabs, address surface, navigation progress line, workspace surfaces, Settings modal, and ORION panel. Shared CSS tokens and React primitives now provide consistent surfaces, icon buttons, inputs, reveals, active rails, modal treatment, ORION presence, result cards, and timeline motion. A Ctrl/Cmd+K command palette was also added with real actions for Settings, New Tab, Terminal, ORION, and History.

The built renderer was visually inspected under `artifacts/whole-product-visual-latest/`. The browser shell, ORION panel, Files workspace, Terminal workspace, and Settings modal were captured. The command palette smoke opened the floating surface and found all five expected commands. These are renderer/Xvfb results; they are not native Windows visual acceptance of the new shell.

## ORION proof results

### Wikipedia Bangalore

The real provider-backed test `scripts/real-orion-wikipedia-test.mjs` completed successfully against the built Electron application. ORION opened Wikipedia, paused on its cross-origin confirmation gate, received approval in the controlled acceptance script, navigated to `https://en.wikipedia.org/wiki/Bengaluru`, read the visible page, and rendered this verified answer:

> Article title: Bengaluru. One fact: Bengaluru, also known as Bangalore, is the capital and largest city of Karnataka.

Evidence is stored in `artifacts/real-orion-wikipedia-confirmed/`, including `04-final.png`.

### Bangalore weather

The real provider-backed test `scripts/real-orion-weather-test.mjs` completed successfully. Google returned an unusual-traffic/CAPTCHA page; ORION treated that as a blocker, navigated to the explicitly permitted fallback `https://wttr.in/Bangalore?format=3`, read the visible result, and rendered:

> Bangalore: +28°C

Evidence is stored in `artifacts/real-orion-weather-wttr/`, including `04-final.png`.

These results verify the previously missing response surface: the AI panel visibly renders `ORION RESPONSE`, the final answer, `Finished`, update count, completion phase, confidence, and verified-evidence status.

## OLED/silver Windows package

The updated branch was packaged successfully with `pnpm dist:win`. The generated artifacts are `release/Synapse-Browser-1.0.5-win-x64.zip` (177 MB) and `release/win-unpacked/Synapse Browser.exe` (216 MB, PE32+ x64). The sandbox contains no Wine, PowerShell, or native Windows runtime, so the new `.exe` could not be launched here. The package build is verified; native Windows execution, DPI, WebContentsView layering, provider-backed ORION completion, and the requested recording remain unverified.

## Native Windows evidence

The previous successful Windows UI automation bundle predates both the whole-product visual redesign and the OLED/silver material pass. It remains valid evidence for the underlying native launch, browser, Settings, provider, ORION input, and running-state surfaces, but it must not be presented as visual acceptance of the new material layer. A fresh packaged Windows run is required to validate the updated first-launch timing, DPI behavior, browser layering, and recording requirements.

The successful Windows UI automation run `32935389959` produced and the project now contains `artifacts/windows-ui-evidence-ci/` with five 1024×720 screenshots:

| File | Verified content |
|---|---|
| `01-launch.png` | Packaged Synapse Browser window and first-launch onboarding card. |
| `02-after-skip.png` | Onboarding dismissed; browser shell, Google, tab strip, sidebar, and READY status. |
| `03-settings.png` | Settings surface and AI provider configuration controls. |
| `04-ai-input.png` | ORION panel and prompt input control. |
| `05-ai-running.png` | Submitted native Windows prompt and agent attention/failure state. |

This is genuine native Windows evidence from CI, not a Linux rendering relabeled as Windows. It does not prove a completed Windows provider-backed ORION task, and it is not a screen recording.

## Repository branch state

The remote `productization/v1.0.5` branch matches the locked OLED/silver commit `8359fd469cab13f182d2b9a2c98f6a719870601c`. `master` is behind by 25 commits. `pr/restore-workflow2` is divergent and has three commits not present by SHA in the final branch, so it was preserved rather than deleted. This satisfies the history-preservation rule; branch simplification must wait until those unique changes are reviewed or intentionally archived.

## Local validation

The final local validation completed successfully:

```text
pnpm typecheck       PASS
pnpm test --run      PASS — 9 files, 37 tests
pnpm build           PASS
git diff --check     PASS
```

The local environment emitted an engine warning because it has Node 22 while the project requires Node 24 or newer for release builds. The release build should therefore be repeated under Node 24+ before publishing.

## Release gate assessment

The green GitHub Actions run `32942383476` validates builds and automated tests on Windows, macOS, and Ubuntu and produced an exact-commit Windows artifact plus five native Windows UI screenshots. However, the Windows smoke script only enters a sample prompt and captures the running state; it does not configure a provider, complete a real ORION task, verify a final response, or record the workflow. Therefore the public v1.0.5 release was not created.

## Remaining blockers

The following items remain open and are intentionally not marked PASS:

1. A real Windows desktop must run the packaged `.exe` with valid provider credentials and complete at least the Wikipedia and weather ORION tasks.
2. The complete Windows workflow must be screen-recorded from Launch through Onboarding, AI Config, Browser Takeover, and Result.
3. Interactive macOS runtime acceptance remains unverified even though macOS packaging completed in CI.
4. Full tabs, workspace CRUD, terminal lifecycle, database restart persistence, shortcuts, and long-run performance acceptance remain partial.

The acceptance matrix in [RELEASE_ACCEPTANCE.md](RELEASE_ACCEPTANCE.md) is the authoritative release decision. No GitHub v1.0.5 release was created because the recording and Windows completed-agent gates are not satisfied.
