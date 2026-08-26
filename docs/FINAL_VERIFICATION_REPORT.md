# Synapse Browser v1.0.5 Final Verification Report

## Executive decision

The recovery and productization work is functionally advanced, but **v1.0.5 must not be published yet**. The core ORION browser-agent workflow is proven in the built Electron application on Linux, including real browser takeover, confirmation handling, page reading, and response rendering. Native Windows launch and the principal UI surfaces are proven by a successful CI evidence bundle. The requested completed Windows ORION workflow and real Windows screen recording are still missing, so the overall release gate remains blocked.

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

## Native Windows evidence

The successful Windows UI automation run `32935389959` produced and the project now contains `artifacts/windows-ui-evidence-ci/` with five 1024×720 screenshots:

| File | Verified content |
|---|---|
| `01-launch.png` | Packaged Synapse Browser window and first-launch onboarding card. |
| `02-after-skip.png` | Onboarding dismissed; browser shell, Google, tab strip, sidebar, and READY status. |
| `03-settings.png` | Settings surface and AI provider configuration controls. |
| `04-ai-input.png` | ORION panel and prompt input control. |
| `05-ai-running.png` | Submitted native Windows prompt and agent attention/failure state. |

This is genuine native Windows evidence from CI, not a Linux rendering relabeled as Windows. It does not prove a completed Windows provider-backed ORION task, and it is not a screen recording.

## Local validation

The final local validation completed successfully:

```text
pnpm typecheck       PASS
pnpm test --run      PASS — 9 files, 37 tests
pnpm build           PASS
git diff --check     PASS
```

The local environment emitted an engine warning because it has Node 22 while the project requires Node 24 or newer for release builds. The release build should therefore be repeated under Node 24+ before publishing.

## Remaining blockers

The following items remain open and are intentionally not marked PASS:

1. A real Windows desktop must run the packaged `.exe` with valid provider credentials and complete at least the Wikipedia and weather ORION tasks.
2. The complete Windows workflow must be screen-recorded from Launch through Onboarding, AI Config, Browser Takeover, and Result.
3. Interactive macOS runtime acceptance remains unverified even though macOS packaging completed in CI.
4. Full tabs, workspace CRUD, terminal lifecycle, database restart persistence, shortcuts, and long-run performance acceptance remain partial.

The acceptance matrix in [RELEASE_ACCEPTANCE.md](RELEASE_ACCEPTANCE.md) is the authoritative release decision. No GitHub v1.0.5 release was created because the recording and Windows completed-agent gates are not satisfied.
